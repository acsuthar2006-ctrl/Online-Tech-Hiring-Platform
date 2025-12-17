const socket = new WebSocket("wss://gushy-etha-bushily.ngrok-free.dev");

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

if (!roomId) {
  alert("No room ID found. Go back to lobby.");
  window.location.href = "/lobby.html";
}

let localStream;
let remoteStream;
let pc;
let pendingOffer = null;
let isCaller = false;

const uid = Math.floor(Math.random() * 10000);

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const micBtn = document.getElementById("mic-btn");
const cameraBtn = document.getElementById("camera-btn");
const localVideo = document.getElementById("local-user");
const remoteVideo = document.getElementById("remote-user");
const preview = document.getElementById("remote-user-preview");

const tempDiv = document.createElement("div");
tempDiv.id = "temp-div";
tempDiv.textContent = "Waiting for user…";

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

async function createPeerConnection() {
  pc = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;
  remoteVideo.classList.add("active");

  localStream.getTracks().forEach(track =>
    pc.addTrack(track, localStream)
  );

  pc.ontrack = evt => {
    evt.streams[0].getTracks().forEach(track => {
      if (!remoteStream.getTracks().includes(track)) {
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
    if (
      pc.iceConnectionState === "disconnected" ||
      pc.iceConnectionState === "failed"
    ) {
      endCall();
    }
  };
}

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

  if (data.type === "ready" && isCaller) {
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

  if (data.type === "offer") {
    pendingOffer = data.offer;

    if (!confirm("Do you want to join the call?")) {
      pendingOffer = null;
      return;
    }

    await acceptCall();
  }

  if (data.type === "answer") {
    await pc.setRemoteDescription(data.answer);
    setStatus("Call connected");
  }

  if (data.type === "candidate") {
    await pc.addIceCandidate(data.candidate);
  }
};

async function acceptCall() {
  tempDiv.remove();
  if (!pc) await createPeerConnection();

  await pc.setRemoteDescription(pendingOffer);
  pendingOffer = null;

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

function endCall() {
  pc?.close();
  pc = null;

  remoteStream = null;
  remoteVideo.srcObject = null;
  remoteVideo.classList.remove("active");

  isCaller = false;
  pendingOffer = null;

  if (!tempDiv.isConnected) preview.prepend(tempDiv);

  setStatus("Call ended");
}

window.addEventListener("pagehide", () => pc?.close());

function exitCall() {
  endCall();
}

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
  micBtn.querySelector("i").className = "fa-solid fa-microphone-slash";
  stream.getAudioTracks().forEach(t => (t.enabled = false));
}

function unmuteMicrophone(stream) {
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
