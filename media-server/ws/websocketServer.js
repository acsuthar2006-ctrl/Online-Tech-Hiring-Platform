import { WebSocketServer } from "ws";
import {
  joinChannel,
  leaveChannel,
  broadcastToRoom,
  roomExists,
} from "./channels.js";
import {
  createWorker,
  createRouter,
  createWebRtcTransport,
} from "../sfu/mediasoup.js";
import { Recorder } from "../sfu/recording.js";

let worker;
let router;
const producers = new Map(); // producerId -> Producer
const consumers = new Map(); // consumerId -> Consumer
const transports = new Map(); // transportId -> Transport
const recorders = new Map(); // roomId -> Recorder

const SERVER_INSTANCE = Date.now().toString();

async function initWebSocket(server) {
  // Listen on specific path to avoid conflicts and allow proxying
  const wss = new WebSocketServer({ server, path: "/ws" });

  // Init Mediasoup
  try {
    worker = await createWorker();
    router = await createRouter(worker);
    console.log("🚀 Mediasoup Worker & Router initialized");
  } catch (err) {
    console.error("❌ Failed to init Mediasoup:", err);
  }

  console.log("🔌 WebSocket server initialized");

  wss.on("connection", (socket, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`[WebSocket] New connection from ${clientIp}`);

    // Send server instance ID immediately
    socket.send(
      JSON.stringify({
        type: "serverInfo",
        instanceId: SERVER_INSTANCE,
      }),
    );

    // Set up ping/pong for connection health
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
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format",
          }),
        );
        return;
      }

      // Validate required fields
      if (!data.type) {
        console.warn("[WebSocket] Message missing type");
        return;
      }

      console.log(`[WebSocket] ${socket.uid || "Unknown"} -> ${data.type}`);

      // Handle join message
      if (data.type === "join") {
        if (!data.from || !data.channel) {
          console.error("[WebSocket] Join missing from/channel");
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Missing user ID or channel",
            }),
          );
          socket.close();
          return;
        }

        socket.uid = data.from;
        const joined = joinChannel(socket, data.channel);

        if (joined) {
          // Send confirmation
          socket.send(
            JSON.stringify({
              type: "joined",
              channel: data.channel,
            }),
          );

          // Start recording if not exists
          if (!recorders.has(data.channel)) {
            const recorder = new Recorder(router, data.channel);
            recorders.set(data.channel, recorder);
          }
        }
        return;
      }

      // Handle Mediasoup Requests

      // 1. Get Router Capabilities
      if (data.type === "getRouterRtpCapabilities") {
        socket.send(
          JSON.stringify({
            type: "routerRtpCapabilities",
            id: data.id,
            routerRtpCapabilities: router.rtpCapabilities,
          }),
        );
        return;
      }

      // 2. Create WebRTC Transport
      if (data.type === "createWebRtcTransport") {
        try {
          const { transport, params } = await createWebRtcTransport(router);

          transports.set(transport.id, transport);

          // Cleanup on close
          transport.on("dtlsstatechange", (dtlsState) => {
            if (dtlsState === "closed") transport.close();
          });
          transport.on("close", () => {
            console.log("Transport closed", transport.id);
            transports.delete(transport.id);
          });

          socket.send(
            JSON.stringify({
              type: "createWebRtcTransportResponse",
              id: data.id,
              params,
            }),
          );
        } catch (err) {
          console.error(err);
        }
        return;
      }

      // 3. Connect Transport
      if (data.type === "connectWebRtcTransport") {
        const transport = transports.get(data.transportId);
        if (transport) {
          await transport.connect({ dtlsParameters: data.dtlsParameters });
          socket.send(JSON.stringify({ type: "ack", id: data.id }));
        }
        return;
      }

      // 4. Produce
      if (data.type === "produce") {
        const transport = transports.get(data.transportId);
        if (transport) {
          const producer = await transport.produce({
            kind: data.kind,
            rtpParameters: data.rtpParameters,
            appData: {
              ...data.appData,
              channel: socket.channel,
              uid: socket.uid,
            },
          });

          producers.set(producer.id, producer);

          producer.on("transportclose", () => {
            producers.delete(producer.id);
          });

          socket.send(
            JSON.stringify({
              type: "produceResponse",
              id: data.id,
              producerId: producer.id,
            }),
          );

          // Store producer id on socket
          if (!socket.producers) socket.producers = {};

          if (data.appData.source === "screen") {
            socket.producers.screen = producer.id;
          } else {
            socket.producers[data.kind] = producer.id;
          }

          // Check/Update Recording
          const roomSockets = [...wss.clients].filter(
            (c) => c.channel === socket.channel,
          );
          const activeParticipants = roomSockets.filter(
            (c) => c.producers && c.producers.audio && c.producers.video,
          );

          if (activeParticipants.length >= 2) {
            const enableRecording = process.env.ENABLE_RECORDING === "true";

            if (enableRecording) {
              let recorder = recorders.get(socket.channel);
              if (!recorder) {
                recorder = new Recorder(router, socket.channel);
                recorders.set(socket.channel, recorder);
              }

              // Build list
              const producersList = [];
              // Add AV for first 2 participants
              activeParticipants.slice(0, 2).forEach((s) => {
                producersList.push({
                  producerId: s.producers.audio,
                  kind: "audio",
                });
                producersList.push({
                  producerId: s.producers.video,
                  kind: "video",
                });
              });

              // Add Screen Share if any
              const screenSharer = roomSockets.find(
                (s) => s.producers && s.producers.screen,
              );
              if (screenSharer) {
                producersList.push({
                  producerId: screenSharer.producers.screen,
                  kind: "video",
                });
              }

              // Start or Restart
              if (recorder.process) {
                // specific check: if number of inputs changed, restart
                if (recorder.consumers.length !== producersList.length) {
                  console.log(
                    `[Recorder] Restarting recording for room ${socket.channel} (Streams: ${recorder.consumers.length} -> ${producersList.length})`,
                  );
                  recorder.stop();
                  setTimeout(() => {
                    if (recorders.has(socket.channel))
                      recorder
                        .start(producersList)
                        .catch((e) => console.error(e));
                  }, 500);
                }
              } else if (recorder.consumers.length === 0) {
                recorder.start(producersList).catch((e) => console.error(e));
              }
            }
          }

          // Broadcast new producer to others
          broadcastToRoom(socket, {
            type: "newProducer",
            producerId: producer.id,
            kind: data.kind,
            uid: socket.uid,
            appData: producer.appData,
          });
        }
        return;
      }

      // 4.2 Close Producer
      if (data.type === "closeProducer") {
        const producer = producers.get(data.producerId);
        if (producer) {
          producer.close();
          producers.delete(data.producerId);

          // Broadcast closure so clients can update lists/UI
          broadcastToRoom(socket, {
            type: "producerClosed",
            producerId: data.producerId,
            kind: producer.kind,
            uid: socket.uid,
          });

          // Update socket.producers
          if (socket.producers) {
            Object.keys(socket.producers).forEach((key) => {
              if (socket.producers[key] === data.producerId)
                delete socket.producers[key];
            });
          }

          // Trigger recording update
          const roomSockets = [...wss.clients].filter(
            (c) => c.channel === socket.channel,
          );
          const activeParticipants = roomSockets.filter(
            (c) => c.producers && c.producers.audio && c.producers.video,
          );

          if (activeParticipants.length >= 2 && recorders.has(socket.channel)) {
            const recorder = recorders.get(socket.channel);

            // Rebuild target list
            const producersList = [];
            activeParticipants.slice(0, 2).forEach((s) => {
              producersList.push({
                producerId: s.producers.audio,
                kind: "audio",
              });
              producersList.push({
                producerId: s.producers.video,
                kind: "video",
              });
            });
            const screenSharer = roomSockets.find(
              (s) => s.producers && s.producers.screen,
            );
            if (screenSharer) {
              producersList.push({
                producerId: screenSharer.producers.screen,
                kind: "video",
              });
            }

            // Restart check
            if (
              recorder.process &&
              recorder.consumers.length !== producersList.length
            ) {
              console.log(`[Recorder] Restarting recording (Stream removed)`);
              recorder.stop();
              setTimeout(() => {
                if (recorders.has(socket.channel))
                  recorder.start(producersList).catch((e) => console.error(e));
              }, 500);
            }
          }
        }
        return;
      }

      // 4.5 Get Producers (New)
      if (data.type === "getProducers") {
        const producerList = [];
        for (const producer of producers.values()) {
          // Send producers from same room, but NOT from self
          if (
            producer.appData.channel === socket.channel &&
            producer.appData.uid !== socket.uid
          ) {
            producerList.push({
              id: producer.id,
              kind: producer.kind,
              appData: producer.appData,
            });
          }
        }

        socket.send(
          JSON.stringify({
            type: "getProducersResponse",
            id: data.id,
            list: producerList,
          }),
        );
        return;
      }

      // 5. Consume
      if (data.type === "consume") {
        const transport = transports.get(data.transportId);
        const producer = producers.get(data.producerId); // Get producer to access appData

        if (
          transport &&
          producer &&
          router.canConsume({
            producerId: data.producerId,
            rtpCapabilities: data.rtpCapabilities,
          })
        ) {
          const consumer = await transport.consume({
            producerId: data.producerId,
            rtpCapabilities: data.rtpCapabilities,
            paused: true, // Start paused
            appData: producer.appData, // Pass producer appData to consumer
          });

          consumers.set(consumer.id, consumer);

          socket.send(
            JSON.stringify({
              type: "consumeResponse",
              id: data.id,
              params: {
                id: consumer.id,
                producerId: data.producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                appData: consumer.appData,
              },
            }),
          );
        }
        return;
      }

      // 6. Resume Consumer
      if (data.type === "resume") {
        const consumer = consumers.get(data.consumerId);
        if (consumer) await consumer.resume();
        socket.send(JSON.stringify({ type: "resumeResponse", id: data.id }));
        return;
      }

      // Handle leave message
      if (data.type === "leave") {
        if (socket.channel) {
          broadcastToRoom(socket, {
            type: "leave",
            from: socket.uid,
          });

          // Stop recorder when a user leaves (since we need 2 users for merged recording)
          if (recorders.has(socket.channel)) {
            console.log(
              `[WebSocket] Stopping recorder for room ${socket.channel} due to user leave`,
            );
            const recorder = recorders.get(socket.channel);
            recorder.stop();
            recorders.delete(socket.channel);
          }

          leaveChannel(socket);
        }
        return;
      }

      // Validate user is in a channel before broadcasting
      if (!socket.channel) {
        console.warn(
          `[WebSocket] User ${socket.uid} not in channel, ignoring ${data.type}`,
        );
        return;
      }

      // Broadcast all other messages to room
      broadcastToRoom(socket, data);
    });

    socket.on("close", (code, reason) => {
      console.log(
        `[WebSocket] ${socket.uid || "Unknown"} disconnected: ${code} ${reason}`,
      );

      if (socket.channel) {
        if (recorders.has(socket.channel)) {
          const recorder = recorders.get(socket.channel);
          // Stop recorder if user leaves? Or keep it?
          // MVP: Stop on leave.
          recorder.stop();
          recorders.delete(socket.channel);
        }

        broadcastToRoom(socket, {
          type: "leave",
          from: socket.uid,
        });
        leaveChannel(socket);
      }
    });

    socket.on("error", (err) => {
      console.error(`[WebSocket] Socket error for ${socket.uid}:`, err.message);
    });
  });

  // Health check ping interval
  const pingInterval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        console.log(`[WebSocket] Terminating inactive socket ${socket.uid}`);
        if (socket.channel) {
          leaveChannel(socket);
        }
        return socket.terminate();
      }

      socket.isAlive = false;
      socket.ping();
    });
  }, 30000); // Every 30 seconds

  wss.on("close", () => {
    clearInterval(pingInterval);
    console.log("[WebSocket] Server closed");
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[WebSocket] SIGTERM received, closing server...");
    wss.close(() => {
      console.log("[WebSocket] Server closed");
    });
  });

  console.log("[WebSocket] Server ready");

  return wss;
}

export default initWebSocket;
