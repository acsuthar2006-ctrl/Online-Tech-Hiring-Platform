// ui.js
export const micBtn = document.getElementById("mic-btn");
export const cameraBtn = document.getElementById("camera-btn");
export const localVideo = document.getElementById("local-user");
export const remoteVideo = document.getElementById("remote-user");
export const preview = document.getElementById("remote-user-preview");
export const startCallBtn = document.getElementById("start-call-btn");
export const joinCallBtn = document.getElementById("join-call-btn");
export const exitCallBtn = document.getElementById("exit-call-btn");

export function updateCallButtonState(isConnected) {
  console.log("[UI] Updating button state, isConnected:", isConnected);

  if (startCallBtn) startCallBtn.style.display = isConnected ? 'none' : 'flex';
  if (joinCallBtn) joinCallBtn.style.display = isConnected ? 'none' : 'flex';
  if (exitCallBtn) exitCallBtn.style.display = isConnected ? 'flex' : 'none';
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
    tempDiv.style.display = 'none';
    tempDiv.style.opacity = '0';
    tempDiv.style.pointerEvents = 'none';
  }
}

export function showWaitingOverlay() {
  console.log("[UI] Showing waiting overlay");

  if (tempDiv && preview) {
    tempDiv.style.display = '';
    tempDiv.style.opacity = '1';
    tempDiv.style.pointerEvents = 'auto';

    if (!tempDiv.isConnected) {
      preview.prepend(tempDiv);
    }
  }
}

export function resetRemoteVideoUI() {
  console.log("[UI] Resetting remote video UI");
  if (remoteVideo) {
    remoteVideo.srcObject = null;
    remoteVideo.classList.remove('active');
  }
  showWaitingOverlay();
}

export function setStatus(text) {
  const ele = document.getElementById("status-text");
  if (ele) {
    ele.textContent = text;
    console.log(`[Status] ${text}`);
  }
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function showLoading(show = true) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}