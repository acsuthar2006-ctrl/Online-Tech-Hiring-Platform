const fs = require("fs");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const MAX_USERS_PER_ROOM = 2;

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

  if (pathname === "/check-room") {
    const room = url.searchParams.get("room");

    if (!room) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Room id required" }));
      return;
    }

    const exists = channels.has(room);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ exists }));
    return;
  }


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
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }

  const room = channels.get(channel);

  if (room.size >= MAX_USERS_PER_ROOM) {
    socket.send(JSON.stringify({
      type: "room-full"
    }));
    socket.close();
    return;
  }

  socket.channel = channel;
  room.add(socket);

  console.log(`User ${socket.uid} joined room ${channel}`);
  console.log(`Users in room: ${channels.get(channel).size}`);
  console.log("Active rooms:", [...channels.keys()]);
}

function leaveChannel(socket) {
  const channel = socket.channel;
  if (!channel) return;

  const room = channels.get(channel);
  if (!room) return;

  room.delete(socket);

  if (room.size === 0) {
    channels.delete(channel);
  }

  socket.channel = null; // reset at the end

  console.log(`User ${socket.uid} left room ${channel}`);
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

    if (data.type === "leave") {
    broadcastToRoom(socket, { type: "leave" });
    leaveChannel(socket);
    return;
  }

    // forward signaling messages only to room
    broadcastToRoom(socket, data);
  });

  socket.on("close", () => {
    if (socket.channel) leaveChannel(socket);
  });
});
