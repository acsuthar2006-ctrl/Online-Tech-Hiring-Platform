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
  // Fallback for non-secure contexts (HTTP)
  uid:
    typeof crypto !== "undefined" && crypto.randomUUID && window.isSecureContext
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
  roomId: new URLSearchParams(window.location.search).get("room"),
  role: new URLSearchParams(window.location.search).get("role") || "candidate", // default to candidate only if missing
};
