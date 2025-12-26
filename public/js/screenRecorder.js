let mediaRecorder = null;
let recordedChunks = [];
let finalStream = null;
let audioContext = null;
let destination = null;
let remoteSource = null;

export async function startScreenRecording(remoteStream) {
  console.log("[Recorder] Starting…");

  // Screen + optional system audio
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 60 },
    audio: true
  });

  // Local mic
  const micStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  // Audio mixer
  audioContext = new AudioContext();
  destination = audioContext.createMediaStreamDestination();

  // Local mic → mixer
  const micSource =
    audioContext.createMediaStreamSource(micStream);
  micSource.connect(destination);

  // System audio → mixer (if enabled)
  if (screenStream.getAudioTracks().length > 0) {
    const systemSource =
      audioContext.createMediaStreamSource(screenStream);
    systemSource.connect(destination);
    console.log("[Recorder] System audio connected");
  }

  // 🔑 Incoming WebRTC audio → mixer
  if (remoteStream && remoteStream.getAudioTracks().length > 0) {
    remoteSource =
      audioContext.createMediaStreamSource(remoteStream);
    remoteSource.connect(destination);
    console.log("[Recorder] Incoming voice connected");
  } else {
    console.warn("[Recorder] No incoming audio yet");
  }

  // 🎥 Final stream
  finalStream = new MediaStream([
    ...screenStream.getVideoTracks(),
    ...destination.stream.getAudioTracks()
  ]);

  if (finalStream.getAudioTracks().length === 0) {
    throw new Error("No audio track present");
  }

  mediaRecorder = new MediaRecorder(finalStream, {
    mimeType: "video/webm; codecs=vp8,opus",
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 5_000_000
  });

  recordedChunks = [];

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.start();
  console.log("Recording started");
}

export function attachIncomingAudio(remoteStream) {
  if (
    audioContext &&
    destination &&
    remoteStream &&
    remoteStream.getAudioTracks().length &&
    !remoteSource
  ) {
    remoteSource =
      audioContext.createMediaStreamSource(remoteStream);
    remoteSource.connect(destination);
    console.log("[Recorder] Late incoming audio attached");
  }
}

export function stopScreenRecording() {
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
  if (!recordedChunks.length) return;

  const blob = new Blob(recordedChunks, { type: "video/webm" });

  const formData = new FormData();
  formData.append("recording", blob, `${roomId}.webm`);

  await fetch("/upload-recording", {
    method: "POST",
    body: formData
  });

  console.log("Upload success");
}