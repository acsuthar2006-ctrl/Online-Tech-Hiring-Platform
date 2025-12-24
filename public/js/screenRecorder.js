let mediaRecorder = null;
let recordedChunks = [];
let screenStream = null;

async function startScreenRecording() {
  screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });

  mediaRecorder = new MediaRecorder(screenStream, {
    mimeType: "video/webm; codecs=vp9"
  });

  recordedChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.start();
  console.log("[Recorder] Recording started");
}

function stopScreenRecording() {
  if (!mediaRecorder) return;

  mediaRecorder.stop();

  // stop screen capture
  screenStream.getTracks().forEach(track => track.stop());

  console.log("[Recorder] Recording stopped");
}

function downloadRecording(filename = "screen-recording.webm") {
  if (!recordedChunks.length) return;

  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function isRecording() {
  return mediaRecorder && mediaRecorder.state === "recording";
}

export {
  startScreenRecording,
  stopScreenRecording,
  downloadRecording,
  isRecording
};