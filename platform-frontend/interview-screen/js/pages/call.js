// call.js
import { state } from "../core/state.js";
import { initSocket } from "../core/socket.js";
import { startCall, joinCall, exitCall } from "../modules/callControls.js";
import {
  micBtn,
  cameraBtn,
  localVideo,
  preview,
  tempDiv,
  showWaitingOverlay,
  updateCallButtonState,
  screenShareBtn,
} from "../modules/call-ui.js";

// Initialize UI state
updateCallButtonState(false);

// Validate room ID
if (!state.roomId) {
  alert("No room ID found. Redirecting to lobby...");
  window.location.href = "/lobby.html";
}


// Immediately show overlay for candidates to prevent flash
if (state.role === 'candidate') {
  const overlay = document.getElementById("candidate-overlay");
  if (overlay) overlay.style.display = "flex";
}

async function init() {
  try {
    // Add waiting overlay
    if (preview && tempDiv) {
      showWaitingOverlay();
    }

    console.log("[Init] Requesting media permissions...");

    // Set UI labels and waiting message based on role
    const localLabel = document.querySelector(".local-card .user-label");
    const remoteLabel = document.querySelector(".remote-card .user-label");
    const waitingText = document.querySelector(".waiting-content p");

    // Get user email from URL or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const userEmail = urlParams.get("email") || sessionStorage.getItem("userEmail");

    // Fetch real names from the queue API
    let localName = state.role === 'interviewer' ? 'Interviewer' : 'Candidate';
    let remoteName = state.role === 'interviewer' ? 'Candidate' : 'Interviewer';

    try {
      const res = await fetch(`/api/interviews/session/${state.roomId}/queue`);
      if (res.ok) {
        const data = await res.json();

        if (state.role === 'interviewer' && data.timeline && data.timeline.length > 0) {
          // For interviewer, show first candidate's name
          localName = data.timeline[0].interviewer?.fullName || 'Interviewer';
          remoteName = data.timeline[0].candidate?.fullName || 'Candidate';
        } else if (state.role === 'candidate' && userEmail && data.timeline) {
          // For candidate, find their interview
          const myInterview = data.timeline.find(i => i.candidate.email === userEmail);
          if (myInterview) {
            localName = myInterview.candidate?.fullName || 'Candidate';
            remoteName = myInterview.interviewer?.fullName || 'Interviewer';
          }
        }
      }
    } catch (e) {
      console.warn("[Init] Could not fetch names, using defaults:", e);
    }

    if (state.role === 'interviewer') {
      localLabel.innerHTML =
        `<i class="fas fa-user-tie"></i> ${localName}`;
      remoteLabel.innerHTML = `<i class="fas fa-user"></i> ${remoteName}`;
      if (waitingText)
        waitingText.innerText = "The Candidate will join shortly...";

      // Show Queue Button
      const queueBtn = document.getElementById("queue-btn");
      if (queueBtn) queueBtn.style.display = "flex";
    } else {
      localLabel.innerHTML = `<i class="fas fa-user"></i> ${localName}`;
      remoteLabel.innerHTML = `<i class="fas fa-user-tie"></i> ${remoteName}`;
      if (waitingText)
        waitingText.innerText = "The Interviewer will join shortly...";

      // Candidate only features
      if (screenShareBtn) {
        screenShareBtn.style.display = "flex";

        // Dynamic import
        const { startScreenShare, stopScreenShare } =
          await import("../features/screen-share.js");
        let isSharing = false;

        screenShareBtn.addEventListener("click", async () => {
          if (isSharing) {
            stopScreenShare();
            isSharing = false;
            screenShareBtn.classList.remove("active");
            return;
          }

          try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 },
              },
              audio: false,
            });
            const producer = await startScreenShare(stream);

            if (producer) {
              isSharing = true;
              screenShareBtn.classList.add("active");

              stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
                isSharing = false;
                screenShareBtn.classList.remove("active");
              };
            }
          } catch (err) {
            console.error("Screen share cancelled:", err);
          }
        });
      }
    }

    // Get camera + mic (echo-safe)
    state.localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
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

    if (
      err.name === "NotAllowedError" ||
      err.name === "PermissionDeniedError"
    ) {
      errorMessage +=
        "Please allow camera and microphone permissions and refresh the page.";
    } else if (
      err.name === "NotFoundError" ||
      err.name === "DevicesNotFoundError"
    ) {
      errorMessage +=
        "No camera or microphone found. Please connect a device and refresh.";
    } else if (
      err.name === "NotReadableError" ||
      err.name === "TrackStartError"
    ) {
      errorMessage +=
        "Camera/microphone is already in use by another application.";
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
    e.returnValue = "";
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
  if (state.role === "candidate") {
    // Poll for status
    const pollStatus = async () => {
      // Find interviewId? It needs to be passed in URL or we need to find it by Context?
      // Since we don't have interviewId easily in URL (only room), we might need an endpoint that takes Room + Candidate Email (or Cookie).
      // For MVP, we assume the backend endpoint `GET /api/interviews/session/{room}/queue` returns "Current" and we check if we match "Current".
      // But we don't know "who" we are (no auth cookie in this flow perhaps?).
      // Let's rely on localStorage 'username' matching 'candidateName' or similar? Weak.
      // Better: The User should have logged in? my_schedule.js uses localStorage.

      // Try getting email from URL first (testing convenience), then sessionStorage
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get("email") || sessionStorage.getItem("userEmail");

      if (!email) {
        console.warn("No user email found for status check");
        // Update overlay to show error if visible
        const statusText = document.getElementById("candidate-status-text");
        if (statusText) statusText.innerText = "Error: Email not found. Please log in or add &email=... to URL";
        return;
      }

      try {
        // New Endpoint to check "My Status" in this room
        // We don't have it. We can use the Queue endpoint and filter client side.
        const res = await fetch(`/api/interviews/session/${state.roomId}/queue`);
        const data = await res.json();

        const myInterview = data.timeline.find(i => i.candidate.email === email);

        const overlay = document.getElementById("candidate-overlay");

        if (myInterview) {
          if (myInterview.status === "IN_PROGRESS") {
            if (overlay) overlay.style.display = "none";
            // Init socket if not already?
            if (!state.socket) initSocket();
          } else if (myInterview.status === "COMPLETED") {
            if (!state.isLeaving) {
              if (state.socket) {
                alert("The interview has ended.");
                exitCall();
              } else {
                alert("The interview has ended.");
                window.location.href = "/lobby.html";
              }
            }
          } else {
            if (overlay) {
              overlay.style.display = "flex";
              document.getElementById("candidate-status-text").innerText =
                "Scheduled for: " + myInterview.scheduledTime;
            }
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };

    // Start polling
    setInterval(pollStatus, 5000);
    pollStatus();
  } else {
    initSocket();
  }
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

  icon.className = willEnable ? "fa fa-microphone" : "fa fa-microphone-slash";

  console.log(`[Mic] ${willEnable ? "Unmuted" : "Muted"}`);
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

  icon.className = willEnable ? "fa-solid fa-video" : "fa-solid fa-video-slash";

  console.log(`[Camera] ${willEnable ? "Enabled" : "Disabled"}`);
});
