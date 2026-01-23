
// Queue Manager
window.toggleQueueModal = function () {
  const modal = document.getElementById('queue-modal');
  if (modal.style.display === 'none') {
    modal.style.display = 'block';
    fetchQueue();
  } else {
    modal.style.display = 'none';
  }
}

async function fetchQueue() {
  const list = document.getElementById('queue-modal-list');
  list.innerHTML = '<p>Loading...</p>';

  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');

  try {
    const res = await fetch(`/api/interviews/session/${room}/queue`);

    // Logic to force Auth Prompt if 401
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
          if (!data.current || true) {
            actionBtn = `<button onclick="callCandidate(${item.id})" style="padding: 5px 10px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Call In</button>`;
          }
        } else if (item.status === 'IN_PROGRESS') {
          statusColor = 'green';
          actionBtn = `<button onclick="completeCandidate(${item.id})" style="padding: 5px 10px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Complete</button>`;
        } else if (item.status === 'COMPLETED') {
          statusColor = 'blue';
        }

        html += `
                <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${item.candidate.fullName}</strong><br/>
                        <span style="font-size: 0.8rem; color: ${statusColor}">${item.status} - ${item.scheduledTime}</span>
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
    await fetch(`/api/interviews/${id}/start`, { method: 'POST' });
    fetchQueue(); // Refresh
  } catch (e) {
    alert("Error starting interview");
  }
}

window.completeCandidate = async function (id) {
  if (!confirm("Finish this interview? Next candidate (if any) will be set to IN_PROGRESS.")) return;

  try {
    await fetch(`/api/interviews/${id}/complete`, { method: 'POST' });
    fetchQueue();
  } catch (e) {
    alert("Error completing interview");
  }
}
