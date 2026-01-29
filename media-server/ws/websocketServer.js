import { WebSocketServer } from "ws";
import {
  joinChannel,
  leaveChannel,
  broadcastToRoom,
} from "./channels.js";
import MediasoupService from "../sfu/mediasoup.js";
import { SfuHandler } from "./SfuHandler.js";
import { RecordingManager } from "./RecordingManager.js";

const SERVER_INSTANCE = Date.now().toString();

async function initWebSocket(server) {
  // Listen on specific path
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Init Services
  const mediasoupService = new MediasoupService();
  await mediasoupService.initialize();
  console.log("🚀 Mediasoup Service initialized");

  const sfuHandler = new SfuHandler(mediasoupService);
  const recordingManager = new RecordingManager(mediasoupService);

  console.log("🔌 WebSocket server initialized");

  wss.on("connection", (socket, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[WebSocket] New connection from ${clientIp}`);

    // Send server instance ID
    socket.send(
      JSON.stringify({
        type: "serverInfo",
        instanceId: SERVER_INSTANCE,
      })
    );

    // Health Check
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", async (msg) => {
      let data;
      try {
        data = JSON.parse(msg.toString());
      } catch (err) {
        console.error("[WebSocket] Invalid JSON:", err.message);
        return;
      }

      try {
        if (!data.type) return;

        console.log(`[WebSocket] ${socket.uid || "Unknown"} -> ${data.type}`);

        // --- Room Management ---
        if (data.type === "join") {
          handleJoin(socket, data, recordingManager);
          return;
        }

        if (data.type === "leave") {
          handleLeave(socket, data, wss, recordingManager);
          return;
        }

        // --- SFU Requests ---
        // Forward all typical SFU requests to SfuHandler
        const sfuRequestTypes = [
          "getRouterRtpCapabilities",
          "createWebRtcTransport",
          "connectWebRtcTransport",
          "produce",
          "closeProducer",
          "getProducers",
          "consume",
          "resume",
        ];

        if (sfuRequestTypes.includes(data.type)) {
          await sfuHandler.handleRequest(socket, data);

          // Post-operation hooks for recording
          if (data.type === "produce" || data.type === "closeProducer") {
            const roomClients = getRoomClients(wss, socket.channel);
            const activeParticipants = roomClients.filter(
              (c) => c.producers && c.producers.audio && c.producers.video
            );

            if (data.type === "produce") {
              recordingManager.checkToStartRecording(socket, activeParticipants);
            } else {
              recordingManager.checkToRestartRecording(socket, activeParticipants);
            }
          }
          return;
        }

        // --- Chat / Other Broadcasts ---
        if (!socket.channel) return;
        broadcastToRoom(socket, data);

      } catch (err) {
        console.error(`[WebSocket] Error handling message ${data.type}:`, err);
      }
    });

    socket.on("close", (code, reason) => {
      console.log(`[WebSocket] ${socket.uid} disconnected`);
      if (socket.channel) {
         // Stop recording on leave (per existing logic)
         const roomClients = getRoomClients(wss, socket.channel);
         // If we want to strictly follow old logic: stop if anyone leaves?
         // We'll let recordingManager handle it.
         recordingManager.handleRoomLeave(socket, roomClients);

        broadcastToRoom(socket, { type: "leave", from: socket.uid });
        leaveChannel(socket);
      }
    });
  });

  // Health Interval
  const pingInterval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        if (socket.channel) leaveChannel(socket);
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(pingInterval);
  });

  return wss;
}

// Helpers

function handleJoin(socket, data, recordingManager) {
  if (!data.from || !data.channel) {
    socket.close();
    return;
  }
  socket.uid = data.from;
  const joined = joinChannel(socket, data.channel);

  if (joined) {
    socket.send(JSON.stringify({ type: "joined", channel: data.channel }));
    // Initialize recording entry
    recordingManager.handleRoomJoin(socket);
  }
}

function handleLeave(socket, data, wss, recordingManager) {
  if (socket.channel) {
    broadcastToRoom(socket, { type: "leave", from: socket.uid });
    
    // Check recording stop
    const roomClients = getRoomClients(wss, socket.channel);
    recordingManager.handleRoomLeave(socket, roomClients);

    leaveChannel(socket);
  }
}

function getRoomClients(wss, channel) {
  return [...wss.clients].filter((c) => c.channel === channel);
}

export default initWebSocket;
