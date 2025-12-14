const socket = new WebSocket("wss://gushy-etha-bushily.ngrok-free.dev");

let localStream;
let remoteStream;
let pc;

const micBtn = document.getElementById('mic-btn');
const cameraBtn = document.getElementById("camera-btn");
const localVideo = document.getElementById("local-user");
const remoteVideo = document.getElementById("remote-user");
const tempDiv = document.createElement('div');

let uid = String(Math.floor(Math.random() * 10000));
console.log("Your ID : ", uid);

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ]
};

/* ---------------- START ---------------- */
async function init() {
  tempDiv.id = 'temp-div';
  tempDiv.textContent = "User is joining!!";
  document.getElementById('remote-user-preview').insertAdjacentElement("afterbegin" , tempDiv);


  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  turnOffCamera(localStream);
  muteMicrophone(localStream);

  micBtn.classList.add("active");
  cameraBtn.classList.add("active");

  localVideo.srcObject = localStream;

}

init();

/* ---------------- PEER CONNECTION ---------------- */
let createPeerConnection = async () => {

  pc = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  if(!localStream) {
      localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
  }

  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });


  pc.ontrack = evt => {
    evt.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
    remoteVideo.style.display = 'inline-block';
  };

  pc.onicecandidate = evt => {
    if (evt.candidate) {
      socket.send(JSON.stringify({
        type: "candidate", 
        candidate: evt.candidate
      }));
    }
  };

  pc.onconnectionstatechange = () => {
    console.log("Connection state:", pc.connectionState);

    if (pc.connectionState === "connected") {
      setStatus("Connected 🎉");
    }

    if (pc.connectionState === "disconnected") {
      setStatus("Disconnected");
    }

    if (pc.connectionState === "failed") {
      setStatus("Connection failed");
    }
  };
}

/* ---------------- SIGNALING ---------------- */
socket.onopen = () => {
  console.log("WebSocket connected to signaling server");
  socket.send(JSON.stringify({
    type: "join",
    from: uid
  }));

};

socket.onmessage = async message => {

  const statusText = document.getElementById('status-text');

  const receivedData = JSON.parse(message.data);
  if (receivedData.from === uid) 
    return;
  
  // console.log("Signaling message received:", receivedData.type);

  if (receivedData.type === "offer") {
    setStatus("Incoming call — sending answer");

    if (!pc) {
      createPeerConnection()
    };

    await pc.setRemoteDescription(receivedData.offer);
    console.log("Remote description set (offer)");

    const answer = await pc.createAnswer();

    await pc.setLocalDescription(answer);
    console.log("Sending ANSWER");

    statusText.textContent = 'Sending ANSWER';

    socket.send(JSON.stringify({
      type: "answer",
      from: uid,
      answer
    }));
  }

  if (receivedData.type === "answer") {
    await pc.setRemoteDescription(receivedData.answer);
    setStatus("Call connected");
  }

  if (receivedData.type === "candidate") {
    console.log("ICE candidate received");
    await pc.addIceCandidate(receivedData.candidate);
  }
};

/* ---------------- START CALL ---------------- */
async function startCall() {
  tempDiv.remove();
  console.log("📞 Start Call clicked");
  setStatus("Calling… waiting for answer");

  if (!pc){
    createPeerConnection();
  }
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log("Sending OFFER");
  socket.send(JSON.stringify({
    type: "offer",
    offer
  }));
}

/* ---------------- JOIN CALL ---------------- */
async function joinCall() {
  console.log("Join Call clicked");
  tempDiv.remove();
  // Only prepare peer connection and media
  // DO NOT create or send an offer
  if (!pc){
    createPeerConnection();
  }
  setStatus("Calling… waiting for answer");
  console.log("Waiting for OFFER from caller...");

}
function setStatus(text) {
  const status = document.getElementById("status-text");
  if (status) {
    status.textContent = text;
  }  
}

/* ---------------- MIC BTN ---------------- */


micBtn.addEventListener("click", () => {
  const isMuted = micBtn.classList.toggle("active");

  if (isMuted) {
    muteMicrophone(localStream);
    micBtn.querySelector("i").className = "fa-solid fa-microphone-slash";
  } else {
    unmuteMicrophone(localStream);
    micBtn.querySelector("i").className = "fa-solid fa-microphone";
  }
});


function unmuteMicrophone(stream) {
    if (stream) {
        stream.getAudioTracks().forEach(track => {
            track.enabled = true;
        });
        console.log('Microphone muted');
    }
}

function muteMicrophone(stream) {
    if (stream) {
        stream.getAudioTracks().forEach(track => {
            track.enabled = false;
        });
        console.log('Microphone muted');
    }
}

/* ---------------- Video BTN ---------------- */


cameraBtn.addEventListener("click", () => {
  const isOff = cameraBtn.classList.toggle("active");

  if (isOff) {
    turnOffCamera(localStream);
    cameraBtn.querySelector("i").className = "fa-solid fa-video-slash";
  } else {
    turnOnCamera(localStream);
    cameraBtn.querySelector("i").className = "fa-solid fa-video";
  }
});


function turnOffCamera(stream) {
  if (!stream) return;

  stream.getVideoTracks().forEach(track => {
    track.enabled = false;
  });
}

function turnOnCamera(stream) {
  if (!stream) return;

  stream.getVideoTracks().forEach(track => {
    track.enabled = true;
  });
}

