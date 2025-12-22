const WebSocket = require("ws");
const {
  joinChannel,
  leaveChannel,
  broadcastToRoom
} = require("./channels");

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", socket => {
    console.log("Socket connected");

    socket.on("message", msg => {
      let data;

      try {
        data = JSON.parse(msg.toString());
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

module.exports = initWebSocket;