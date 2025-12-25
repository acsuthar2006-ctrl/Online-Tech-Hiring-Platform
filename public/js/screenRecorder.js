let mediaRecorder = null;
let recordedChunks = [];
let screenStream = null;

export async function startScreenRecording() {
  console.log("[Recorder] Requesting screen capture…");

  screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 60 },
    audio: true
  });

  console.log("[Recorder] Screen capture started", screenStream);

  mediaRecorder = new MediaRecorder(screenStream, {
    mimeType: "video/webm; codecs=vp8,opus"
  });

  recordedChunks = [];

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
      console.log(
        `[Recorder] Chunk received: ${(e.data.size / 1024).toFixed(1)} KB`
      );
    }
  };

  mediaRecorder.onstart = () => {
    console.log("[Recorder] Recording started");
  };

  mediaRecorder.onerror = e => {
    console.error("[Recorder] Error:", e);
  };

  mediaRecorder.start(); // ❗ NO timeslice
}

export function stopScreenRecording() {
  console.log("[Recorder] Stopping recording…");

  return new Promise(resolve => {
    if (!mediaRecorder) {
      console.warn("[Recorder] No active recorder");
      return resolve();
    }

    mediaRecorder.onstop = () => {
      console.log(
        `[Recorder] Recording stopped. Total chunks: ${recordedChunks.length}`
      );

      screenStream.getTracks().forEach(t => t.stop());
      console.log("[Recorder] Screen tracks stopped");

      resolve();
    };

    mediaRecorder.stop();
  });
}

export async function uploadRecording(roomId) {
  if (!recordedChunks.length) {
    console.warn("[Upload] No recorded data to upload");
    return;
  }

  const blob = new Blob(recordedChunks, { type: "video/webm" });

  console.log(
    `[Upload] Preparing upload: ${(blob.size / 1024 / 1024).toFixed(2)} MB`
  );

  const formData = new FormData();
  formData.append("recording", blob, `${roomId}.webm`);

  console.log("[Upload] Upload started…");

  setTimeout(3000, () => { });
  const res = await fetch("/upload-recording", {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    console.error("[Upload] Upload failed:", res.status);
  } else {
    console.log("[Upload] Upload completed successfully");
  }
}