// call.js
import { state } from "./state.js";
import { createPeerConnection } from "./webrtc.js";
import { sendSignal } from "./socket.js";
import { setStatus, preview, tempDiv, hideWaitingOverlay, updateCallButtonState } from "./ui.js";

export async function startCall() {
  console.log("[Call] Starting/Joining call...");
  setStatus("Connecting to room...");

  // Reuse createPeerConnection which now handles Mediasoup device load & produce
  await createPeerConnection(sendSignal);

  setStatus("Connected");
  hideWaitingOverlay();
  updateCallButtonState(true);
}

export async function joinCall() {
  // Same logic for both roles in SFU
  return startCall();
}

export async function acceptCall() {
  // Not needed in SFU typically unless we implement a "ring" feature.
  // unlikely to be triggered as "offer" event is removed.
  console.warn("acceptCall called but not implemented for SFU");
}

export async function exitCall() {
  if (state.isLeaving) return;
  state.isLeaving = true;

  try {
    // Notify peer first
    sendSignal("leave");

    // Server handles recording stop
    localStorage.removeItem("hasRecording"); // No client recording to download

  } catch (err) {
    console.error("[Exit] Error during cleanup:", err);
  } finally {
    endCall();

    setTimeout(() => {
      window.location.href = "/lobby.html";
    }, 50);
  }
}

export function endCall() {
  // Refresh page is the easiest way to cleanup mediasoup client fully
  // But we can just close transports if we had access to them.
  // Since we reload page on exit, this is fine.

  state.isCaller = false;
  state.peerReady = false;
  state.pendingOffer = null;
  state.pendingCandidates.length = 0;

  setStatus("Call ended");
}