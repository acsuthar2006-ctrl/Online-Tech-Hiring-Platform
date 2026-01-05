const BASE_URL = window.location.origin;

const joinForm = document.getElementById("joinForm");
const roomInput = document.getElementById("roomInput");
const createBtn = document.getElementById("createRoomBtn");
const downloadBtn = document.getElementById("downloadRecordingBtn");
const recordingSection = document.getElementById("recordingSection");

// Show recording section and button always
if (downloadBtn && recordingSection) {
  recordingSection.style.display = "block";
  downloadBtn.style.display = "block";
}

// Join existing room
joinForm.addEventListener("submit", async evt => {
  evt.preventDefault();

  showLoading(true);
  const room = roomInput.value.trim();

  if (!room) {
    showLoading(false);
    showToast("Please enter a room ID", "error");
    roomInput.focus();
    return;
  }

  // Validate room ID format (alphanumeric, hyphens, underscores)
  if (!/^[A-Za-z0-9-_]+$/.test(room)) {
    showLoading(false);
    showToast("Room ID can only contain letters, numbers, hyphens and underscores", "error");
    return;
  }

  try {
    const exists = await roomExists(room);

    if (!exists) {
      showLoading(false);
      showToast("Room does not exist! Create it first.", "error");
      return;
    }

    console.log(`[Lobby] Joining room: ${room}`);
    window.location.href = `${BASE_URL}/?room=${room}`;
  } catch (err) {
    showLoading(false);
    console.error("[Lobby] Error checking room:", err);
  }
});

// Create new room
createBtn.addEventListener("click", async () => {
  showLoading(true);
  const room = roomInput.value.trim();

  if (!room) {
    showLoading(false);
    showToast("Please enter a room ID to create", "error");
    roomInput.focus();
    return;
  }

  // Validate room ID format
  if (!/^[A-Za-z0-9-_]+$/.test(room)) {
    showLoading(false);
    showToast("Room ID can only contain letters, numbers, hyphens and underscores", "error");
    return;
  }

  try {
    const exists = await roomExists(room);

    if (exists) {
      showLoading(false);
      showToast("Room already exists! Join it or choose a different ID.", "error");
      return;
    }

    console.log(`[Lobby] Creating room: ${room}`);
    window.location.href = `${BASE_URL}/?room=${room}`;
  } catch (err) {
    showLoading(false);
    console.error("[Lobby] Error checking room:", err);
  }
});

// Download recording
if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    const roomId = roomInput.value.trim();

    if (!roomId) {
      showToast("Please enter the room ID to check for recordings", "error");
      roomInput.focus();
      return;
    }

    console.log(`[Lobby] Checking recordings for room: ${roomId}`);
    showLoading(true);

    try {
      const res = await fetch(`/api/recordings/${roomId}`);
      const data = await res.json();

      showLoading(false);

      if (data.recordings && data.recordings.length > 0) {
        // Create list with updated styling
        let listHtml = `
                <div class="recordings-list">
                    <h3>Available Recordings</h3>
                    <ul>
            `;

        data.recordings.forEach(rec => {
          listHtml += `
                    <li>
                        <span>${rec.date}</span>
                        <a href="${rec.url}" class="download-link-btn" download target="_blank">
                            <i class="fas fa-download"></i> Download MP4
                        </a>
                    </li>
                `;
        });
        listHtml += `</ul></div>`;

        // Remove existing list if any
        const existingList = document.querySelector('.recordings-list');
        if (existingList) existingList.remove();

        // Insert after button
        downloadBtn.insertAdjacentHTML('afterend', listHtml);

        showToast(`Found ${data.recordings.length} recordings!`, "success");
      } else {
        showToast("No recordings found for this room", "info");
        const existingList = document.querySelector('.recordings-list');
        if (existingList) existingList.remove();
      }

    } catch (err) {
      showLoading(false);
      console.error("Error fetching recordings:", err);
      showToast("Error checking recordings", "error");
    }
  });
}

// Check if room exists
async function roomExists(room) {
  try {
    const res = await fetch(`/check-room?room=${encodeURIComponent(room)}`);

    if (!res.ok) {
      console.error(`[Lobby] Server returned ${res.status}`);
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();
    console.log(`[Lobby] Room ${room} exists: ${data.exists}`);
    return data.exists;

  } catch (err) {
    console.error("[Lobby] Error checking room existence:", err);
    showToast("Unable to connect to server. Please try again.", "error");
    throw err;
  }
}

// Toast notification helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) {
    // Fallback to alert if toast container doesn't exist
    alert(message);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Add icon based on type
  const icon = {
    'error': '<i class="fas fa-exclamation-circle"></i>',
    'success': '<i class="fas fa-check-circle"></i>',
    'info': '<i class="fas fa-info-circle"></i>',
    'warning': '<i class="fas fa-exclamation-triangle"></i>'
  }[type] || '<i class="fas fa-info-circle"></i>';

  toast.innerHTML = `${icon} <span>${message}</span>`;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Loading spinner helper
function showLoading(show = true) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = show ? 'flex' : 'none';
  }
}

// Random room ID generator
function generateRandomRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Optional: Add random room ID button functionality
const randomBtn = document.getElementById("randomRoomBtn");
if (randomBtn) {
  randomBtn.addEventListener("click", () => {
    const randomId = generateRandomRoomId();
    roomInput.value = randomId;
    showToast(`Generated room ID: ${randomId}`, "success");
  });
}

// Handle enter key in room input
roomInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    joinForm.dispatchEvent(new Event("submit"));
  }
});

// Auto-focus room input on page load
window.addEventListener("load", () => {
  roomInput.focus();
  console.log("[Lobby] Ready");
});