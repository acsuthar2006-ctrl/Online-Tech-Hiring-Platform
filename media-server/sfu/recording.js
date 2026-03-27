import { createPlainTransport } from "./mediasoup.js";
import child_process from "child_process";
import { EventEmitter } from "events";
import path from "path";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";

const RECORD_DIR = process.env.RECORDING_DIR || "./recordings";

if (!fs.existsSync(RECORD_DIR)) {
  fs.mkdirSync(RECORD_DIR);
}

// Returns an RTP capability object for the recorder
const getRtpCapabilities = () => {
  return {
    codecs: [
      {
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
        parameters: {
          spropStr: "",
        },
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
    this.process = null;
    this.recordingChunks = []; // Track chunks
    this.manifestPath = null; // Track current session manifest
    this.sdpPaths = []; // Track SDP files
  }

  // New start method accepts an array of producer configs: [{ producerId: '...', kind: 'audio|video' }, ...]
  // We expect 4 producers: Audio1, Video1, Audio2, Video2
  async start(producersList) {
    console.log(`[Recorder] Starting merged recording for room ${this.roomId}`);

    // ── Step 1: Create consumers (paused) and allocate port pairs ────────────
    // We create plain transports first to get their mediasoup-allocated ports,
    // but we do NOT call transport.connect() yet — that happens after FFmpeg binds.

    const portPairs = []; // [{ rtpPort, rtcpPort }, ...]

    for (const p of producersList) {
      const transport = await createPlainTransport(this.router);
      this.transports.push(transport);

      // Pick a dedicated port pair for this stream.
      // Use a range separate from the WebRTC ports to avoid collisions.
      const base = parseInt(process.env.RECORDER_MIN_PORT || 50000);
      const range = parseInt(process.env.RECORDER_MAX_PORT || 59999) - base;
      let rtpPort = base + Math.floor(Math.random() * (range - 1));
      if (rtpPort % 2 !== 0) rtpPort += 1; // RTP must be even
      const rtcpPort = rtpPort + 1;
      portPairs.push({ rtpPort, rtcpPort });

      const consumer = await transport.consume({
        producerId: p.producerId,
        rtpCapabilities: getRtpCapabilities(),
        paused: true, // stay paused until FFmpeg is ready
        appData: p.appData || {},
      });
      this.consumers.push(consumer);
    }

    // ── Step 2: Build the SDP that points FFmpeg at our chosen ports ──────────
    let sdp = `v=0\no=- 0 0 IN IP4 127.0.0.1\ns=FFmpeg\nc=IN IP4 127.0.0.1\nt=0 0\n`;

    for (let i = 0; i < this.consumers.length; i++) {
      const consumer = this.consumers[i];
      const { rtpPort, rtcpPort } = portPairs[i];
      const codec = consumer.rtpParameters.codecs[0];
      const kind = consumer.kind;

      if (kind === "audio") {
        sdp += `m=audio ${rtpPort} RTP/AVP ${codec.payloadType}\n`;
        sdp += `a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}/${codec.channels}\n`;
        sdp += `a=fmtp:${codec.payloadType} sprop-stereo=1\n`;
        sdp += `a=rtcp:${rtcpPort}\n`;
      } else {
        sdp += `m=video ${rtpPort} RTP/AVP ${codec.payloadType}\n`;
        sdp += `a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}\n`;
        sdp += `a=rtcp:${rtcpPort}\n`;
        // Hint the resolution so FFmpeg never sees 0x0 even before the first keyframe
        sdp += `a=imageattr:${codec.payloadType} recv [x=640,y=480]\n`;
      }
    }

    // ── Step 3: Prepare FFmpeg args ───────────────────────────────────────────
    const timestamp = Date.now();
    // Use the custom filename provided by the frontend if available, else fallback
    const outputFilename = this.recordingName ? `${this.recordingName}.mp4` : `${this.roomId}-${timestamp}.mp4`;
    const filepath  = path.join(RECORD_DIR, outputFilename);
    const sdpPath = path.join(RECORD_DIR, `${this.roomId}-${timestamp}.sdp`);
    this.recordingChunks.push(filepath);
    this.sdpPaths.push(sdpPath);

    if (!this.manifestPath) {
      this.manifestPath = path.join(RECORD_DIR, `${this.roomId}-${timestamp}-manifest.txt`);
    }
    fs.appendFileSync(this.manifestPath, `file '${path.resolve(filepath).replace(/\\/g, '/')}'\n`);
    fs.writeFileSync(sdpPath, sdp);

    // DYNAMIC FFMPEG LAYOUT
    let audioInputs = [];
    let cameraInputs = [];
    let screenInput = null;

    // Analyze producers to find what we have
    for (let i = 0; i < this.consumers.length; i++) {
      const consumer = this.consumers[i];
      if (consumer.kind === "audio") {
        audioInputs.push(`[0:${i}]`);
      } else if (consumer.kind === "video") {
        if (consumer.appData && consumer.appData.source === "screen") {
          screenInput = `[0:${i}]`;
        } else {
          cameraInputs.push(`[0:${i}]`);
        }
      }
    }

    let filterComplex = "";
    
    // Mix audio
    if (audioInputs.length > 0) {
      filterComplex += `${audioInputs.join('')}amix=inputs=${audioInputs.length}[aout];`;
    } else {
      // Create silent dummy audio if no audio tracks exist
      filterComplex += `anullsrc=r=48000:cl=stereo[aout];`;
    }

    // Base black background canvas
    const CANVAS_W = 1280;
    const CANVAS_H = 720;
    filterComplex += `color=c=black:s=${CANVAS_W}x${CANVAS_H}[bg];`;

    if (screenInput) {
      // Layout with Screen Share
      filterComplex += `${screenInput}scale=960:720:force_original_aspect_ratio=decrease,pad=960:720:(ow-iw)/2:(oh-ih)/2[scr];`;
      
      if (cameraInputs.length > 0) {
         // Scale cameras to fit right side (320px wide)
         let camFilters = cameraInputs.map((cam, idx) => `${cam}scale=320:240:force_original_aspect_ratio=decrease,pad=320:240:(ow-iw)/2:(oh-ih)/2[c${idx}]`).join(';');
         filterComplex += camFilters + ';';
         
         if (cameraInputs.length === 1) {
             // 1 Camera vertically centered on the right
             filterComplex += `[bg][scr]overlay=0:0[bg1];[bg1][c0]overlay=960:240[vout]`;
         } else {
             // 2 Cameras stacked on the right
             filterComplex += `[bg][scr]overlay=0:0[bg1];[bg1][c0]overlay=960:120[bg2];[bg2][c1]overlay=960:360[vout]`;
         }
      } else {
         // Just Screen Share, centered
         filterComplex += `[bg][scr]overlay=160:0[vout]`;
      }
    } else if (cameraInputs.length > 0) {
      // Layout with Cameras Only
      if (cameraInputs.length === 1) {
          filterComplex += `${cameraInputs[0]}scale=${CANVAS_W}:${CANVAS_H}:force_original_aspect_ratio=decrease,pad=${CANVAS_W}:${CANVAS_H}:(ow-iw)/2:(oh-ih)/2[vout]`;
      } else {
          // 2 Cameras Side by Side
          filterComplex += `${cameraInputs[0]}scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2[c0];`;
          filterComplex += `${cameraInputs[1]}scale=640:480:force_original_aspect_ratio=decrease,pad=640:480:(ow-iw)/2:(oh-ih)/2[c1];`;
          filterComplex += `[bg][c0]overlay=0:120[bg1];[bg1][c1]overlay=640:120[vout]`;
      }
    } else {
      // No video at all
      filterComplex += `color=c=black:s=${CANVAS_W}x${CANVAS_H}[vout]`;
    }

    const args = [
      "-protocol_whitelist", "file,pipe,udp,rtp",
      "-analyzeduration",    "30M",
      "-probesize",          "30M",
      "-thread_queue_size",  "4096",
      "-f",  "sdp",
      "-i",  sdpPath,
      "-filter_complex", filterComplex,
      "-map", "[vout]",
      "-map", "[aout]",
      "-c:v", "libx264", "-preset", "veryfast", "-tune", "zerolatency",
      "-crf", "21", "-r", "30",
      "-c:a", "aac", "-b:a", "192k",
      "-movflags", "frag_keyframe+empty_moov",
      "-y", filepath
    ];

    // ── Step 4: Spawn FFmpeg and write SDP ────────────────────────────────────
    // FFmpeg binds to the UDP ports in the SDP as soon as it starts probing.
    // We must wait for that bind to complete BEFORE connecting mediasoup
    // transports (which start pushing RTP immediately on connect).
    console.log(`[Recorder] Process command: ffmpeg ${args.join(" ")}`);
    this.process = child_process.spawn(ffmpegPath, args);

    this.process.stderr.on("data", (data) => {
      console.log("[FFmpeg Log]", data.toString());
    });
    this.process.on("close", (code) => {
      console.log(`[Recorder] FFmpeg exited with code ${code}`);
      this.emit("stop");
    });

    // Give FFmpeg time to open its UDP sockets before we start pushing RTP.
    // 1500 ms is generous but safe — FFmpeg bind is near-instant in practice.
    console.log("[Recorder] Waiting for FFmpeg to bind UDP ports...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // ── Step 5: Connect transports → FFmpeg's ports, then resume ─────────────
    // Now that FFmpeg is listening, connect each transport so mediasoup knows
    // where to forward RTP.  With comedia=false this starts pushing immediately.
    console.log("[Recorder] Connecting transports to FFmpeg ports and resuming consumers...");
    for (let i = 0; i < this.transports.length; i++) {
      const { rtpPort, rtcpPort } = portPairs[i];
      await this.transports[i].connect({ ip: "127.0.0.1", port: rtpPort, rtcpPort });
    }

    // Resume consumers and request keyframes — RTP will flow right away.
    for (const consumer of this.consumers) {
      await consumer.resume();
      if (consumer.kind === "video") {
        await consumer.requestKeyFrame();
      }
    }

    // One more keyframe burst 800 ms later to make sure the I-frame
    // lands inside FFmpeg's probe window.
    setTimeout(async () => {
      for (const consumer of this.consumers) {
        if (consumer.kind === "video") {
          consumer.requestKeyFrame().catch(() => {});
        }
      }
    }, 800);

    console.log("[Recorder] Recording pipeline active.");
  }

  async stop() {
    console.log("[Recorder] Stopping current process...");

    if (this.process) {
      await new Promise((resolve) => {
          const proc = this.process;
          this.process = null; // Clear reference immediately
          
          // Set a fallback timeout in case FFmpeg hangs
          const timeout = setTimeout(() => {
              console.warn("[Recorder] Force killing FFmpeg after timeout");
              proc.kill("SIGKILL");
              resolve();
          }, 5000);

          proc.on('close', (code) => {
              clearTimeout(timeout);
              console.log(`[Recorder] FFmpeg process closed (code ${code}). Ready to merge.`);
              resolve();
          });
          
          // Send SIGINT to allow FFmpeg to write trailer (MOOV atom)
          if (process.platform === "win32") {
              try {
                  proc.stdin.write("q\n");
              } catch (e) {
                  proc.kill("SIGKILL");
              }
          } else {
              proc.kill("SIGINT");
          }
      });
    }

    // Close transports after FFmpeg has finished
    this.consumers.forEach((c) => c.close());
    this.transports.forEach((t) => t.close());
    this.consumers = [];
    this.transports = []; // Clear arrays

    return Promise.resolve();
  }

  async saveRecording(customFilename) {
    const outputName = customFilename || `${this.roomId}.mp4`;
    let finalOutputPath = path.join(RECORD_DIR, outputName);
    
    // Ensure final filename ends with .mp4
    if (!finalOutputPath.endsWith('.mp4')) {
        finalOutputPath += '.mp4';
    }

    try {
        const validChunks = [];
        for (const p of this.recordingChunks) {
            if (fs.existsSync(p)) {
                const size = fs.statSync(p).size;
                if (size > 0) validChunks.push(p);
            }
        }

        if (validChunks.length === 0) {
            console.log("[Recorder] No valid chunk files found to merge/save.");
            return;
        }

        if (validChunks.length === 1 || !this.manifestPath || !fs.existsSync(this.manifestPath)) {
            // Only one chunk, just copy/rename it
            console.log(`[Recorder] Only 1 chunk found. Saving directly to: ${finalOutputPath}`);
            if (path.resolve(validChunks[0]) !== path.resolve(finalOutputPath)) {
                fs.copyFileSync(validChunks[0], finalOutputPath);
            }
        } else {
            // Multiple chunks, we must merge them using the FFmpeg concat demuxer
            console.log(`[Recorder] Merging ${validChunks.length} chunks into: ${finalOutputPath}`);
            
            await new Promise((resolve, reject) => {
                const args = [
                    "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", this.manifestPath,
                    "-c", "copy", // Copy streams without re-encoding
                    finalOutputPath
                ];

                const mergeProcess = child_process.spawn(ffmpegPath, args);

                mergeProcess.stderr.on("data", (data) => {
                    console.log("[Concat Log]", data.toString());
                });

                mergeProcess.on("close", (code) => {
                    if (code === 0) {
                        console.log(`[Recorder] Successfully merged recordings into ${finalOutputPath}`);
                        resolve();
                    } else {
                        console.error(`[Recorder] FFmpeg merge failed with code ${code}`);
                        reject(new Error(`Merge failed with code ${code}`));
                    }
                });
            });
        }

        // Cleanup chunks and manifest
        console.log("[Recorder] Cleaning up chunk files and manifest...");
        if (this.manifestPath && fs.existsSync(this.manifestPath)) {
            try { fs.unlinkSync(this.manifestPath); } catch(e) {}
        }
        for (const chunkPath of validChunks) {
            if (path.resolve(chunkPath) !== path.resolve(finalOutputPath)) {
                try { fs.unlinkSync(chunkPath); } catch(e) {}
            }
        }
        for (const sdp of this.sdpPaths) {
            try { fs.unlinkSync(sdp); } catch(e) {}
        }
        
        // Reset state
        this.recordingChunks = [];
        this.sdpPaths = [];
        this.manifestPath = null;

    } catch (e) {
        console.error("[Recorder] Merge failed:", e);
    }
  }
}
