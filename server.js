const fs = require("fs");
const path = require("path"); // ✅ FIX
const http = require("http");
const WebSocket = require("ws");


const server = http.createServer(
  (req, res) => {
    let filePath =
      req.url === "/"
        ? "./public/index.html"
        : `./public${req.url}`;

    const ext = path.extname(filePath); // to get file extension

    const contentType = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
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
  }
);

/* -------------------- WebSocket Server -------------------- */

const wss = new WebSocket.Server({ server });

server.listen(3000,() => {
  console.log("✅ HTTPS + WSS server running on port 3000");
});

/* -------------------- Helper Functions -------------------- */

function handleUserJoined(socket, data) {
  socket.uid = data.from;
  console.log(`👤 User joined: ${socket.uid}`);
  console.log(`👥 Total users: ${wss.clients.size}`);
}

function broadcastToPeers(senderSocket, data) {
  wss.clients.forEach((client) => {
    if (client !== senderSocket && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function handleMessageFromPeer(socket, rawMessage) {
  let data;

  try {
    data = JSON.parse(rawMessage.toString());
  } catch {
    console.error("❌ Invalid JSON");
    return;
  }

  switch (data.type) {
    case "join":
      handleUserJoined(socket, data);
      break;

    default:
      console.log(data);
      broadcastToPeers(socket, data);
      break;
  }
}

function handleSocketClose(socket) {
  if (socket.uid) {
    console.log(`❌ User disconnected: ${socket.uid}`);
  } else {
    console.log("❌ Socket disconnected before join");
  }

  console.log(`👥 Total users: ${wss.clients.size}`);
}

/* -------------------- WebSocket Events -------------------- */

wss.on("connection", (socket) => {
  console.log("🔗 Socket connected");

  socket.on("message", (message) => {
    handleMessageFromPeer(socket, message);
  });

  socket.on("close", () => {
    handleSocketClose(socket);
  });
});
