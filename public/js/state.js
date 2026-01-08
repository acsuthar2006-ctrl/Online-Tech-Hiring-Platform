// state.js
export const state = {
  localStream: null,
  remoteStream: null,
  pc: null,

  pendingOffer: null,
  isCaller: false,
  peerReady: false,
  isLeaving: false,

  pendingCandidates: [],
  uid: crypto.randomUUID(),
  roomId: new URLSearchParams(window.location.search).get("room"),
  role: new URLSearchParams(window.location.search).get("role") || "candidate" // default to candidate only if missing
};