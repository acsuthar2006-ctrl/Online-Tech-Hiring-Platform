const socket = new WebSocket("wss://gushy-etha-bushily.ngrok-free.dev");

let localStream;
let remoteStream;
let pc;
let pendingOffer = null;
let isCaller = false;

const micBtn = document.getElementById("mic-btn");
const cameraBtn = document.getElementById("camera-btn");
const localVideo = document.getElementById("local-user");
const remoteVideo = document.getElementById("remote-user");
const tempDiv = document.createElement("div");

const uid = String(Math.floor(Math.random() * 10000));
console.log("Your ID:", uid);

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function init() {
  tempDiv.id = "temp-div";
  tempDiv.textContent = "Waiting for user…";
  document
    .getElementById("remote-user-preview")
    .insertAdjacentElement("afterbegin", tempDiv);

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

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = event => {
    event.streams[0].getTracks().forEach(track => {
      if (!remoteStream.getTracks().includes(track)) {
        remoteStream.addTrack(track);
      }
    });
    remoteVideo.style.display = "inline-block";
  };

  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.send(JSON.stringify({
        type: "candidate",
        from: uid,
        candidate: event.candidate
      }));
    }
  };

  pc.onconnectionstatechange = () => {
    tempDiv.remove();
    setStatus(`Connection: ${pc.connectionState}`);
  };
}

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: "join",
    from: uid
  }));
};

socket.onmessage = async message => {
  const data = JSON.parse(message.data);
  if (data.from === uid) return;

  if (data.type === "offer") {
    pendingOffer = data.offer;

    const accept = confirm("Do you want to join the call?");
    if (!accept) {
      setStatus("Call rejected");
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

  if (data.type === "ready" && isCaller) {
    if (!pc) {
      await createPeerConnection();
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.send(JSON.stringify({
      type: "offer",
      from: uid,
      offer
    }));

    setStatus("Calling…");
  }
};

async function acceptCall() {
  setStatus("Joining call…");

  if (tempDiv.isConnected) tempDiv.remove();
  if (!pc) {
    await createPeerConnection();
  }

  await pc.setRemoteDescription(pendingOffer);
  pendingOffer = null;

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.send(JSON.stringify({
    type: "answer",
    from: uid,
    answer
  }));

  setStatus("Call connected");
}

function startCall() {
  isCaller = true;
  setStatus("Waiting for user to join…");
}

async function joinCall() {
  if (tempDiv.isConnected) {
    tempDiv.remove();
  }
  if (!pc) {
    await createPeerConnection();
  }

  socket.send(JSON.stringify({
    type: "ready",
    from: uid
  }));

  setStatus("Joined — waiting for call");
}

function setStatus(text) {
  const status = document.getElementById("status-text");
  if (status) {
    status.textContent = text;
  }
}

micBtn.addEventListener("click", () => {
  const muted = micBtn.classList.toggle("off");
  muted ? muteMicrophone(localStream) : unmuteMicrophone(localStream);
});

cameraBtn.addEventListener("click", () => {
  const off = cameraBtn.classList.toggle("off");
  off ? turnOffCamera(localStream) : turnOnCamera(localStream);
});

function muteMicrophone(stream) {
  micBtn.querySelector("i").className = "fa-solid fa-microphone-slash";
  stream.getAudioTracks().forEach(t => t.enabled = false);
}

function unmuteMicrophone(stream) {
  micBtn.querySelector("i").className = "fa-solid fa-microphone";
  stream.getAudioTracks().forEach(t => t.enabled = true);
}

function turnOffCamera(stream) {
  cameraBtn.querySelector("i").className = "fa-solid fa-video-slash";
  stream.getVideoTracks().forEach(t => t.enabled = false);
}

function turnOnCamera(stream) {
  cameraBtn.querySelector("i").className = "fa-solid fa-video";
  stream.getVideoTracks().forEach(t => t.enabled = true);
}