const socket = new WebSocket(
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
);

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

if (!roomId) {
  alert("No room ID found. Go back to lobby.");
  window.location.href = "/lobby.html";
}

/* ================= STATE ================= */

let localStream;
let remoteStream;
let pc = null;

let pendingOffer = null;
let isCaller = false;
let peerReady = false;
let isLeaving = false;

const pendingCandidates = [];
const uid = crypto.randomUUID();

/* ================= ICE ================= */

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

/* ================= UI ================= */

const micBtn = document.getElementById("mic-btn");
const cameraBtn = document.getElementById("camera-btn");
const localVideo = document.getElementById("local-user");
const remoteVideo = document.getElementById("remote-user");
const preview = document.getElementById("remote-user-preview");

const tempDiv = document.createElement("div");
tempDiv.id = "temp-div";
tempDiv.textContent = "Waiting for user…";

/* ================= INIT ================= */

async function init() {
  preview.prepend(tempDiv);

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  turnOffCamera(localStream);
  muteMicrophone(localStream);

  micBtn.classList.add("off");
  cameraBtn.classList.add("off");

  localVideo.srcObject = localStream;
}

init();

/* ================= PEER CONNECTION ================= */

async function createPeerConnection() {
  if (pc) return;

  pc = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;
  remoteVideo.classList.add("active");

  localStream.getTracks().forEach(track =>
    pc.addTrack(track, localStream)
  );

  pc.ontrack = evt => {
    evt.streams[0].getTracks().forEach(track => {
      if (!remoteStream.getTracks().some(t => t.id === track.id)) {
        remoteStream.addTrack(track);
      }
    });
    tempDiv.remove();
  };

  pc.onicecandidate = evt => {
    if (evt.candidate) {
      socket.send(JSON.stringify({
        type: "candidate",
        from: uid,
        channel: roomId,
        candidate: evt.candidate
      }));
    }
  };

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === "failed") {
      exitCall(); // notify peer
    }
  };
}

/* ================= SIGNALING ================= */

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: "join",
    from: uid,
    channel: roomId
  }));
};

socket.onmessage = async evt => {
  const data = JSON.parse(evt.data);
  if (data.from === uid) return;

  if (data.type === "room-full") {
    alert("Room is full");
    window.location.href = "/lobby.html";
  }

  if (data.type === "ready") {
    peerReady = true;
    startOffer();
  }

  if (data.type === "offer" && !pendingOffer) {
    pendingOffer = data.offer;

    if (!confirm("Do you want to join the call?")) {
      pendingOffer = null;
      return;
    }

    await acceptCall();
  }

  if (data.type === "answer") {
    await pc.setRemoteDescription(data.answer);

    for (const c of pendingCandidates) {
      await pc.addIceCandidate(c);
    }
    pendingCandidates.length = 0;

    setStatus("Call connected");
  }

  if (data.type === "candidate") {
    if (pc?.remoteDescription) {
      await pc.addIceCandidate(data.candidate);
    } else {
      pendingCandidates.push(data.candidate);
    }
  }

  if (data.type === "leave") {
    endCall();
    setStatus("Peer left");
  }
};

/* ================= CALL FLOW ================= */

async function startOffer() {
  if (!isCaller || !peerReady) return;

  if (!pc) await createPeerConnection();

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.send(JSON.stringify({
    type: "offer",
    from: uid,
    channel: roomId,
    offer
  }));

  setStatus("Calling…");
}

async function acceptCall() {
  tempDiv.remove();
  if (!pc) await createPeerConnection();

  await pc.setRemoteDescription(pendingOffer);
  pendingOffer = null;

  for (const c of pendingCandidates) {
    await pc.addIceCandidate(c);
  }
  pendingCandidates.length = 0;

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.send(JSON.stringify({
    type: "answer",
    from: uid,
    channel: roomId,
    answer
  }));

  setStatus("Call connected");
}

function startCall() {
  isCaller = true;
  setStatus("Waiting for user to join…");
  startOffer();
}

async function joinCall() {
  tempDiv.remove();
  if (!pc) await createPeerConnection();

  socket.send(JSON.stringify({
    type: "ready",
    from: uid,
    channel: roomId
  }));

  setStatus("Joined — waiting for call");
}

/* ================= CLEANUP ================= */

function exitCall() {
  if (isLeaving) return;
  isLeaving = true;

  socket.send(JSON.stringify({
    type: "leave",
    from: uid,
    channel: roomId
  }));

  endCall();
  window.location.href = "/lobby.html";
}

function endCall() {
  pc?.close();
  pc = null;

  isLeaving = false;
  remoteStream = null;
  remoteVideo.srcObject = null;
  remoteVideo.classList.remove("active");

  isCaller = false;
  peerReady = false;
  pendingOffer = null;
  pendingCandidates.length = 0;

  if (!tempDiv.isConnected) preview.prepend(tempDiv);

  setStatus("Call ended");
}

/* ================= LIFECYCLE ================= */

window.addEventListener("beforeunload", () => {
  if (!isLeaving && pc) {
    isLeaving = true;
    socket.send(JSON.stringify({
      type: "leave",
      from: uid,
      channel: roomId
    }));
  }
});

socket.onclose = () => {
  setStatus("Disconnected from server");
};

/* ================= UI HELPERS ================= */

function setStatus(text) {
  const ele = document.getElementById("status-text");
  if (ele) ele.textContent = text;
}

micBtn.addEventListener("click", () => {
  micBtn.classList.toggle("off");
  micBtn.classList.contains("off")
    ? muteMicrophone(localStream)
    : unmuteMicrophone(localStream);
});

cameraBtn.addEventListener("click", () => {
  cameraBtn.classList.toggle("off");
  cameraBtn.classList.contains("off")
    ? turnOffCamera(localStream)
    : turnOnCamera(localStream);
});

function muteMicrophone(stream) {
   if (!stream) return; 
  micBtn.querySelector("i").className = "fa-solid fa-microphone-slash";
  stream.getAudioTracks().forEach(t => (t.enabled = false));
}

function unmuteMicrophone(stream) {
   if (!stream) return;
  micBtn.querySelector("i").className = "fa-solid fa-microphone";
  stream.getAudioTracks().forEach(t => (t.enabled = true));
}

function turnOffCamera(stream) {
  cameraBtn.querySelector("i").className = "fa-solid fa-video-slash";
  stream.getVideoTracks().forEach(t => (t.enabled = false));
}

function turnOnCamera(stream) {
  cameraBtn.querySelector("i").className = "fa-solid fa-video";
  stream.getVideoTracks().forEach(t => (t.enabled = true));
}