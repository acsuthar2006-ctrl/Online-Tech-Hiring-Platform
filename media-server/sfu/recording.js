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
  }

  // New start method accepts an array of producer configs: [{ producerId: '...', kind: 'audio|video' }, ...]
  // We expect 4 producers: Audio1, Video1, Audio2, Video2
  async start(producersList) {
    console.log(`[Recorder] Starting merged recording for room ${this.roomId}`);

    const ports = []; // Track ports to build SDP

    // We need 4 transports
    // Let's assume producersList order: [Audio1, Video1, Audio2, Video2] based on logic in server

    for (const p of producersList) {
      const transport = await createPlainTransport(this.router);
      this.transports.push(transport);

      // Assign a random port
      // Assign a random port within configured range
      const minPort = parseInt(process.env.RECORDER_MIN_PORT || 50000);
      const maxPort = parseInt(process.env.RECORDER_MAX_PORT || 59999);
      const port = minPort + Math.floor(Math.random() * (maxPort - minPort));
      ports.push(port);

      await transport.connect({ ip: "127.0.0.1", port });

      const consumer = await transport.consume({
        producerId: p.producerId,
        rtpCapabilities: getRtpCapabilities(),
        paused: true,
      });

      this.consumers.push(consumer);
      // Consumers remain paused until FFmpeg is ready
    }

    // Build SDP
    // Mappings:
    // Stream 0: Audio 1
    // Stream 1: Video 1
    // Stream 2: Audio 2
    // Stream 3: Video 2

    let sdp = `v=0
o=- 0 0 IN IP4 127.0.0.1
s=FFmpeg
c=IN IP4 127.0.0.1
t=0 0
`;

    for (let i = 0; i < this.consumers.length; i++) {
      const consumer = this.consumers[i];
      const port = ports[i];
      const codec = consumer.rtpParameters.codecs[0];
      const kind = consumer.kind;

      if (kind === "audio") {
        sdp += `m=audio ${port} RTP/AVP ${codec.payloadType}
a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}/${codec.channels}
a=fmtp:${codec.payloadType} sprop-stereo=1
a=rtcp-mux
`;
      } else {
        sdp += `m=video ${port} RTP/AVP ${codec.payloadType}
a=rtpmap:${codec.payloadType} ${codec.mimeType.split("/")[1]}/${codec.clockRate}
a=rtcp-mux
`;
      }
    }

    const timestamp = Date.now();
    const filename = `${this.roomId}-${timestamp}.mp4`; // MP4 output
    const filepath = path.join(RECORD_DIR, filename);
    
    // Store chunk with full path
    this.recordingChunks.push(filepath);

    // Append to manifest file for reliability
    if (!this.manifestPath) {
        this.manifestPath = path.join(RECORD_DIR, `${this.roomId}-${timestamp}-manifest.txt`);
    }
    fs.appendFileSync(this.manifestPath, `file '${path.resolve(filepath)}'\n`);

    // FFmpeg Filter Complex for merging
    // [0:a][2:a]amix=inputs=2[a]
    // [1:v][3:v]hstack[v]

    // Note: Map indices depend on SDP order.
    // 0: Audio 1, 1: Video 1, 2: Audio 2, 3: Video 2

    const args = [
      "-protocol_whitelist",
      "file,pipe,udp,rtp",
      "-analyzeduration",
      "100M", // 100s
      "-probesize",
      "100M", // 100MB
      "-thread_queue_size",
      "4096",
      "-f",
      "sdp",
      "-i",
      "pipe:0",
    ];

    // Dynamic Filter Complex
    let filterComplex = "";

    if (this.consumers.length === 4) {
      // 2 Video Streams side-by-side
      filterComplex =
        "[0:0][0:2]amix= inputs=2[aout];[0:1]scale=640:480[v1];[0:3]scale=640:480[v2];[v1][v2]hstack[vout]";
    } else if (this.consumers.length === 5) {
      // Enhanced resolution for better quality (Target: 1920x720)
      // Screen: 1280x720
      // Cams: 640x360 each (stacked vertically = 640x720)
      filterComplex = `
                [0:0][0:2]amix=inputs=2[aout];
                [0:1]scale=640:360[v1];
                [0:3]scale=640:360[v2];
                [0:4]scale=1280:720[scr];
                [v1][v2]vstack[cams];
                [scr][cams]hstack[vout]
            `.replace(/\s+/g, "");
    }

    args.push("-filter_complex", filterComplex);
    args.push("-map", "[aout]");
    args.push("-map", "[vout]");

    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "veryfast", // Better quality/size balance than superfast
      "-tune",
      "zerolatency",
      "-crf",
      "21", // High quality (lower is better, was 24)
      "-r",
      "30", // Standard 30fps for smoother video
      "-c:a",
      "aac",
      "-b:a",
      "192k", // High quality audio
      "-y",
      filepath,
    );

    console.log(`[Recorder] Spawning FFmpeg: ${args.join(" ")}`);

    this.process = child_process.spawn(ffmpegPath, args);

    this.process.stdin.write(sdp);
    this.process.stdin.end();

    this.process.stderr.on("data", (data) => {
      console.log("[FFmpeg Log]", data.toString());
    });

    this.process.on("close", (code) => {
      console.log(`[Recorder] FFmpeg exited with code ${code}`);
      this.emit("stop");
    });

    // Wait for FFmpeg to initialize and bind ports
    // Increased to 1500ms to allow FFmpeg to be ready to receive packets
    console.log("[Recorder] Waiting for FFmpeg to initialize...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Resume consumers and request keyframes
    console.log("[Recorder] Resuming consumers and requesting keyframes...");
    for (const consumer of this.consumers) {
      await consumer.resume();
      if (consumer.kind === "video") {
        await consumer.requestKeyFrame();
        // Repeat keyframe request to ensure I-frame arrival
        setTimeout(() => consumer.requestKeyFrame().catch(() => {}), 1000);
      }
    }
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
          proc.kill("SIGINT");
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
    // If no manifest path tracked, try default or fail
    if (!this.manifestPath) {
        console.log("[Recorder] No manifest session tracked, nothing to save.");
        // Try fallback to legacy path if this.manifestPath wasn't set (shouldn't happen with new logic but safe)
        const legacyPath = path.join(RECORD_DIR, `${this.roomId}-manifest.txt`);
        if (fs.existsSync(legacyPath)) {
             console.log("[Recorder] Falling back to legacy manifest path.");
             this.manifestPath = legacyPath;
        } else {
             return;
        }
    }
    
    if (!fs.existsSync(this.manifestPath)) {
        console.log("[Recorder] Manifest file not found on disk.");
        return;
    }

    console.log(`[Recorder] Merging chunks from manifest...`);

    const outputName = customFilename || `${this.roomId}.mp4`;
    const finalOutputPath = path.join(RECORD_DIR, outputName);

    try {
        // Run FFmpeg concat
        // ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
        const args = [
            "-f", "concat",
            "-safe", "0",
            "-i", this.manifestPath,
            "-c", "copy",
            "-y",
            finalOutputPath
        ];

        console.log(`[Recorder] Spawning FFmpeg Merge: ${args.join(" ")}`);
        
        await new Promise((resolve, reject) => {
            const proc = child_process.spawn(ffmpegPath, args);
            
            proc.stderr.on('data', d => console.log(`[FFmpeg Merge] ${d}`));
            
            proc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg merge exited with code ${code}`));
            });
        });

        console.log(`[Recorder] Merge complete: ${finalOutputPath}`);

        // Cleanup chunks
        console.log("[Recorder] Cleaning up chunks...");
        // Read manifest to preserve file paths for deletion
        if (fs.existsSync(this.manifestPath)) {
            const content = fs.readFileSync(this.manifestPath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            for (const line of lines) {
                // line format: file '/path/to/file'
                const match = line.match(/file '(.*)'/);
                if (match && match[1]) {
                    try { fs.unlinkSync(match[1]); } catch(e) { }
                }
            }
            try { fs.unlinkSync(this.manifestPath); } catch(e) {}
        }
        
        // Reset state
        this.recordingChunks = [];
        this.manifestPath = null;

    } catch (e) {
        console.error("[Recorder] Merge failed:", e);
    }
  }
}
