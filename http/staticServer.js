const fs = require("fs");
const path = require("path");
const Busboy = require("busboy");
const { roomExists } = require("../ws/channels");

const RECORDINGS_DIR = path.join(__dirname, "..", "recordings");

function handleHttp(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  /* ================= RECORDING UPLOAD ================= */
  if (req.method === "POST" && pathname === "/upload-recording") {
    const busboy = Busboy({ headers: req.headers });

    busboy.on("file", (fieldname, file, info) => {
      const { filename } = info;
      const savePath = path.join(RECORDINGS_DIR, filename);

      const writeStream = fs.createWriteStream(savePath);
      file.pipe(writeStream);

      writeStream.on("close", () => {
        res.writeHead(200);
        res.end("Recording saved");
      });
    });

    req.pipe(busboy);
    return;
  }

  /* ================= RECORDING DOWNLOAD ================= */
  if (req.method === "GET" && pathname.startsWith("/download-recording/")) {
    const roomId = pathname.split("/").pop();
    const filePath = path.join(RECORDINGS_DIR, `${roomId}.webm`);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Recording not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "video/webm",
      "Content-Disposition": `attachment; filename="${roomId}.webm"`
    });

    fs.createReadStream(filePath).pipe(res);
    return;
  }

  /* ================= CHECK ROOM ================= */
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

  /* ================= STATIC FILE SERVING ================= */
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