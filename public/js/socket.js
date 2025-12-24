// socket.js
import { state } from "./state.js";
import { setStatus } from "./ui.js";
import { acceptCall, endCall, startCall } from "./call.js";

export function initSocket() {
  state.socket = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
  );

  state.socket.onopen = () => {
    sendSignal("join");
  };

  state.socket.onmessage = async evt => {
    const data = JSON.parse(evt.data);
    if (data.from === state.uid) return;

    if (data.type === "room-full") {
      alert("Room is full");
      window.location.href = "/lobby.html";
    }

    if (data.type === "ready") {
      state.peerReady = true;
      startCall();
    }

    if (data.type === "offer" && !state.pendingOffer) {
      state.pendingOffer = data.offer;

      if (!confirm("Do you want to join the call?")) {
        state.pendingOffer = null;
        return;
      }

      await acceptCall();
    }

    if (data.type === "answer") {
      await state.pc.setRemoteDescription(data.answer);

      for (const c of state.pendingCandidates) {
        await state.pc.addIceCandidate(c);
      }
      state.pendingCandidates.length = 0;

      setStatus("Call connected");
    }

    if (data.type === "candidate") {
      if (state.pc?.remoteDescription) {
        await state.pc.addIceCandidate(data.candidate);
      } else {
        state.pendingCandidates.push(data.candidate);
      }
    }

    if (data.type === "leave") {
      endCall();
      setStatus("Peer left");
    }
  };
}

export function sendSignal(type, payload = {}) {
  state.socket.send(JSON.stringify({
    type,
    from: state.uid,
    channel: state.roomId,
    ...payload
  }));
}