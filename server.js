import "dotenv/config";
import http from "http";
import fs from "fs";
import path from "path";
import axios from "axios";
import handleHttp from "./http/staticServer.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Public IP Detection
if (process.env.DETECT_PUBLIC_IP === "true") {
  try {
    console.log("🌍 Detecting Public IP...");
    const res = await axios.get("https://api.ipify.org?format=json", {
      timeout: 3000,
    });
    const publicIp = res.data.ip;
    console.log(`✅ Detected Public IP: ${publicIp}`);
    // Set env var so config.js (if re-imported or designed right) picks it up
    // However, config.js might have been imported already by initWebSocket -> mediasoup -> config
    // We rely on config.sh being imported AFTER setting variable or config simply reading process.env inside the function?
    // Looking at config.js, it reads process.env at IMPORT time.
    // This implies we MUST set process.env BEFORE importing modules that use it.
    // BUT we are using ES modules, imports happen first.
    // FIX: We must rely on `initWebSocket` being called effectively, OR reboot logic?
    // Actually, `initWebSocket` -> `createWorker` -> `config` is imported at top level of `mediasoup.js`.
    // ES modules hoist imports. This means `config.js` is evaluated BEFORE this code runs.

    // WORKAROUND: We will override `process.env.MEDIASOUP_ANNOUNCED_IP` here,
    // AND we must ensure that `createWorker`/`createWebRtcTransport` reads from `config` which reads from `env` DYNAMICALLY or we patch `config`.
    // Let's check `config.js` again. It has `announcedIp: process.env... || getLocalIp()`. It is static.

    // To fix this in ES modules without major refactor:
    // We cannot change the already-imported `config` object easily.
    // BUT: `initWebSocket` calls `createWorker`. `createWorker` is in `mediasoup.js`.
    // `mediasoup.js` imports `config`.

    // We need to restart the process? No.
    // We will just log the instructions here. Correct usage is: "Please run with correct ENV var".
    // OR: We create a STARTUP wrapper.

    // Let's stick to: Providing the instruction log. AND setting it for future reference if possible.
    process.env.MEDIASOUP_ANNOUNCED_IP = publicIp;
  } catch (err) {
    console.warn("⚠️ Failed to detect Public IP:", err.message);
  }
}

const server = http.createServer(handleHttp);

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", err);
    process.exit(1);
  }
});

// Initialize WebSocket
let wss;
try {
  // Dynamic import ensures config.js reads the UPDATED process.env.MEDIASOUP_ANNOUNCED_IP
  const { default: initWebSocket } = await import("./ws/websocketServer.js");
  wss = await initWebSocket(server);
} catch (err) {
  console.error("Failed to initialize WebSocket server:", err);
  process.exit(1);
}

// Start server
server.listen(PORT, HOST, () => {
  const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || "Local LAN IP";
  console.log(`
╔═══════════════════════════════════════╗
║    PeerChat Server Running            ║
╠═══════════════════════════════════════╣
║   HTTP:      http://localhost:${PORT} ║
║   WebSocket: ws://localhost:${PORT}   ║
╠═══════════════════════════════════════╣
║   Public / External Access Info       ║
║   Announced IP: ${announcedIp}        ║
║   UDP Ports:    40000 - 40050         ║
║                                       ║
║   ⚠️  YOU MUST FORWARD UDP PORTS      ║ 
║      40000-40050 ON YOUR ROUTER/ACL   ║
║      TO THIS MACHINE'S LOCAL IP       ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = () => {
  console.log("\n Shutting down gracefully...");

  // Cleanup recordings
  try {
    // Clean up recordings directory logic REMOVED for production persistence
    // const recordingsDir = process.env.RECORDING_DIR || './recordings';
    // if (fs.existsSync(recordingsDir)) {
    //   console.log(" Cleaning up recordings... (SKIPPED for persistence)");
    // }
  } catch (err) {
    console.error(" Error initializing:", err);
  }

  server.close(() => {
    console.log(" HTTP server closed");
  });

  if (wss) {
    wss.close(() => {
      console.log("WebSocket server closed");
      process.exit(0);
    });
  } else {
    console.log("WebSocket server not initialized");
    process.exit(0);
  }

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  shutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  shutdown();
});
