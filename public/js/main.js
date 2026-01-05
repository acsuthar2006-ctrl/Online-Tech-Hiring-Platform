// main.js
import { state } from "./state.js";
import { initSocket } from "./socket.js";
import { startCall, joinCall, exitCall } from "./call.js";
import { micBtn, cameraBtn, localVideo, preview, tempDiv, showWaitingOverlay } from "./ui.js";

// Validate room ID
if (!state.roomId) {
  alert("No room ID found. Redirecting to lobby...");
  window.location.href = "/lobby.html";
}

async function init() {
  try {
    // Add waiting overlay
    if (preview && tempDiv) {
      showWaitingOverlay();
    }

    console.log("[Init] Requesting media permissions...");

    // Get camera + mic (echo-safe)
    state.localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    console.log("[Init] Media permissions granted");

    // Set up local preview (NO echo)
    localVideo.srcObject = state.localStream;
    localVideo.muted = true; // prevents hearing yourself
    localVideo.autoplay = true;
    localVideo.playsInline = true;

    // Start with mic muted
    const audioTrack = state.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = false;
      micBtn.classList.add("off");
      micBtn.querySelector("i").className = "fa fa-microphone-slash";
    }

    // Camera ON by default
    const videoTrack = state.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = true;
      cameraBtn.classList.remove("off");
      cameraBtn.querySelector("i").className = "fa-solid fa-video";
    }

    // Ensure video plays
    try {
      await localVideo.play();
    } catch (err) {
      console.warn("[Init] Autoplay blocked:", err);
    }

    console.log("[Init] Initialization complete");
    
  } catch (err) {
    console.error("[Init] Failed to get media:", err);
    
    let errorMessage = "Failed to access camera/microphone. ";
    
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      errorMessage += "Please allow camera and microphone permissions and refresh the page.";
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      errorMessage += "No camera or microphone found. Please connect a device and refresh.";
    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      errorMessage += "Camera/microphone is already in use by another application.";
    } else {
      errorMessage += err.message;
    }
    
    alert(errorMessage);
    window.location.href = "/lobby.html";
  }
}

// Cleanup on page unload
window.addEventListener("beforeunload", (e) => {
  if (state.pc && state.pc.connectionState === "connected") {
    exitCall();
    // Some browsers require returnValue to show confirmation
    e.preventDefault();
    e.returnValue = '';
  }
});

// Handle page visibility changes
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    console.log("[Main] Page hidden");
  } else {
    console.log("[Main] Page visible");
  }
});

// Initialize
init().then(() => {
  initSocket();
});

// Expose functions for HTML buttons
window.startCall = startCall;
window.joinCall = joinCall;
window.exitCall = exitCall;

// 🎤 Mic toggle
micBtn.addEventListener("click", () => {
  if (!state.localStream) {
    console.warn("[Mic] No local stream");
    return;
  }

  const audioTrack = state.localStream.getAudioTracks()[0];
  if (!audioTrack) {
    console.warn("[Mic] No audio track");
    return;
  }

  const icon = micBtn.querySelector("i");
  const willEnable = !audioTrack.enabled;

  audioTrack.enabled = willEnable;
  micBtn.classList.toggle("off", !willEnable);

  icon.className = willEnable
    ? "fa fa-microphone"
    : "fa fa-microphone-slash";

  console.log(`[Mic] ${willEnable ? 'Unmuted' : 'Muted'}`);
});

// 📹 Camera toggle
cameraBtn.addEventListener("click", () => {
  if (!state.localStream) {
    console.warn("[Camera] No local stream");
    return;
  }

  const videoTrack = state.localStream.getVideoTracks()[0];
  if (!videoTrack) {
    console.warn("[Camera] No video track");
    return;
  }

  const icon = cameraBtn.querySelector("i");
  const willEnable = !videoTrack.enabled;

  videoTrack.enabled = willEnable;
  cameraBtn.classList.toggle("off", !willEnable);

  icon.className = willEnable
    ? "fa-solid fa-video"
    : "fa-solid fa-video-slash";

  console.log(`[Camera] ${willEnable ? 'Enabled' : 'Disabled'}`);
});