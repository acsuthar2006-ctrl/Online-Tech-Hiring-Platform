// webrtc.js - Mediasoup Implementation
import { state } from "../core/state.js";
import { remoteVideo, hideWaitingOverlay, remoteScreenVideo, setScreenShareMode } from "./ui.js";
import MediasoupClient from "mediasoup-client";
const { Device } = MediasoupClient;
import { sendSignal } from "../core/socket.js";

let device;
let producerTransport;
let consumerTransport;
let audioProducer;
let videoProducer;
let screenProducer; // New Screen Producer
let consumer;


export async function createPeerConnection(signalFunc) {
  // This function is called by joinCall/startCall
  // For Mediasoup, we initialize the device and transports.

  if (device) return; // Already initialized

  console.log("[Mediasoup] Loading Device...");

  // 1. Get Router Capabilities
  console.log("[Mediasoup] Requesting Capabilities...");
  const routerRtpCapabilities = await request('getRouterRtpCapabilities');
  console.log("[Mediasoup] Got Capabilities:", routerRtpCapabilities);

  device = new MediasoupClient.Device();

  await device.load({ routerRtpCapabilities });
  console.log("[Mediasoup] Device loaded.");
  console.log("[Mediasoup] Can produce video?", device.canProduce('video'));

  // 2. Create Send Transport (for our local stream)
  if (state.localStream) {
    const transportInfo = await request('createWebRtcTransport', {
      forceTcp: false,
      rtpCapabilities: device.rtpCapabilities
    });

    // Add STUN servers for NAT traversal
    const transportOptions = {
      ...transportInfo,
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    };

    producerTransport = device.createSendTransport(transportOptions);

    producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await request('connectWebRtcTransport', {
          transportId: producerTransport.id,
          dtlsParameters
        });
        callback();
      } catch (error) {
        errback(error);
      }
    });

    producerTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const { producerId } = await request('produce', {
          transportId: producerTransport.id,
          kind,
          rtpParameters,
          appData
        });
        callback({ id: producerId });
      } catch (error) {
        errback(error);
      }
    });

    producerTransport.on('connectionstatechange', state => {
      console.log('[Mediasoup] Producer Transport State:', state);
    });

    // Produce Audio
    const audioTrack = state.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioProducer = await producerTransport.produce({ track: audioTrack });
    }

    // Produce Video
    const videoTrack = state.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoProducer = await producerTransport.produce({ track: videoTrack });
    }
  }

  // 3. Create Recv Transport (for remote streams)
  const transportInfo = await request('createWebRtcTransport', {
    forceTcp: false,
    rtpCapabilities: device.rtpCapabilities
  });

  const transportOptions = {
    ...transportInfo,
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  consumerTransport = device.createRecvTransport(transportOptions);

  consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    try {
      await request('connectWebRtcTransport', {
        transportId: consumerTransport.id,
        dtlsParameters
      });
      callback();
    } catch (error) {
      errback(error);
    }
  });

  consumerTransport.on('connectionstatechange', state => {
    console.log('[Mediasoup] Consumer Transport State:', state);
  });

  console.log("[Mediasoup] Transports initialized");

  // 4. Get existing producers in the room
  const { list } = await request('getProducers');
  console.log("[Mediasoup] Existing producers:", list);
  for (const p of list) {
    await consumeProducer(p.id, p.kind);
  }
}


// 5. Start Screen Share
export async function startScreenShare(stream) {
  if (!device || !producerTransport) return;

  const track = stream.getVideoTracks()[0];
  if (!track) return;

  console.log("[Mediasoup] Starting Screen Share...");

  try {
    screenProducer = await producerTransport.produce({
      track,
      appData: { source: 'screen' } // Tag as screen
    });

    console.log("[Mediasoup] Screen Producer created:", screenProducer.id);

    screenProducer.on("trackended", () => {
      console.log("[Mediasoup] Screen track ended");
      stopScreenShare();
    });

    // Return producer to caller to handle UI updates if needed
    return screenProducer;

  } catch (err) {
    console.error("[Mediasoup] Screen share error:", err);
  }
}

