import mediasoup from "mediasoup";
import { config } from "./config.js";

class MediasoupService {
  constructor() {
    this.worker = null;
    this.router = null;
  }

  async initialize() {
    this.worker = await mediasoup.createWorker({
      logLevel: config.worker.logLevel,
      logTags: config.worker.logTags,
      rtcMinPort: config.worker.rtcMinPort,
      rtcMaxPort: config.worker.rtcMaxPort,
    });

    this.worker.on("died", () => {
      console.error(
        "mediasoup worker died, exiting in 2 seconds... [pid:%d]",
        this.worker.pid
      );
      setTimeout(() => process.exit(1), 2000);
    });

    const mediaCodecs = config.router.mediaCodecs;
    this.router = await this.worker.createRouter({ mediaCodecs });
    return this.router;
  }

  async createWebRtcTransport() {
    if (!this.router) throw new Error("Router not initialized");

    const {
      maxSctpMessageSize,
      listenIps: staticListenIps,
      initialAvailableOutgoingBitrate,
    } = config.webRtcTransport;

    // Dynamic override: Ensure we use the latest MEDIASOUP_ANNOUNCED_IP
    const listenIps = staticListenIps.map((ipConfig) => ({
      ...ipConfig,
      announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || ipConfig.announcedIp,
    }));

    const transport = await this.router.createWebRtcTransport({
      listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
      enableSctp: false,
    });

    if (maxSctpMessageSize) {
      try {
        await transport.enableSctp({ maxSctpMessageSize });
      } catch (error) {
        console.warn("enableSctp() failed:%o", error);
      }
    }

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

  async createPlainTransport() {
    if (!this.router) throw new Error("Router not initialized");
    const transport = await this.router.createPlainTransport(config.plainTransport);
    return transport;
  }
}

export default MediasoupService;
