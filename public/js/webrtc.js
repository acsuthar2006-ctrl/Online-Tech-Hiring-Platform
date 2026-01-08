// webrtc.js - Mediasoup Implementation
import { state } from "./state.js";
import { remoteVideo, hideWaitingOverlay } from "./ui.js";
import MediasoupClient from "mediasoup-client";
const { Device } = MediasoupClient;
import { sendSignal } from "./socket.js";

let device;
let producerTransport;
let consumerTransport;
let audioProducer;
let videoProducer;
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

// Global helper to consume new producers
export async function consumeProducer(producerId, kind) {
  if (!device) return;

  const rtpCapabilities = device.rtpCapabilities;

  const {
    id,
    kind: consumerKind,
    rtpParameters,
    type
  } = await request('consume', {
    transportId: consumerTransport.id,
    producerId,
    rtpCapabilities
  });

  const consumer = await consumerTransport.consume({
    id,
    producerId,
    kind: consumerKind,
    rtpParameters
  });

  const stream = new MediaStream();
  stream.addTrack(consumer.track);

  // Resume consumer (server starts paused)
  await request('resume', { consumerId: consumer.id });

  if (kind === 'video') {
    remoteVideo.srcObject = stream;
    remoteVideo.classList.add('active');

    // Explicitly play to avoid autoplay policies
    remoteVideo.play().catch(e => console.error(`[Mediasoup] Video play failed:`, e));

    console.log(`[Mediasoup] Video track: enabled=${consumer.track.enabled}, state=${consumer.track.readyState}, muted=${consumer.track.muted}`);

    // Update UI
    hideWaitingOverlay();
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