export function stopScreenShare() {
  if (screenProducer) {
    const id = screenProducer.id;
    screenProducer.close();
    screenProducer = null;
    console.log("[Mediasoup] Screen sharing stopped");

    // Notify server to close producer and update recording
    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(JSON.stringify({
        type: 'closeProducer',
        producerId: id,
        channel: state.roomId
      }));
    }
  }
}


// Global helper to consume new producers
export async function consumeProducer(producerId, kind) {
  if (!device) return;

  const rtpCapabilities = device.rtpCapabilities;

  const {
    id,
    kind: consumerKind,
    rtpParameters,
    type,
    appData
  } = await request('consume', {
    transportId: consumerTransport.id,
    producerId,
    rtpCapabilities
  });

  const consumer = await consumerTransport.consume({
    id,
    producerId,
    kind: consumerKind,
    rtpParameters,
    appData: { ...appData } // Ensure appData is passed
  });

  const stream = new MediaStream();
  stream.addTrack(consumer.track);

  // Resume consumer (server starts paused)
  await request('resume', { consumerId: consumer.id });

  if (kind === 'video') {
    const isScreen = consumer.appData && consumer.appData.source === 'screen';
    // Use screen video element if source is screen
    const videoEl = isScreen ? document.getElementById("remote-screen-video") : remoteVideo;

    videoEl.srcObject = stream;

    if (isScreen) {
      videoEl.style.display = 'block';
      setScreenShareMode(true);
      // Optional: Make screen share dominant? 
      // For now, just show it.
    } else {
      videoEl.classList.add('active');
      hideWaitingOverlay();
    }

    // Explicitly play to avoid autoplay policies
    videoEl.setAttribute('playsinline', 'true'); // Required for iOS/some browsers
    videoEl.muted = true; // Ensure muted to allow autoplay (especially for local/remote mix issues)

    videoEl.onloadedmetadata = () => {
      videoEl.play().catch(e => {
        if (e.name === 'AbortError') {
          // Ignore abort errors caused by rapid stream switching
          console.log('[Mediasoup] Play aborted (likely new stream loaded)');
        } else {
          console.error(`[Mediasoup] Video play failed:`, e);
        }
      });
    };


    console.log(`[Mediasoup] Video track: enabled=${consumer.track.enabled}, state=${consumer.track.readyState}, muted=${consumer.track.muted}`);

    // Update UI
    if (!isScreen) hideWaitingOverlay();

    // Handle track ended to reset UI (if needed server-side close event isn't enough)
    stream.onremovetrack = () => {
      console.log(`[Mediasoup] Stream track removed (kind: ${kind})`);
      if (isScreen) {
        setScreenShareMode(false);
        videoEl.style.display = 'none';
      }
    };

  } else {

    // play audio
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play().catch(e => console.error(`[Mediasoup] Audio play failed`, e));
  }

  console.log(`[Mediasoup] Consuming ${kind} (id: ${consumer.id})`);
}

window.consumeProducer = consumeProducer;

// --- Helper for request/response pattern via WebSocket ---
// Refactored to use a single listener map instead of creating new listeners per request
const pendingRequests = new Map();

function setupResponseHandler() {
  state.socket.addEventListener('message', (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve, reject, timer } = pendingRequests.get(msg.id);
        clearTimeout(timer);
        pendingRequests.delete(msg.id);

        if (msg.error) {
          reject(msg.error);
        } else {
          resolve(msg.routerRtpCapabilities || msg.params || msg);
        }
      }
    } catch (e) {
      console.error('[Mediasoup] Error handling message:', e);
    }
  });
}

function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    // Initialize handler once
    if (pendingRequests.size === 0 && !state.socket._hasResponseHandler) {
      setupResponseHandler();
      state.socket._hasResponseHandler = true;
    }

    const id = Math.random().toString(36).substring(7);

    const timer = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject('Timeout');
      }
    }, 10000); // 10s timeout

    pendingRequests.set(id, { resolve, reject, timer });

    state.socket.send(JSON.stringify({
      type,
      id,
      channel: state.roomId,
      ...data
    }));
  });
}