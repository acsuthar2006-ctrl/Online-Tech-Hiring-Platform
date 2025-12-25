// main.js
import { state } from "./state.js";
import { initSocket } from "./socket.js";
import { startCall, joinCall, exitCall } from "./call.js";
import { micBtn, cameraBtn, localVideo, preview, tempDiv } from "./ui.js";
import {
  muteMicrophone,
  unmuteMicrophone,
  turnOffCamera,
  turnOnCamera
} from "./media.js";

if (!state.roomId) {
  alert("No room ID found. Go back to lobby.");
  window.location.href = "/lobby.html";
}

async function init() {
  preview.prepend(tempDiv);

  // 🎥 Get camera + mic (echo-safe)
  state.localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  // 🎙️ Start muted (but track still alive)
  muteMicrophone(state.localStream, micBtn);
  micBtn.classList.add("off");

  // 📹 Camera ON by default
  cameraBtn.classList.remove("off");

  // 👀 Local preview (NO echo)
  localVideo.srcObject = state.localStream;
  localVideo.muted = true;        // 🔥 prevents hearing yourself
  localVideo.autoplay = true;
  localVideo.playsInline = true;

  await localVideo.play().catch(() => {});
}

window.addEventListener("beforeunload", exitCall);

init();
initSocket();

// expose for buttons
window.startCall = startCall;
window.joinCall = joinCall;
window.exitCall = exitCall;

// 🎙️ Mic toggle
micBtn.addEventListener("click", () => {
  if (!state.localStream) return;

  micBtn.classList.toggle("off");

  micBtn.classList.contains("off")
    ? muteMicrophone(state.localStream, micBtn)
    : unmuteMicrophone(state.localStream, micBtn);
});

// 📹 Camera toggle
cameraBtn.addEventListener("click", () => {
  if (!state.localStream) return;

  cameraBtn.classList.toggle("off");

  cameraBtn.classList.contains("off")
    ? turnOffCamera(state.localStream, cameraBtn)
    : turnOnCamera(state.localStream, cameraBtn);
});