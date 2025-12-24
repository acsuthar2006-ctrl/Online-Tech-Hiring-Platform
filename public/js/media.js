// media.js
export function muteMicrophone(stream, micBtn) {
  if (!stream) return;
  micBtn.querySelector("i").className = "fa-solid fa-microphone-slash";
  stream.getAudioTracks().forEach(t => (t.enabled = false));
}

export function unmuteMicrophone(stream, micBtn) {
  if (!stream) return;
  micBtn.querySelector("i").className = "fa-solid fa-microphone";
  stream.getAudioTracks().forEach(t => (t.enabled = true));
}

export function turnOffCamera(stream, cameraBtn) {
  if (!stream) return;
  cameraBtn.querySelector("i").className = "fa-solid fa-video-slash";
  stream.getVideoTracks().forEach(t => (t.enabled = false));
}

export function turnOnCamera(stream, cameraBtn) {
  if (!stream) return;
  cameraBtn.querySelector("i").className = "fa-solid fa-video";
  stream.getVideoTracks().forEach(t => (t.enabled = true));
}