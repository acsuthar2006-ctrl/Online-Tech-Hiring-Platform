import "dotenv/config";
import http from "http";
import fs from "fs";
import path from "path";
import handleHttp from "./http/staticServer.js";
import initWebSocket from "./ws/websocketServer.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

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
const wss = await initWebSocket(server);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════╗
║    PeerChat Server Running          ║
╠═══════════════════════════════════════╣
║   HTTP:      http://localhost:${PORT} ║
║   WebSocket: ws://localhost:${PORT}   ║
╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = () => {
  console.log("\n Shutting down gracefully...");

  // Cleanup recordings
  try {
    const recordingsDir = process.env.RECORDING_DIR || './recordings';
    if (fs.existsSync(recordingsDir)) {
      console.log(" Cleaning up recordings...");
      const files = fs.readdirSync(recordingsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(recordingsDir, file));
      }
      console.log(` Deleted ${files.length} recording files`);
    }
  } catch (err) {
    console.error(" Error cleaning up recordings:", err);
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