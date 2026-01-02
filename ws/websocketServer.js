import {WebSocketServer} from "ws";
import {
  joinChannel,
  leaveChannel,
  broadcastToRoom
} from "./channels.js"

function initWebSocket(server) {
  const wss = new WebSocketServer({ server });
  wss.on("connection", socket => {
    console.log("Socket connected");

    socket.on("message", msg => {
      let data;

      try {
        data = JSON.parse(msg.toString());
        console.log(data);
      } catch {
        console.error("Invalid JSON");
        return;
      }

      if (data.type === "join") {
        socket.uid = data.from;
        joinChannel(socket, data.channel);
        return;
      }

      if (data.type === "leave") {
        broadcastToRoom(socket, { type: "leave" });
        leaveChannel(socket);
        return;
      }

      broadcastToRoom(socket, data);
    });

    socket.on("close", () => {
      if (socket.channel) leaveChannel(socket);
    });
  });
}

export default initWebSocket;