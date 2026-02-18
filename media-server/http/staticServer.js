import fs from "fs";
import http from "http";
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
  /* ================= CORS SUPPORT ================= */
  res.setHeader("Access-Control-Allow-Origin", "*"); // In production, restrict this to frontend domain
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

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

      file.on("data", (chunk) => {
        bytesWritten += chunk.length;
      });

      file.pipe(writeStream);

      writeStream.on("finish", () => {
        console.log(
          `[Upload] ✅ Recording saved: ${filename} (${bytesWritten} bytes)`,
        );
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

  /* ================= RECORDING DOWNLOAD / STATIC SERVE ================= */
  if (req.method === "GET" && pathname.startsWith("/recordings/")) {
    const filename = pathname.split("/").pop();
    const filePath = path.join(RECORDINGS_DIR, filename);

    console.log(`[Download] Request for: ${filename}`);

    // Security: Prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    if (!fs.existsSync(filePath)) {
      console.warn(`[Download] ❌ Recording not found: ${filePath}`);
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Recording not found" }));
      return;
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mkv": "video/x-matroska"
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    console.log(`[Download] ✅ Sending: ${filename} (${stat.size} bytes)`);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${filename}"`, 
    });

    const readStream = fs.createReadStream(filePath);
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
        .filter(
          (file) => file.startsWith(`${roomId}-`) && file.endsWith(".mp4"),
        )
        .map((file) => {
          const timestamp = parseInt(file.split("-")[1].split(".")[0]);
          const date = new Date(timestamp).toLocaleString();
          return {
            filename: file,
            date: date,
            url: `/recordings/${file}`,
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
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      !filename.endsWith(".mp4")
    ) {
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

  /* ================= PROXY: AUTH & USER API (To Backend 8080) ================= */
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/users")) {
    console.log(`[Proxy] Forwarding ${pathname} to Backend (8080)...`);

    const backendReq = http.request(
      {
        hostname: "127.0.0.1",
        port: 8080,
        path: url.search ? pathname + url.search : pathname,
        method: req.method,
        headers: req.headers,
      },
      (backendRes) => {
        res.writeHead(backendRes.statusCode, backendRes.headers);
        backendRes.pipe(res);
      },
    );

    backendReq.on("error", (err) => {
      console.error("[Proxy] Backend connection error:", err.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Backend unavailable" }));
    });

    req.pipe(backendReq);
    return;
  }

  /* ================= FRONTEND SERVING (PRODUCTION) ================= */
  // In production, we serve the built React content from ../platform-frontend/dist

  const FRONTEND_BUILD_DIR = path.join(__dirname, "..", "..", "platform-frontend", "dist");

  // Helper to serve a file
  const serveFile = (filePath, contentType) => {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  };

  // 1. Try to serve exact file match (e.g. /assets/index.js, /favicon.ico)
  // We strip the leading slash to join with build dir
  let reqPath = pathname === "/" ? "index.html" : pathname.substring(1);
  let targetPath = path.join(FRONTEND_BUILD_DIR, reqPath);

  // Security check for traversal
  if (reqPath.includes("..")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // Determine content type
  const ext = path.extname(targetPath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webm": "video/webm",
    ".mp4": "video/mp4",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";

  if (serveFile(targetPath, contentType)) {
    return;
  }

  // 2. Fallback for SPA (Single Page Application)
  // If the file is not found, and it's not an API call (already handled above),
  // serve index.html so React Router looks after it.
  if (!pathname.startsWith("/api/") && !pathname.startsWith("/recordings/")) {
    const indexPath = path.join(FRONTEND_BUILD_DIR, "index.html");
    if (serveFile(indexPath, "text/html")) {
      return;
    }
  }

  // 3. Last Resort
  res.writeHead(404);
  res.end("Not Found (Frontend build not found - did you run 'npm run build'?)");
}
