let mediaRecorder = null;
let recordedChunks = [];
let screenStream = null;

export async function startScreenRecording() {
  screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30 },
    audio: true
  });

  mediaRecorder = new MediaRecorder(screenStream, {
    mimeType: "video/webm; codecs=vp8,opus"
  });

  recordedChunks = [];

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.start(); // ❗ NO timeslice
}

export function stopScreenRecording() {
  return new Promise(resolve => {
    if (!mediaRecorder) return resolve();

    mediaRecorder.onstop = () => {
      // stop tracks ONLY after recorder finishes
      screenStream.getTracks().forEach(t => t.stop());
      resolve();
    };

    mediaRecorder.stop();
  });
}

export async function uploadRecording(roomId) {
  if (!recordedChunks.length) return;

  const blob = new Blob(recordedChunks, { type: "video/webm" });

  const formData = new FormData();
  formData.append("recording", blob, `${roomId}.webm`);

  await fetch("/upload-recording", {
    method: "POST",
    body: formData
  });
}