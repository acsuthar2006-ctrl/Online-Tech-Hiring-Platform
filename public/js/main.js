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

  state.localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  turnOffCamera(state.localStream, cameraBtn);
  muteMicrophone(state.localStream, micBtn);

  micBtn.classList.add("off");
  cameraBtn.classList.add("off");

  localVideo.srcObject = state.localStream;
}

window.addEventListener("beforeunload", exitCall);

init();
initSocket();

// expose for buttons (unchanged behavior)
window.startCall = startCall;
window.joinCall = joinCall;
window.exitCall = exitCall;

micBtn.addEventListener("click", () => {
  if (!state.localStream) return;

  micBtn.classList.toggle("off");

  micBtn.classList.contains("off")
    ? muteMicrophone(state.localStream, micBtn)
    : unmuteMicrophone(state.localStream, micBtn);
});

cameraBtn.addEventListener("click", () => {
  if (!state.localStream) return;

  cameraBtn.classList.toggle("off");

  cameraBtn.classList.contains("off")
    ? turnOffCamera(state.localStream, cameraBtn)
    : turnOnCamera(state.localStream, cameraBtn);
});