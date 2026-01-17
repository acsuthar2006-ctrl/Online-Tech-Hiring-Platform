import mediasoup from "mediasoup";
import { config } from "./config.js";

let worker;
let router;

// Map <transportId, Transport>
const transports = new Map();
// Map <producerId, Producer>
const producers = new Map();
// Map <consumerId, Consumer>
const consumers = new Map();

export async function createWorker() {
  worker = await mediasoup.createWorker({
    logLevel: config.worker.logLevel,
    logTags: config.worker.logTags,
    rtcMinPort: config.worker.rtcMinPort,
    rtcMaxPort: config.worker.rtcMaxPort,
  });

  worker.on("died", () => {
    console.error(
      "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
      worker.pid,
    );
    setTimeout(() => process.exit(1), 2000);
  });

  // Create a Router (room) - simplified for single room or per-room logic
  // For this project, we might create one router per room dynamically.
  // But for simplicity let's export a function to create a router.

  return worker;
}

export async function createRouter(worker) {
  const mediaCodecs = config.router.mediaCodecs;
  const router = await worker.createRouter({ mediaCodecs });
  return router;
}

export async function createWebRtcTransport(router) {
  const {
    maxSctpMessageSize,
    listenIps: staticListenIps,
    initialAvailableOutgoingBitrate,
  } = config.webRtcTransport;

  // Dynamic override: Ensure we use the latest MEDIASOUP_ANNOUNCED_IP
  // This is critical because server.js might detect the IP *after* config.js is imported.
  const listenIps = staticListenIps.map((ipConfig) => ({
    ...ipConfig,
    announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || ipConfig.announcedIp,
  }));

  const transport = await router.createWebRtcTransport({
    listenIps,
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate,
    enableSctp: false, // Disable SCTP for now as we don't use DataChannels
  });

  /*
    if (maxSctpMessageSize) {
        try {
            await transport.enableSctp({ maxSctpMessageSize });
        } catch (error) {
            console.warn('enableSctp() failed:%o', error);
        }
    }
    */

  transports.set(transport.id, transport);

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    },
  };
}

export async function createPlainTransport(router) {
  const transport = await router.createPlainTransport(config.plainTransport);
  transports.set(transport.id, transport);
  return transport;
}
