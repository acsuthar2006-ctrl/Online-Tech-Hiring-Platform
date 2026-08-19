import { createPlainTransport } from "./mediasoup.js";
import child_process from "child_process";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";

const RECORD_DIR = process.env.RECORDING_DIR || "./recordings";

if (!fs.existsSync(RECORD_DIR)) {
  fs.mkdirSync(RECORD_DIR, { recursive: true });
}

// Returns an RTP capability object for the recorder
const getRtpCapabilities = () => {
  return {
    codecs: [
      {
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
        parameters: { spropStr: "" },
        rtcpFeedback: [],
      },
      {
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {},
        rtcpFeedback: [],
      },
    ],
    headerExtensions: [],
  };
};

export class Recorder extends EventEmitter {
  constructor(router, roomId) {
    super();
    this.router = router;
    this.roomId = roomId;
    this.transports = [];
    this.consumers = [];
    // Store producer metadata (kind, source) from producersList — NOT from consumer.appData
    // because Mediasoup's transport.consume() ignores the appData option and copies from the producer,
    // which may not have a 'source' field if the client didn't set it.
    this.producerMeta = [];
    this.process = null;
    this.recordingChunks = [];
    this.manifestPath = null;
    this.sdpPaths = [];
  }

  // producersList = [{ producerId, kind, appData: { source } }, ...]
  async start(producersList) {
    console.log(`[Recorder] Starting merged recording for room ${this.roomId} with ${producersList.length} streams`);
    console.log("[Recorder] Streams:", producersList.map(p => `${p.kind}(${p.appData && p.appData.source ? p.appData.source : 'camera'})`).join(", "));

    const portPairs = [];
    const base = parseInt(process.env.RECORDER_MIN_PORT || 50000);
    const range = parseInt(process.env.RECORDER_MAX_PORT || 59999) - base;
    const sessionOffset = Math.floor(Math.random() * Math.floor((range - (producersList.length * 2 + 20)) / 2)) * 2;

    this.producerMeta = [];

    for (let i = 0; i < producersList.length; i++) {
      const p = producersList[i];
      const transport = await createPlainTransport(this.router);
      this.transports.push(transport);

      const rtpPort = base + sessionOffset + (i * 2);
      const rtcpPort = rtpPort + 1;
      portPairs.push({ rtpPort, rtcpPort });

      const consumer = await transport.consume({
        producerId: p.producerId,
        rtpCapabilities: getRtpCapabilities(),
        paused: true,
        appData: p.appData || {},
      });
      this.consumers.push(consumer);

      // Save metadata from producersList (reliable) instead of consumer.appData (may be empty)
      this.producerMeta.push({
        kind: p.kind,
        source: (p.appData && p.appData.source) ? p.appData.source : (p.kind === "audio" ? "mic" : "camera"),
      });
    }

    // Build SDP — one m= section per consumer/port
    let sdp = "v=0\no=- 0 0 IN IP4 127.0.0.1\ns=FFmpeg\nc=IN IP4 127.0.0.1\nt=0 0\n";

    for (let i = 0; i < this.consumers.length; i++) {
      const consumer = this.consumers[i];
      const { rtpPort, rtcpPort } = portPairs[i];
      const codec = consumer.rtpParameters.codecs[0];
      const kind = this.producerMeta[i].kind;

      if (kind === "audio") {
        sdp += `m=audio ${rtpPort} RTP/AVP ${codec.payloadType}\n`;
        sdp += `a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}/${codec.channels}\n`;
        sdp += `a=fmtp:${codec.payloadType} sprop-stereo=1\n`;
        sdp += `a=rtcp:${rtcpPort}\n`;
      } else {
        sdp += `m=video ${rtpPort} RTP/AVP ${codec.payloadType}\n`;
        sdp += `a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}\n`;
        sdp += `a=rtcp:${rtcpPort}\n`;
        sdp += `a=imageattr:${codec.payloadType} recv [x=640,y=480]\n`;
      }
    }

    const timestamp = Date.now();
    const outputFilename = `${this.roomId}-chunk-${timestamp}.mp4`;
    const filepath = path.join(RECORD_DIR, outputFilename);
    const sdpPath = path.join(RECORD_DIR, `${this.roomId}-${timestamp}.sdp`);

    this.recordingChunks.push(filepath);
    this.sdpPaths.push(sdpPath);

    if (!this.manifestPath) {
      this.manifestPath = path.join(RECORD_DIR, `${this.roomId}-manifest.txt`);
    }
    fs.appendFileSync(this.manifestPath, `file '${path.resolve(filepath).replace(/\\/g, "/")}'\n`);
    fs.writeFileSync(sdpPath, sdp);

    // Build filter_complex using producerMeta (reliable source classification)
    let audioInputs = [];
    let cameraInputs = [];
    let screenInput = null;

    for (let i = 0; i < this.producerMeta.length; i++) {
      const meta = this.producerMeta[i];
      if (meta.kind === "audio") {
        audioInputs.push(`[0:${i}]`);
      } else if (meta.kind === "video") {
        if (meta.source === "screen") {
          screenInput = `[0:${i}]`;
        } else {
          cameraInputs.push(`[0:${i}]`);
        }
      }
    }

    console.log(`[Recorder] Filter — audio: ${audioInputs.length}, cameras: ${cameraInputs.length}, screen: ${screenInput ? "yes" : "no"}`);

    const CANVAS_W = 1280;
    const CANVAS_H = 720;
    let filterComplex = "";

    // Audio
    if (audioInputs.length > 1) {
      filterComplex += `${audioInputs.join("")}amix=inputs=${audioInputs.length}:duration=longest[aout];`;
    } else if (audioInputs.length === 1) {
      filterComplex += `${audioInputs[0]}aresample=48000[aout];`;
    } else {
      filterComplex += "anullsrc=r=48000:cl=stereo[aout];";
    }

    // Black background
    filterComplex += `color=c=black:s=${CANVAS_W}x${CANVAS_H}:r=30[bg];`;

    if (screenInput) {
      filterComplex += `${screenInput}scale=960:720:force_original_aspect_ratio=decrease,pad=960:720:(ow-iw)/2:(oh-ih)/2[scr];`;
      if (cameraInputs.length >= 2) {
        filterComplex += `${cameraInputs[0]}scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2[c0];`;
        filterComplex += `${cameraInputs[1]}scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2[c1];`;
        filterComplex += "[bg][scr]overlay=0:0[bg1];[bg1][c0]overlay=960:0[bg2];[bg2][c1]overlay=960:240[vout]";
      } else if (cameraInputs.length === 1) {
        filterComplex += `${cameraInputs[0]}scale=320:360:force_original_aspect_ratio=decrease,pad=320:360:(ow-iw)/2:(oh-ih)/2[c0];`;
        filterComplex += "[bg][scr]overlay=0:0[bg1];[bg1][c0]overlay=960:180[vout]";
      } else {
        filterComplex += "[bg][scr]overlay=160:0[vout]";
      }
    } else if (cameraInputs.length >= 2) {
      // Side-by-side: each person gets half the canvas
      filterComplex += `${cameraInputs[0]}scale=640:720:force_original_aspect_ratio=decrease,pad=640:720:(ow-iw)/2:(oh-ih)/2[c0];`;
      filterComplex += `${cameraInputs[1]}scale=640:720:force_original_aspect_ratio=decrease,pad=640:720:(ow-iw)/2:(oh-ih)/2[c1];`;
      filterComplex += "[bg][c0]overlay=0:0[bg1];[bg1][c1]overlay=640:0[vout]";
    } else if (cameraInputs.length === 1) {
      filterComplex += `${cameraInputs[0]}scale=${CANVAS_W}:${CANVAS_H}:force_original_aspect_ratio=decrease,pad=${CANVAS_W}:${CANVAS_H}:(ow-iw)/2:(oh-ih)/2[vout]`;
    } else {
      filterComplex += `color=c=black:s=${CANVAS_W}x${CANVAS_H}:r=30[vout]`;
    }

    const args = [
      "-protocol_whitelist", "file,pipe,udp,rtp",
      "-analyzeduration", "30M",
      "-probesize", "30M",
      "-thread_queue_size", "4096",
      "-f", "sdp",
      "-i", sdpPath,
      "-filter_complex", filterComplex,
      "-map", "[vout]",
      "-map", "[aout]",
      "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
      "-crf", "23", "-r", "30",
      "-c:a", "aac", "-b:a", "128k",
      "-movflags", "frag_keyframe+empty_moov",
      "-y", filepath
    ];

    console.log(`[Recorder] Spawning FFmpeg | Room: ${this.roomId}`);
    console.log(`[Recorder] Filter: ${filterComplex}`);

    this.process = child_process.spawn(ffmpegPath, args);

    this.process.stderr.on("data", (data) => {
      const msg = data.toString().trim();
      // Filter verbose FFmpeg lines — only log important info
      if (msg.includes("bind") || msg.includes("Error") || msg.includes("error") ||
          msg.includes("Output") || msg.includes("Stream mapping")) {
        console.log("[FFmpeg]", msg);
      }
    });

    this.process.on("close", (code) => {
      console.log(`[Recorder] FFmpeg exited (code ${code}) | Room: ${this.roomId}`);
      this.emit("stop");
    });

    // Wait for FFmpeg to bind UDP sockets before pushing RTP
    console.log("[Recorder] Waiting 2s for FFmpeg to bind...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Connect transports → FFmpeg ports
    console.log("[Recorder] Connecting transports...");
    for (let i = 0; i < this.transports.length; i++) {
      const { rtpPort, rtcpPort } = portPairs[i];
      try {
        await this.transports[i].connect({ ip: "127.0.0.1", port: rtpPort, rtcpPort });
        console.log(`[Recorder] Transport ${i} (${this.producerMeta[i].kind}/${this.producerMeta[i].source}) → port ${rtpPort}`);
      } catch (e) {
        console.error(`[Recorder] Transport ${i} connect error:`, e.message);
      }
    }

    // Resume consumers + request keyframes
    for (const consumer of this.consumers) {
      try {
        await consumer.resume();
        if (consumer.kind === "video") await consumer.requestKeyFrame();
      } catch (e) {
        console.error("[Recorder] Consumer resume error:", e.message);
      }
    }

    // Second keyframe burst to ensure I-frame lands in FFmpeg probe window
    setTimeout(async () => {
      for (const consumer of this.consumers) {
        if (consumer.kind === "video") {
          consumer.requestKeyFrame().catch(() => {});
        }
      }
    }, 1000);

    console.log(`[Recorder] Pipeline active | Room: ${this.roomId}`);
  }

  async stop() {
    console.log(`[Recorder] Stopping | Room: ${this.roomId}`);

    if (this.process) {
      await new Promise((resolve) => {
        const proc = this.process;
        this.process = null;

        const timeout = setTimeout(() => {
          console.warn("[Recorder] Force killing FFmpeg (8s timeout)");
          proc.kill("SIGKILL");
          resolve();
        }, 8000);

        proc.on("close", (code) => {
          clearTimeout(timeout);
          console.log(`[Recorder] FFmpeg closed (code ${code})`);
          resolve();
        });

        if (process.platform === "win32") {
          try { proc.stdin.write("q\n"); } catch (e) { proc.kill("SIGKILL"); }
        } else {
          proc.kill("SIGINT");
        }
      });
    }

    for (const c of this.consumers) { try { c.close(); } catch (e) {} }
    for (const t of this.transports) { try { t.close(); } catch (e) {} }
    this.consumers = [];
    this.transports = [];
    this.producerMeta = [];
  }

  async saveRecording(customFilename) {
    const outputName = customFilename
      ? (customFilename.endsWith(".mp4") ? customFilename : `${customFilename}.mp4`)
      : `${this.roomId}-final.mp4`;
    const finalOutputPath = path.join(RECORD_DIR, outputName);

    console.log(`[Recorder] Saving → ${finalOutputPath}`);

    try {
      const validChunks = [];
      for (const p of this.recordingChunks) {
        if (fs.existsSync(p)) {
          const size = fs.statSync(p).size;
          if (size > 1000) {
            validChunks.push(p);
          } else {
            console.warn(`[Recorder] Skipping empty chunk: ${p} (${size} bytes)`);
          }
        } else {
          console.warn(`[Recorder] Missing chunk: ${p}`);
        }
      }

      if (validChunks.length === 0) {
        console.log("[Recorder] No valid chunks to save.");
        return;
      }

      if (validChunks.length === 1) {
        if (path.resolve(validChunks[0]) !== path.resolve(finalOutputPath)) {
          fs.copyFileSync(validChunks[0], finalOutputPath);
        }
        console.log(`[Recorder] Single chunk saved → ${finalOutputPath}`);
      } else {
        // Use FFmpeg concat to merge chunks
        const concatManifest = path.join(RECORD_DIR, `${this.roomId}-concat-${Date.now()}.txt`);
        const manifestContent = validChunks.map(f => `file '${path.resolve(f).replace(/\\/g, "/")}'`).join("\n") + "\n";
        fs.writeFileSync(concatManifest, manifestContent);

        console.log(`[Recorder] Merging ${validChunks.length} chunks → ${finalOutputPath}`);

        await new Promise((resolve) => {
          const mergeProcess = child_process.spawn(ffmpegPath, [
            "-y", "-f", "concat", "-safe", "0",
            "-i", concatManifest,
            "-c", "copy",
            finalOutputPath
          ]);

          mergeProcess.stderr.on("data", (d) => console.log("[Concat]", d.toString().trim()));
          mergeProcess.on("close", (code) => {
            try { fs.unlinkSync(concatManifest); } catch (e) {}
            if (code === 0) {
              console.log(`[Recorder] Merge success → ${finalOutputPath}`);
            } else {
              console.error(`[Recorder] Merge failed (code ${code}), using last chunk`);
              try { fs.copyFileSync(validChunks[validChunks.length - 1], finalOutputPath); } catch (e) {}
            }
            resolve();
          });
        });
      }

      // Cleanup temp files
      for (const chunkPath of validChunks) {
        if (path.resolve(chunkPath) !== path.resolve(finalOutputPath)) {
          try { fs.unlinkSync(chunkPath); } catch (e) {}
        }
      }
      if (this.manifestPath && fs.existsSync(this.manifestPath)) {
        try { fs.unlinkSync(this.manifestPath); } catch (e) {}
      }
      for (const sdp of this.sdpPaths) {
        try { fs.unlinkSync(sdp); } catch (e) {}
      }

      this.recordingChunks = [];
      this.sdpPaths = [];
      this.manifestPath = null;

      console.log(`[Recorder] Done: ${finalOutputPath}`);
    } catch (e) {
      console.error("[Recorder] saveRecording error:", e);
    }
  }
}
