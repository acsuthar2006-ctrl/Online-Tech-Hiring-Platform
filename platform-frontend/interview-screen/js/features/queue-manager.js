
// Queue Manager — Interviewer Modal + Sidebar Refresh

// ─── Sidebar refresh helper ──────────────────────────────────────────────────
// Called after any queue-mutating action so the sidebar updates immediately
// instead of waiting for the next 5-second poll tick.
function _refreshSidebar() {
  if (typeof window.refreshQueue === 'function') {
    window.refreshQueue();
  }
}

// ─── Interviewer Modal Toggle ─────────────────────────────────────────────────
window.toggleQueueModal = function () {
  const modal = document.getElementById('queue-modal');
  if (modal.style.display === 'none') {
    modal.style.display = 'block';
    _fetchModalQueue();
  } else {
    modal.style.display = 'none';
  }
}

// ─── Fetch & render the interviewer modal queue list ──────────────────────────
async function _fetchModalQueue() {
  const list = document.getElementById('queue-modal-list');
  list.innerHTML = '<p>Loading...</p>';

  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');

  try {
    const res = await fetch(`/api/interviews/session/${room}/queue`);

    // Force auth prompt on 401
    if (res.status === 401) {
      list.innerHTML = `<p style="color:red">Authentication Required.</p>
                         <button onclick="window.location.reload()" style="padding: 10px; cursor: pointer;">Log In</button>`;
      return;
    }

    const data = await res.json();

    if (data.timeline && data.timeline.length > 0) {
      let html = '<ul style="list-style: none; padding: 0;">';
      data.timeline.forEach(item => {
        let actionBtn = '';
        let statusColor = '#666';

        if (item.status === 'SCHEDULED') {
          statusColor = 'orange';
          if (item.inLobby) {
            actionBtn = `<button onclick="callCandidate(${item.id})" style="padding: 5px 10px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Call In</button>`;
          } else {
            actionBtn = `<button onclick="remindCandidate(${item.id})" style="padding: 5px 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Remind</button>`;
          }
        } else if (item.status === 'IN_PROGRESS') {
          statusColor = 'green';
          actionBtn = `<button onclick="completeCandidate(${item.id})" style="padding: 5px 10px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Complete</button>`;
        } else if (item.status === 'COMPLETED') {
          statusColor = 'blue';
        }

        let timeDisplayStr = item.scheduledTime;
        if (item.status === 'SCHEDULED' && item.expectedStartTime) {
          const ed = new Date(item.expectedStartTime);
          if (!isNaN(ed.getTime())) {
            timeDisplayStr = ed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Expected)';
          }
        }

        html += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${item.candidate.fullName}</strong><br/>
                        <span style="font-size: 0.8rem; color: ${statusColor}">${item.status} - ${timeDisplayStr}</span>
                    </div>
                    <div>${actionBtn}</div>
                </li>
                `;
      });
      html += '</ul>';
      list.innerHTML = html;
    } else {
      list.innerHTML = '<p>No candidates scheduled.</p>';
    }
  } catch (e) {
    list.innerText = 'Error loading queue (Check Console)';
    console.error(e);
  }
}

window.callCandidate = async function (id) {
  if (!confirm("Pull this candidate into the session?")) return;

  try {
    const token = sessionStorage.getItem('jwt_token');
    await fetch(`/api/interviews/${id}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    _fetchModalQueue(); // Refresh interviewer modal
    _refreshSidebar();  // Immediately refresh sidebar for all viewers
  } catch (e) {
    alert("Error starting interview");
    console.error(e);
  }
}

window.completeCandidate = async function (id) {
  if (!confirm("Finish this interview?")) return;

  let recordingUrl = null;

  // Attempt to stop recording and get filename
  if (window.getMediaSocket) {
    const socket = window.getMediaSocket();
    if (socket && socket.readyState === 1) { // OPEN
      console.log("Stopping recording for candidate " + id);

      try {
        const filename = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 3000); // 3s timeout

          const activeListener = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'recordingSaved') {
              clearTimeout(timeout);
              socket.removeEventListener('message', activeListener); // clean up (tricky with wrapper, but generic logic)
              // Actually, we can't easily remove specific listeners if they are wrapped.
              // But we can just use a one-time handler logic if we had a proper event emitter.
              // Since we are using raw socket (or wrapper?), let's assume raw WebSocket for now based on `state.socket`.
              // `state.socket` is a WebSocket instance.
              resolve(msg.filename);
            }
          };
          socket.addEventListener('message', activeListener);
          socket.send(JSON.stringify({
            type: 'stopRecording',
            recordingName: `interview-${id}`
          }));
        });

        if (filename) recordingUrl = filename;

      } catch (e) {
        console.warn("Failed to stop recording cleanly:", e);
      }
    }
  }

  try {
    const token = sessionStorage.getItem('jwt_token');
    await fetch(`/api/interviews/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        feedback: "Allocated via Queue",
        score: 0,
        recordingUrl: recordingUrl // Send the filename!
      })
    });
    _fetchModalQueue(); // Refresh interviewer modal
    _refreshSidebar();  // Immediately refresh sidebar for all viewers
  } catch (e) {
    alert("Error completing interview");
    console.error(e);
  }
}

window.remindCandidate = async function (id) {
  if (!confirm("Send an email reminder to this candidate?")) return;

  try {
    const token = sessionStorage.getItem('jwt_token');
    await fetch(`/api/interviews/${id}/remind`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    alert("Reminder sent!");
  } catch (e) {
    alert("Error sending reminder");
    console.error(e);
  }
}
