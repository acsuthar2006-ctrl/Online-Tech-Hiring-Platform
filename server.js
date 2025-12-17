const fs = require("fs");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  let filePath;
  if (pathname === "/" && url.searchParams.has("room")) {
    filePath = "./public/index.html";
  } else if (pathname === "/") {
    filePath = "./public/lobby.html";
  } else {
    filePath = `./public${pathname}`;
  }

  const ext = path.extname(filePath);
  const contentType = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css"
  }[ext] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

const wss = new WebSocket.Server({ server });

const channels = new Map();

function joinChannel(socket, channel) {
  socket.channel = channel;

  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }

  channels.get(channel).add(socket);

  console.log(`User ${socket.uid} joined room ${channel}`);
  console.log(`Users in room: ${channels.get(channel).size}`);
}

function leaveChannel(socket) {
  if (!socket.channel) return;

  const room = channels.get(socket.channel);
  if (!room) return;

  room.delete(socket);
  if (room.size === 0) channels.delete(socket.channel);

  console.log(`User ${socket.uid} left room ${socket.channel}`);
}

function broadcastToRoom(sender, data) {
  const room = channels.get(sender.channel);
  if (!room) return;

  room.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});


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

    // forward signaling messages only to room
    broadcastToRoom(socket, data);
  });

  socket.on("close", () => {
    leaveChannel(socket);
    console.log("Socket disconnected");
  });
});
