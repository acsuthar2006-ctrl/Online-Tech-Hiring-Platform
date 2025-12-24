const BASE_URL = window.location.origin;

const joinForm = document.getElementById("joinForm");
const roomInput = document.getElementById("roomInput");
const createBtn = document.getElementById("createRoomBtn");
const downloadBtn = document.getElementById("downloadRecordingBtn");

// show button only if recording exists
if (downloadBtn && localStorage.getItem("hasRecording") === "true") {
  downloadBtn.style.display = "block";
}

joinForm.addEventListener("submit", async evt => {
  evt.preventDefault();

  const room = roomInput.value.trim();
  if (!room) {
    alert("Plz!! Enter the room id");
    return;
  }

  const exists = await roomExists(room);
  if (!exists) {
    alert("Room does not exist!");
    return;
  }

  window.location.href = `${BASE_URL}/?room=${room}`;
});

createBtn.addEventListener("click", async () => {
  const room = roomInput.value.trim();
  if (!room) {
    alert("Plz!! Enter the room id");
    return;
  }

  const exists = await roomExists(room);
  if (exists) {
    alert("Room already exist!");
    return;
  }

  window.location.href = `${BASE_URL}/?room=${room}`;
});

// ✅ SERVER DOWNLOAD
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const roomId = roomInput.value.trim();

    if (!roomId) {
      alert("Enter room id to download recording");
      return;
    }

    window.location.href = `/download-recording/${roomId}`;
    localStorage.removeItem("hasRecording");
    downloadBtn.style.display = "none";
  });
}

async function roomExists(room) {
  try {
    const res = await fetch(`/check-room?room=${encodeURIComponent(room)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.exists;
  } catch (err) {
    alert("Unable to connect to server");
    return false;
  }
}