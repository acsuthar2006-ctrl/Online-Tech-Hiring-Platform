import { state } from "../core/state.js";
import { request } from "./signaling.js";
import {
  remoteVideo,
  hideWaitingOverlay,
  remoteScreenVideo,
  setScreenShareMode,
} from "../modules/call-ui.js";
import { Device } from "mediasoup-client";

let device;
let producerTransport;
let consumerTransport;
let audioProducer;
let videoProducer;

const consumers = new Map(); // Key: producerId, Value: consumer

// Getters for other modules
export const getDevice = () => device;
export const getProducerTransport = () => producerTransport;
export const getConsumer = (producerId) => consumers.get(producerId);

export function removeConsumer(producerId) {
  const consumer = consumers.get(producerId);
  if (consumer) {
    if (consumer.appData && consumer.appData.source === "screen") {
      console.log("[Mediasoup] Screen share consumer closing - resetting UI");
      import("../modules/call-ui.js").then((ui) => {
        ui.setScreenShareMode(false);
        const el = document.getElementById("remote-screen-video");
        if (el) {
          el.srcObject = null;
          el.style.display = "none";
        }
      });
    }

    consumer.close();
    consumers.delete(producerId);
    console.log(`[Mediasoup] Removed consumer for producer: ${producerId}`);
  }
}

export async function createPeerConnection() {
  if (device) return; // Already initialized

  console.log("[Mediasoup] Loading Device...");

  // 1. Get Router Capabilities
  console.log("[Mediasoup] Requesting Capabilities...");
  const routerRtpCapabilities = await request("getRouterRtpCapabilities");

  device = new Device();

  await device.load({ routerRtpCapabilities });
  console.log(
    "[Mediasoup] Device loaded. Can produce video?",
    device.canProduce("video"),
  );

  // 2. Create Send Transport
  if (state.localStream) {
    const transportInfo = await request("createWebRtcTransport", {
      forceTcp: false,
      rtpCapabilities: device.rtpCapabilities,
    });

    producerTransport = device.createSendTransport({
      ...transportInfo,
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    producerTransport.on(
      "connect",
      async ({ dtlsParameters }, callback, errback) => {
        try {
          await request("connectWebRtcTransport", {
            transportId: producerTransport.id,
            dtlsParameters,
          });
          callback();
        } catch (error) {
          errback(error);
        }
      },
    );

    producerTransport.on(
      "produce",
      async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
          const { producerId } = await request("produce", {
            transportId: producerTransport.id,
            kind,
            rtpParameters,
            appData,
          });
          callback({ id: producerId });
        } catch (error) {
          errback(error);
        }
      },
    );

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

  // 3. Create Recv Transport
  const transportInfo = await request("createWebRtcTransport", {
    forceTcp: false,
    rtpCapabilities: device.rtpCapabilities,
  });

  consumerTransport = device.createRecvTransport({
    ...transportInfo,
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });

  consumerTransport.on(
    "connect",
    async ({ dtlsParameters }, callback, errback) => {
      try {
        await request("connectWebRtcTransport", {
          transportId: consumerTransport.id,
          dtlsParameters,
        });
        callback();
      } catch (error) {
        errback(error);
      }
    },
  );

  console.log("[Mediasoup] Transports initialized");

  // 4. Get existing producers
  const { list } = await request("getProducers");
  for (const p of list) {
    await consumeProducer(p.id, p.kind);
  }
}

export async function consumeProducer(producerId, kind) {
  if (!device) return;

  const {
    id,
    kind: consumerKind,
    rtpParameters,
    appData,
  } = await request("consume", {
    transportId: consumerTransport.id,
    producerId,
    rtpCapabilities: device.rtpCapabilities,
  });

  const consumer = await consumerTransport.consume({
    id,
    producerId,
    kind: consumerKind,
    rtpParameters,
    appData: { ...appData },
  });

  consumers.set(producerId, consumer);

  consumer.on("producerclose", () => {
    console.log(
      `[Mediasoup] Consumer closed (producer closed): ${consumer.id}`,
    );
    consumers.delete(producerId);

    if (kind === "video") {
      if (consumer.appData && consumer.appData.source === "screen") {
        console.log("[Mediasoup] Screen share stopped by remote");
        import("../modules/call-ui.js").then((ui) => {
          ui.setScreenShareMode(false);
          const el = document.getElementById("remote-screen-video");
          if (el) {
            el.srcObject = null;
            el.style.display = "none";
          }
        });
      }
    }
    consumer.close();
  });

  const stream = new MediaStream();
  stream.addTrack(consumer.track);

  await request("resume", { consumerId: consumer.id });

  if (kind === "video") {
    const isScreen = consumer.appData && consumer.appData.source === "screen";
    const videoEl = isScreen ? remoteScreenVideo : remoteVideo;

    videoEl.srcObject = stream;

    if (isScreen) {
      videoEl.style.display = "block";
      setScreenShareMode(true);
    } else {
      videoEl.classList.add("active");
      hideWaitingOverlay();
    }

    videoEl.setAttribute("playsinline", "true");
    videoEl.muted = true;

    videoEl.onloadedmetadata = () => {
      videoEl.play().catch((e) => console.warn("Play error:", e));
    };

    if (!isScreen) hideWaitingOverlay();

    stream.onremovetrack = () => {
      console.log("[Mediasoup] Track removed");
      if (isScreen) {
        console.log("[Mediasoup] Screen share track removed");
        setScreenShareMode(false);
        videoEl.style.display = "none";
        videoEl.srcObject = null;
      }
    };
  } else {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play().catch((e) => console.error("Audio play error:", e));
  }
}
