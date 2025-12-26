// webrtc.js
import { state } from "./state.js";
import { remoteVideo, tempDiv } from "./ui.js";
import { attachIncomingAudio } from "./screenRecorder.js";

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export async function createPeerConnection(sendSignal) {
  if (state.pc) return;

  state.pc = new RTCPeerConnection(servers);

  state.remoteStream = new MediaStream();
  remoteVideo.srcObject = state.remoteStream;
  remoteVideo.classList.add("active");

  state.localStream.getTracks().forEach(track =>
    state.pc.addTrack(track, state.localStream)
  );

  state.pc.ontrack = evt => {
    evt.streams[0].getTracks().forEach(track => {
      if (!state.remoteStream.getTracks().some(t => t.id === track.id)) {
        state.remoteStream.addTrack(track);
        attachIncomingAudio(state.remoteStream);
      }
    });
    tempDiv.remove();
  };

  state.pc.onicecandidate = evt => {
    if (evt.candidate) {
      sendSignal("candidate", { candidate: evt.candidate });
    }
  };

  state.pc.oniceconnectionstatechange = () => {
    if (state.pc.iceConnectionState === "failed") {
      window.location.href = "/lobby.html";
    }
  };
}