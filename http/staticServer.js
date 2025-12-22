const fs = require("fs");
const path = require("path");
const { roomExists } = require("../ws/channels");

function handleHttp(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === "/check-room") {
    const room = url.searchParams.get("room");

    if (!room) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Room id required" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ exists: roomExists(room) }));
    return;
  }

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
}

module.exports = handleHttp;