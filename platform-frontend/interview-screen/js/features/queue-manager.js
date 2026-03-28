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
export function toggleQueueModal() {
  const modal = document.getElementById('queue-modal');
  if (modal.style.display === 'none') {
    modal.style.display = 'block';
    _fetchModalQueue();
  } else {
    modal.style.display = 'none';
  }
}
window.toggleQueueModal = toggleQueueModal;

// ─── Fetch & render the interviewer modal queue list ──────────────────────────
// Use local calendar date (not UTC) so late-night sessions don't disappear.
const _todayStr = () => new Date().toLocaleDateString('en-CA');

function _normalizeDate(item) {
  const raw = item?.scheduledDate || item?.date || null;
  if (!raw) return null;
  // Handle ISO or YYYY-MM-DD
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  // Fallback: try plain string
  return String(raw).slice(0, 10);
}

function _filterTimeline(timeline) {
  if (!Array.isArray(timeline) || !timeline.length) return [];

  const today = _todayStr();

  // Anchor on the first active item (IN_PROGRESS > SCHEDULED) to lock context
  const anchor =
    timeline.find(t => t.status === 'IN_PROGRESS') ||
    timeline.find(t => t.status === 'SCHEDULED') ||
    timeline[0];

  const anchorCompany =
    anchor?.company?.id ||
    anchor?.position?.company?.id ||
    anchor?.position?.companyId ||
    anchor?.companyId ||
    null;
  const anchorPosition =
    anchor?.position?.id ||
    anchor?.positionId ||
    anchor?.position?.positionId ||
    null;
  const anchorInterviewer =
    anchor?.interviewer?.id ||
    anchor?.interviewer?.email ||
    null;

  return timeline.filter(item => {
    const itemDate = _normalizeDate(item);
    const matchesDate = itemDate === today; // daily reset

    const matchesCompany =
      !anchorCompany ||
      item.company?.id === anchorCompany ||
      item.position?.company?.id === anchorCompany ||
      item.position?.companyId === anchorCompany ||
      item.companyId === anchorCompany;

    const matchesPosition =
      !anchorPosition ||
      item.position?.id === anchorPosition ||
      item.positionId === anchorPosition ||
      item.position?.positionId === anchorPosition;

    const matchesInterviewer =
      !anchorInterviewer ||
      item.interviewer?.id === anchorInterviewer ||
      item.interviewer?.email === anchorInterviewer;

    return matchesDate && matchesCompany && matchesPosition && matchesInterviewer;
  });
}

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
    const filteredTimeline = _filterTimeline(data.timeline || []);

    if (filteredTimeline.length > 0) {
      let html = '<ul style="list-style: none; padding: 0;">';
      filteredTimeline.forEach(item => {
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
          
          if (typeof window.updateCandidateLabel === 'function') {
            window.updateCandidateLabel(item.candidate.fullName);
          }
        } else if (item.status === 'COMPLETED') {
          statusColor = 'blue';
        }

        let timeDisplayStr = '';
        if (item.status === 'SCHEDULED') {
          timeDisplayStr = item.scheduledTime || '';
          if (item.expectedStartTime) {
            const ed = new Date(item.expectedStartTime);
            if (!isNaN(ed.getTime())) {
              timeDisplayStr = ed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Expected)';
            }
          }
        } else if (item.status === 'COMPLETED' && item.actualEndTime) {
          const endDate = new Date(item.actualEndTime);
          if (!isNaN(endDate.getTime())) {
            timeDisplayStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        }

        const statusLine = timeDisplayStr
          ? `${item.status} - ${timeDisplayStr}`
          : `${item.status}`;

        html += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${item.candidate.fullName}</strong><br/>
                        <span style="font-size: 0.8rem; color: ${statusColor}">${statusLine}</span>
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

  // Attempt to stop recording
  if (window.getMediaSocket) {
    const socket = window.getMediaSocket();
    if (socket && socket.readyState === 1) { // OPEN
      try {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get('room');

        const queueData = await fetch(`/api/interviews/session/${roomParam}/queue`).then(r => r.json());
        const item = queueData.timeline.find(i => i.id === id);
        const candidateName = item && item.candidate
          ? item.candidate.fullName.replace(/[^a-zA-Z0-9]/g, '_')
          : 'Candidate';
        const recordingName = `${roomParam}-${candidateName}-${crypto.randomUUID()}`;

        socket.send(JSON.stringify({ type: 'stopRecording', recordingName }));

        // Server saves as recordingName.mp4 — store with .mp4 so downloads work
        recordingUrl = `${recordingName}.mp4`;
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
