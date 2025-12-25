// call.js
import { state } from "./state.js";
import { createPeerConnection } from "./webrtc.js";
import { sendSignal } from "./socket.js";
import { setStatus, preview, tempDiv } from "./ui.js";
import {
  startScreenRecording,
  stopScreenRecording,
  uploadRecording
} from "./screenRecorder.js";

export async function startCall() {
  state.isCaller = true;
  setStatus("Waiting for user to join…");

  await tryStartOffer();
}

export async function joinCall() {
  tempDiv.remove();
  await createPeerConnection(sendSignal);
  try {
    await startScreenRecording();
  } catch (err) {
    console.warn("Screen recording not started:", err);
  }
  sendSignal("ready");
  setStatus("Joined — waiting for call");
}

async function tryStartOffer() {
  if (!state.isCaller || !state.peerReady) return;

  await createPeerConnection(sendSignal);

  const offer = await state.pc.createOffer();
  await state.pc.setLocalDescription(offer);

  sendSignal("offer", { offer });
  setStatus("Calling…");
}

export async function acceptCall() {
  tempDiv.remove();
  await createPeerConnection(sendSignal);

  await state.pc.setRemoteDescription(state.pendingOffer);
  state.pendingOffer = null;

  for (const c of state.pendingCandidates) {
    await state.pc.addIceCandidate(c);
  }
  state.pendingCandidates.length = 0;

  const answer = await state.pc.createAnswer();
  await state.pc.setLocalDescription(answer);

  sendSignal("answer", { answer });
  setStatus("Call connected");
}

export async function exitCall() {
  if (state.isLeaving) return;
  state.isLeaving = true;

  sendSignal("leave");

  stopScreenRecording();
  await uploadRecording(state.roomId);
  localStorage.setItem("hasRecording", "true");

  endCall();
  window.location.href = "/lobby.html";
}

export function endCall() {
  state.pc?.close();
  state.pc = null;

  state.remoteStream = null;
  state.isCaller = false;
  state.peerReady = false;
  state.pendingOffer = null;
  state.pendingCandidates.length = 0;

  if (!tempDiv.isConnected) preview.prepend(tempDiv);

  setStatus("Call ended");
}