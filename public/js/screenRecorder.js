let mediaRecorder = null;
let recordedChunks = [];
let finalStream = null;
let audioContext = null;


export async function startScreenRecording() {
  console.log("[Recorder] Starting…");

  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 60 },
    audio: true
  });

  console.log(
    "[Recorder] Screen tracks:",
    screenStream.getTracks().map(t => `${t.kind}:${t.label}`)
  );

  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  console.log(
    "[Recorder] Mic tracks:",
    micStream.getTracks().map(t => `${t.kind}:${t.label}`)
  );

  audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();

  // Mic → mixer
  const micSource = audioContext.createMediaStreamSource(micStream);
  micSource.connect(destination);

  // System audio → mixer (if user enabled it)
  if (screenStream.getAudioTracks().length > 0) {
    const screenAudioSource =
      audioContext.createMediaStreamSource(screenStream);
    screenAudioSource.connect(destination);
    console.log("[Recorder] System audio connected");
  } else {
    console.warn(
      "⚠️ NO system audio track (user did not enable audio sharing)"
    );
  }


  finalStream = new MediaStream([
    ...screenStream.getVideoTracks(),
    ...destination.stream.getAudioTracks()
  ]);

  console.log(
    "[Recorder] Final tracks:",
    finalStream.getTracks().map(t => `${t.kind}:${t.label}`)
  );

  // HARD FAIL if audio is missing
  if (finalStream.getAudioTracks().length === 0) {
    throw new Error("❌ No audio track present — recording aborted");
  }

  mediaRecorder = new MediaRecorder(finalStream, {
    mimeType: "video/webm; codecs=vp8,opus",
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 5_000_000
  });

  recordedChunks = [];

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
      console.log(
        `[Recorder] Chunk ${(e.data.size / 1024).toFixed(1)} KB`
      );
    }
  };

  mediaRecorder.onstart = () => {
    console.log("✅ Recording started (AUDIO CONFIRMED)");
  };

  mediaRecorder.onerror = e => {
    console.error("[Recorder] Error:", e);
  };

  mediaRecorder.start();
}

export function stopScreenRecording() {
  console.log("[Recorder] Stopping…");

  return new Promise(resolve => {
    if (!mediaRecorder) return resolve();

    mediaRecorder.onstop = () => {
      finalStream.getTracks().forEach(t => t.stop());
      audioContext?.close();
      console.log("[Recorder] Recording stopped");
      resolve();
    };

    mediaRecorder.stop();
  });
}

export async function uploadRecording(roomId) {
  if (!recordedChunks.length) {
    console.warn("[Upload] No recorded data");
    return;
  }

  const blob = new Blob(recordedChunks, { type: "video/webm" });

  console.log(
    `[Upload] Size ${(blob.size / 1024 / 1024).toFixed(2)} MB`
  );

  const formData = new FormData();
  formData.append("recording", blob, `${roomId}.webm`);

  const res = await fetch("/upload-recording", {
    method: "POST",
    body: formData
  });

  console.log(res.ok ? " Upload success" : "Upload failed");
}
