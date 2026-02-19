// ui.js
export const micBtn = document.getElementById("mic-btn");
export const cameraBtn = document.getElementById("camera-btn");
export const localVideo = document.getElementById("local-user");
export const remoteVideo = document.getElementById("remote-user");
export const preview = document.getElementById("remote-user-preview");
export const remoteScreenVideo = document.getElementById("remote-screen-video");
export const screenCard = document.getElementById("screen-card");
export const screenShareBtn = document.getElementById("screen-share-btn");
export const joinCallBtn = document.getElementById("join-call-btn");
export const exitCallBtn = document.getElementById("exit-call-btn");

export function updateCallButtonState(isConnected) {
  console.log("[UI] Updating button state, isConnected:", isConnected);

  // if (startCallBtn) startCallBtn.style.display = isConnected ? 'none' : 'flex';
  // Join button is now inside an overlay
  const joinOverlay = document.getElementById("start-call-overlay");
  if (joinOverlay) {
    joinOverlay.style.display = isConnected ? "none" : "flex";
  } else if (joinCallBtn) {
    // Fallback if overlay not found
    joinCallBtn.style.display = isConnected ? "none" : "flex";
  }

  if (exitCallBtn) exitCallBtn.style.display = isConnected ? "flex" : "none";

  // If disconnected, ensure screen share mode is reset
  if (!isConnected) {
    setScreenShareMode(false);
  }
}

// Get the existing tempDiv from HTML or create it
export const tempDiv = document.getElementById("temp-div") || createTempDiv();

function createTempDiv() {
  const div = document.createElement("div");
  div.id = "temp-div";

  const waitingContent = document.createElement("div");
  waitingContent.className = "waiting-content";
  waitingContent.innerHTML = `
    <i class="fas fa-hourglass-half fa-spin"></i>
    <p>Waiting for connection...</p>
  `;
  div.appendChild(waitingContent);

  return div;
}

export function hideWaitingOverlay() {
  console.log("[UI] Hiding waiting overlay");

  if (tempDiv) {
    // Method 1: Remove from DOM
    try {
      if (tempDiv.parentNode) {
        tempDiv.remove();
        console.log("[UI] Waiting overlay removed");
      }
    } catch (e) {
      console.warn("[UI] Could not remove tempDiv:", e);
    }

    // Method 2: Hide with display none (backup)
    tempDiv.style.display = "none";
    tempDiv.style.opacity = "0";
    tempDiv.style.pointerEvents = "none";
  }
}

export function showWaitingOverlay() {
  console.log("[UI] Showing waiting overlay");

  if (tempDiv && preview) {
    tempDiv.style.display = "";
    tempDiv.style.opacity = "1";
    tempDiv.style.pointerEvents = "auto";

    if (!tempDiv.isConnected) {
      preview.prepend(tempDiv);
    }
  }
}

export function resetRemoteVideoUI() {
  console.log("[UI] Resetting remote video UI");
  if (remoteVideo) {
    remoteVideo.srcObject = null;
    remoteVideo.classList.remove("active");
  }
  if (remoteScreenVideo) {
    remoteScreenVideo.srcObject = null;
    screenCard.style.display = "none"; // Hide card
  }
  showWaitingOverlay();
  setScreenShareMode(false);
}

export function setScreenShareMode(active) {
  if (screenCard) {
    // Explicitly toggle display to ensure it overrides any inline styles
    screenCard.style.display = active ? "flex" : "none";
  }

  // Toggle wrapper class for layout changes
  const wrapper = document.getElementById("video-wrapper");
  if (active) {
    wrapper.classList.add("screen-share-active");
  } else {
    wrapper.classList.remove("screen-share-active");
  }

  // Mutual Exclusion UI: Disable local screen share button if remote is sharing
  if (screenShareBtn) {
    screenShareBtn.disabled = active;
    if (active) {
        screenShareBtn.classList.add("disabled");
        screenShareBtn.title = "Screen sharing unavailable (Remote user is sharing)";
        // Optional: Change icon or style
    } else {
        screenShareBtn.classList.remove("disabled");
        screenShareBtn.title = "Share Screen";
    }
  }

  console.log(`[UI] Screen Share Mode: ${active}`);
}

export function setStatus(text) {
  const ele = document.getElementById("status-text");
  if (ele) {
    ele.textContent = text;
    console.log(`[Status] ${text} `);
  }
}

import { showToast, showLoading } from "../common/ui-utils.js";

// Re-export for compatibility with existing imports if needed,
// or let this file just focus on Call UI specific things.
// For now, I'll export them to reduce refactoring noise in other files that might import them from here.
export { showToast, showLoading };
