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

    producerTransport = device.createSendTransport(transportInfo);

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

  consumerTransport = device.createRecvTransport(transportInfo);

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
function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).substring(7);

    const handler = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        // console.log("WEBRTC REQ CHECK:", msg.id, id, msg.type); // Verbose
        if (msg.id === id) {
          console.log(`[Mediasoup] Request resolved: ${type} `);
          state.socket.removeEventListener('message', handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.routerRtpCapabilities || msg.params || msg);
        }
      } catch (e) { }
    };

    // Add temp listener
    // Note: This is hacky because we have a global onmessage in socket.js 
    // Ideally we should dispatch events in socket.js.
    // Let's rely on socket.js to dispatch? 
    // For now, let's just listen directly on the socket instance if possible, 
    // OR we modify socket.js to handle responses.

    // Implementation Plan: 
    // We'll update socket.js to emit custom events or use a callback map.
    // For simplicity here, let's assume we update socket.js to delegate 'response' types to us.
    // But since we can't easily modify socket.js state from here without export,
    // let's add a temporary listener on the socket itself.

    state.socket.addEventListener('message', handler);

    state.socket.send(JSON.stringify({
      type,
      id,
      channel: state.roomId,
      ...data
    }));

    setTimeout(() => {
      state.socket.removeEventListener('message', handler);
      reject('Timeout');
    }, 5000);
  });
}