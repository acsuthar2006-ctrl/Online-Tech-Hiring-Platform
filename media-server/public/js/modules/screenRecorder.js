let mediaRecorder = null;
let recordedChunks = [];
let finalStream = null;
let audioContext = null;
let destination = null;
let remoteSource = null;
let screenStream = null;
let micStream = null;

export async function startScreenRecording(remoteStream) {
  try {
    console.log("[Recorder] Starting...");

    // Clean up any existing recording
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    // Screen + optional system audio
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 60 },
      audio: true,
    });

    // Handle user clicking "Stop sharing" button
    screenStream.getVideoTracks()[0].addEventListener("ended", () => {
      console.log("[Recorder] Screen sharing stopped by user");
      stopScreenRecording();
    });

    // Local mic
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Audio mixer
    audioContext = new AudioContext();
    destination = audioContext.createMediaStreamDestination();

    // Local mic → mixer
    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(destination);

    // System audio → mixer (if enabled)
    if (screenStream.getAudioTracks().length > 0) {
      const systemSource = audioContext.createMediaStreamSource(screenStream);
      systemSource.connect(destination);
      console.log("[Recorder] System audio connected");
    }

    // 🔊 Incoming WebRTC audio → mixer
    if (remoteStream && remoteStream.getAudioTracks().length > 0) {
      remoteSource = audioContext.createMediaStreamSource(remoteStream);
      remoteSource.connect(destination);
      console.log("[Recorder] Incoming voice connected");
    } else {
      console.warn("[Recorder] No incoming audio yet");
    }

    // 🎥 Final stream
    finalStream = new MediaStream([
      ...screenStream.getVideoTracks(),
      ...destination.stream.getAudioTracks(),
    ]);

    if (finalStream.getAudioTracks().length === 0) {
      console.warn("[Recorder] No audio track present, continuing anyway");
    }

    // Check for supported MIME types
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/webm",
    ];

    let selectedMimeType = mimeTypes.find((type) =>
      MediaRecorder.isTypeSupported(type),
    );

    if (!selectedMimeType) {
      throw new Error("No supported MIME type found for recording");
    }

    console.log(`[Recorder] Using MIME type: ${selectedMimeType}`);

    mediaRecorder = new MediaRecorder(finalStream, {
      mimeType: selectedMimeType,
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000,
    });

    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
        console.log(`[Recorder] Chunk recorded: ${e.data.size} bytes`);
      }
    };

    mediaRecorder.onerror = (e) => {
      console.error("[Recorder] Error:", e);
    };

    mediaRecorder.start(1000); // Collect data every second
    console.log("[Recorder] Recording started");
  } catch (err) {
    console.error("[Recorder] Failed to start:", err);
    cleanupRecordingResources();
    throw err;
  }
}

export function attachIncomingAudio(remoteStream) {
  if (
    audioContext &&
    destination &&
    remoteStream &&
    remoteStream.getAudioTracks().length > 0 &&
    !remoteSource
  ) {
    try {
      remoteSource = audioContext.createMediaStreamSource(remoteStream);
      remoteSource.connect(destination);
      console.log("[Recorder] Late incoming audio attached");
    } catch (err) {
      console.error("[Recorder] Failed to attach incoming audio:", err);
    }
  }
}

function cleanupRecordingResources() {
  // Stop all tracks
  if (finalStream) {
    finalStream.getTracks().forEach((t) => t.stop());
    finalStream = null;
  }

  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }

  if (micStream) {
    micStream.getTracks().forEach((t) => t.stop());
    micStream = null;
  }

  // Close audio context
  if (audioContext && audioContext.state !== "closed") {
    audioContext.close();
    audioContext = null;
  }

  // Reset sources
  remoteSource = null;
  destination = null;
}

export function stopScreenRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      cleanupRecordingResources();
      return resolve();
    }

    console.log("[Recorder] Stopping MediaRecorder...");

    mediaRecorder.onstop = () => {
      console.log("[Recorder] MediaRecorder stopped");

      // 🔹 Now it is SAFE to stop tracks
      cleanupRecordingResources();

      resolve();
    };

    try {
      mediaRecorder.stop();
    } catch (err) {
      console.error("[Recorder] Stop error:", err);
      cleanupRecordingResources();
      resolve();
    }
  });
}

export async function uploadRecording(roomId) {
  if (!recordedChunks || recordedChunks.length === 0) {
    console.warn("[Recorder] No chunks to upload");
    return;
  }

  try {
    // 🔹 Yield so UI can repaint / navigate
    await new Promise((r) => setTimeout(r, 0));

    console.log("[Recorder] Preparing recording upload...");

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    console.log(`[Recorder] Recording size: ${blob.size} bytes`);

    const formData = new FormData();
    formData.append("recording", blob, `${roomId}.webm`);

    const MAX_BEACON_SIZE = 50 * 1024 * 1024; // 50 MB safe threshold

    //  Prefer sendBeacon during exit
    if (blob.size <= MAX_BEACON_SIZE && navigator.sendBeacon) {
      const ok = navigator.sendBeacon("/upload-recording", formData);

      if (ok) {
        console.log("[Recorder] Uploaded via sendBeacon");
        recordedChunks = [];
        return;
      } else {
        console.warn(
          "[Recorder] sendBeacon rejected payload, falling back to fetch",
        );
      }
    }

    //  Fallback to fetch (background upload)
    const response = await fetch("/upload-recording", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    console.log("[Recorder] Upload successful via fetch");
    recordedChunks = [];
  } catch (err) {
    console.error("[Recorder] Upload failed:", err);
    // Keep chunks so you can retry later
  }
}
