
import { createPlainTransport } from './mediasoup.js';
import child_process from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs';
import ffmpegPath from 'ffmpeg-static';

const RECORD_DIR = process.env.RECORDING_DIR || './recordings';

if (!fs.existsSync(RECORD_DIR)) {
    fs.mkdirSync(RECORD_DIR);
}

// Returns an RTP capability object for the recorder
const getRtpCapabilities = () => {
    return {
        codecs: [
            {
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
                parameters: {
                    spropStr: ''
                },
                rtcpFeedback: []
            },
            {
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {},
                rtcpFeedback: []
            }
        ],
        headerExtensions: []
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

            await transport.connect({ ip: '127.0.0.1', port });

            const consumer = await transport.consume({
                producerId: p.producerId,
                rtpCapabilities: getRtpCapabilities(),
                paused: true
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

            if (kind === 'audio') {
                sdp += `m=audio ${port} RTP/AVP ${codec.payloadType}
a=rtpmap:${codec.payloadType} ${codec.mimeType.split('/')[1]}/${codec.clockRate}/${codec.channels}
a=fmtp:${codec.payloadType} sprop-stereo=1
a=rtcp-mux
`;
            } else {
                sdp += `m=video ${port} RTP/AVP ${codec.payloadType}
a=rtpmap:${codec.payloadType} ${codec.mimeType.split('/')[1]}/${codec.clockRate}
a=rtcp-mux
`;
            }
        }

        const timestamp = Date.now();
        const filename = `${this.roomId}-${timestamp}.mp4`; // MP4 output
        const filepath = path.join(RECORD_DIR, filename);

        // FFmpeg Filter Complex for merging
        // [0:a][2:a]amix=inputs=2[a]
        // [1:v][3:v]hstack[v]

        // Note: Map indices depend on SDP order. 
        // 0: Audio 1, 1: Video 1, 2: Audio 2, 3: Video 2

        const args = [
            '-protocol_whitelist', 'file,pipe,udp,rtp',
            '-analyzeduration', '50M',
            '-probesize', '50M',
            '-f', 'sdp',
            '-i', 'pipe:0',
        ];

        // Dynamic Filter Complex
        let filterComplex = '';

        // Case 1: Standard 2-way toggle (4 streams: A1, V1, A2, V2)
        if (this.consumers.length === 4) {
            filterComplex = '[0:0][0:2]amix=inputs=2[aout];[0:1]scale=-2:720[v1];[0:3]scale=-2:720[v2];[v1][v2]hstack[vout]';
        }
        // Case 2: Screen Share (5 streams: A1, V1, A2, V2, Screen)
        else if (this.consumers.length === 5) {
            // Layout: Screen Left (1280x720), Cams Stacked Right (640x360 each) -> Total 1920x720
            // Mapping: 0:A1, 1:V1, 2:A2, 3:V2, 4:Screen
            filterComplex = `
                [0:0][0:2]amix=inputs=2[aout];
                [0:1]scale=640:360[v1];
                [0:3]scale=640:360[v2];
                [0:4]scale=1280:720[scr];
                [v1][v2]vstack[cams];
                [scr][cams]hstack[vout]
            `.replace(/\s+/g, ''); // Remove newlines/spaces
        }

        args.push('-filter_complex', filterComplex);
        args.push('-map', '[aout]');
        args.push('-map', '[vout]');

        args.push(
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-crf', '28',
            '-r', '30',
            '-c:a', 'aac',
            '-b:a', '96k',
            '-y', filepath
        );

        console.log(`[Recorder] Spawning FFmpeg: ${args.join(' ')}`);

        this.process = child_process.spawn(ffmpegPath, args);

        this.process.stdin.write(sdp);
        this.process.stdin.end();

        this.process.stderr.on('data', (data) => {
            console.log('[FFmpeg Log]', data.toString());
        });

        this.process.on('close', (code) => {
            console.log(`[Recorder] FFmpeg exited with code ${code}`);
            this.emit('stop');
        });

        // Wait briefly for FFmpeg to start up
        // Was 1000ms, reduced to 200ms to avoid FFmpeg timing out/failing init with 0x0 resolution
        await new Promise(resolve => setTimeout(resolve, 200));

        // Resume consumers and request keyframes immediately
        console.log('[Recorder] Resuming consumers and requesting keyframes...');
        for (const consumer of this.consumers) {
            await consumer.resume();
            if (consumer.kind === 'video') {
                // Request IDR frame so FFmpeg picks up resolution (SPS/PPS)
                await consumer.requestKeyFrame();
                // Repeat request again shortly to ensure receipt
                setTimeout(() => consumer.requestKeyFrame().catch(() => { }), 500);
            }
        }
    }

    stop() {
        console.log('[Recorder] Stopping...');
        this.consumers.forEach(c => c.close());
        this.transports.forEach(t => t.close());
        this.consumers = [];
        this.transports = []; // Clear arrays
        if (this.process) {
            this.process.kill('SIGINT');
        }
    }
}
