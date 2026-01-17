import os from "os";

// Helper to get Local LAN IP
// Helper to get Local LAN IP
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const priority = ["en0", "en1", "eth0", "wlan0", "wi-fi"];

  // Try priority interfaces first
  for (const name of priority) {
    if (interfaces[name]) {
      for (const iface of interfaces[name]) {
        if ("IPv4" === iface.family && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  // Fallback to any non-internal IPv4
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (non-127.0.0.1) and non-ipv4
      if ("IPv4" !== iface.family || iface.internal) {
        continue;
      }
      return iface.address;
    }
  }
  return "127.0.0.1";
}

export const config = {
  // Worker settings
  worker: {
    rtcMinPort: parseInt(process.env.MEDIASOUP_MIN_PORT || 40000),
    rtcMaxPort: parseInt(process.env.MEDIASOUP_MAX_PORT || 40050), // Reduced range for easier port forwarding
    logLevel: "warn",
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
      // 'rtx',
      // 'bwe',
      // 'score',
      // 'simulcast',
      // 'svc'
    ],
  },
  // Router settings
  router: {
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {
          "x-google-start-bitrate": 1000,
        },
      },
      // {
      //   kind: 'video',
      //   mimeType: 'video/H264',
      //   clockRate: 90000,
      //   parameters: {
      //     'packetization-mode': 1,
      //     'profile-level-id': '42e01f',
      //     'level-asymmetry-allowed': 1
      //   }
      // }
    ],
  },
  // WebRtcTransport settings
  webRtcTransport: {
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || getLocalIp(),
      },
    ],
    initialAvailableOutgoingBitrate: 1000000,
    maxSctpMessageSize: 262144,
  },
  // PlainTransport settings for recording
  plainTransport: {
    listenIp: {
      ip: "127.0.0.1",
      announcedIp: null,
    },
    rtcpMux: true,
    comedia: false,
  },
};
