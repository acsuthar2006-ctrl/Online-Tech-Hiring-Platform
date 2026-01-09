import fs from "fs";
import path from "path";
import Busboy from "busboy";
import { fileURLToPath } from "url";
import { roomExists } from "../ws/channels.js";

/* ===== ES MODULE __dirname FIX ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECORDINGS_DIR = path.join(__dirname, "..", "recordings");

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  console.log(`📁 Created recordings directory: ${RECORDINGS_DIR}`);
}

export default function handleHttp(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  /* ================= RECORDING UPLOAD ================= */
  if (req.method === "POST" && pathname === "/upload-recording") {
    console.log("[Upload] Receiving recording...");

    const busboy = Busboy({ headers: req.headers });
    let uploadComplete = false;

    busboy.on("file", (fieldname, file, info) => {
      const { filename } = info;
      console.log(`[Upload] Saving: ${filename}`);

      const savePath = path.join(RECORDINGS_DIR, filename);
      const writeStream = fs.createWriteStream(savePath);

      let bytesWritten = 0;

      file.on('data', (chunk) => {
        bytesWritten += chunk.length;
      });

      file.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log(`[Upload] ✅ Recording saved: ${filename} (${bytesWritten} bytes)`);
        uploadComplete = true;
      });

      writeStream.on("error", (err) => {
        console.error(`[Upload] ❌ Error saving recording:`, err);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Error saving recording");
        }
      });
    });

    busboy.on("finish", () => {
      // Wait a bit for file stream to finish
      setTimeout(() => {
        if (!res.headersSent) {
          res.writeHead(uploadComplete ? 200 : 500);
          res.end(uploadComplete ? "Recording saved" : "Upload incomplete");
        }
      }, 100);
    });

    busboy.on("error", (err) => {
      console.error("[Upload] Busboy error:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Upload error");
      }
    });

    req.pipe(busboy);
    return;
  }

  /* ================= RECORDING DOWNLOAD ================= */
  if (req.method === "GET" && pathname.startsWith("/download-recording/")) {
    const roomId = pathname.split("/").pop();
    const filePath = path.join(RECORDINGS_DIR, `${roomId}.webm`);

    console.log(`[Download] Request for: ${roomId}`);

    if (!fs.existsSync(filePath)) {
      console.warn(`[Download] ❌ Recording not found: ${filePath}`);
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Recording not found" }));
      return;
    }

    const stat = fs.statSync(filePath);
    console.log(`[Download] ✅ Sending: ${roomId}.webm (${stat.size} bytes)`);

    res.writeHead(200, {
      "Content-Type": "video/webm",
      "Content-Disposition": `attachment; filename="${roomId}.webm"`,
      "Content-Length": stat.size
    });

    const readStream = fs.createReadStream(filePath);

    readStream.on("error", (err) => {
      console.error("[Download] Stream error:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Error reading file");
      }
    });

    readStream.pipe(res);
    return;
  }

  /* ================= API: LIST RECORDINGS ================= */
  if (req.method === "GET" && pathname.startsWith("/api/recordings/")) {
    const roomId = pathname.split("/").pop();
    console.log(`[API] Listing recordings for room: ${roomId}`);

    try {
      const files = fs.readdirSync(RECORDINGS_DIR);
      const recordings = files
        .filter(file => file.startsWith(`${roomId}-`) && file.endsWith(".mp4"))
        .map(file => {
          const timestamp = parseInt(file.split("-")[1].split(".")[0]);
          const date = new Date(timestamp).toLocaleString();
          return {
            filename: file,
            date: date,
            url: `/recordings/${file}`
          };
        })
        .sort((a, b) => b.filename.localeCompare(a.filename)); // Newest first

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ recordings }));
    } catch (err) {
      console.error("[API] Error listing recordings:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to list recordings" }));
    }
    return;
  }

  /* ================= API: DELETE RECORDING ================= */
  if (req.method === "DELETE" && pathname.startsWith("/api/recordings/")) {
    const filename = pathname.split("/").pop();
    console.log(`[API] Deleting recording: ${filename}`);

    // Security: Prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || !filename.endsWith(".mp4")) {
      console.warn(`[Security] Invalid delete attempt: ${filename}`);
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    const filePath = path.join(RECORDINGS_DIR, filename);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "File not found" }));
      return;
    }

    try {
      fs.unlinkSync(filePath);
      console.log(`[API] Deleted: ${filename}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error("[API] Error deleting file:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Server error deleting file" }));
    }
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

    const exists = roomExists(room);
    console.log(`[Room Check] ${room} exists: ${exists}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ exists }));
    return;
  }

  /* ================= STATIC FILE SERVING ================= */
  let filePath;

  // Serve recordings
  if (pathname.startsWith("/recordings/")) {
    const filename = pathname.replace("/recordings/", "");
    filePath = path.join(RECORDINGS_DIR, filename);

    // Check for directory traversal (simple check)
    if (filename.includes("..") || filename.includes("/")) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end("Recording not found");
      return;
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": stat.size
    });

    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (pathname === "/" && url.searchParams.has("room")) {
    filePath = "./public/index.html";
  } else if (pathname === "/") {
    filePath = "./public/lobby.html";
  } else {
    filePath = `./public${pathname}`;
  }

  // Security: prevent path traversal
  const resolvedPath = path.resolve(filePath);
  const publicDir = path.resolve("./public");

  if (!resolvedPath.startsWith(publicDir)) {
    console.warn(`[Security] Path traversal attempt: ${pathname}`);
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(filePath);
  const contentType = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml"
  }[ext] || "text/plain";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.warn(`[Static] File not found: ${filePath}`);
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 - Not Found</h1>");
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}