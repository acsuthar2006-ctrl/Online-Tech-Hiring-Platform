import { api } from '../../common/api.js';

const companyId = sessionStorage.getItem('companyId');
let allInterviewers = [];
let currentStatusFilter = 'all';
let currentPostFilter = 'all'; // all | positionId

// ===== SET ADMIN NAME =====
function setAdminName() {
  const userInfo = api.getUserInfo();
  if (userInfo) {
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.textContent = userInfo.fullName || 'Admin';
  }
}

// ===== STATUS BADGE =====
function appStatusBadge(status) {
  if (status === 'APPROVED') return `<span class="badge" style="background:#dcfce7; color:#166534;">Hired</span>`;
  if (status === 'REJECTED') return `<span class="badge" style="background:#fee2e2; color:#991b1b;">Rejected</span>`;
  if (status === 'APPLIED') return `<span class="badge" style="background:#fef3c7; color:#92400e;">Pending</span>`;
  return '';
}

function availBadge(status) {
  const map = {
    AVAILABLE: { bg: '#dcfce7', color: '#166534', label: 'Active' },
    BUSY: { bg: '#fef3c7', color: '#92400e', label: 'Busy' },
    OFFLINE: { bg: '#fee2e2', color: '#991b1b', label: 'Offline' }
  };
  const s = map[status] || { bg: 'var(--blue-100)', color: 'var(--blue-800)', label: status || 'Unknown' };
  return `<span class="badge" style="background:${s.bg}; color:${s.color};">${s.label}</span>`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== RENDER CARDS =====
function renderInterviewers(interviewers) {
  const grid = document.querySelector('.interviewers-grid');
  if (!grid) return;

  const countEl = document.querySelector('.header-left .text-muted');
  if (countEl) countEl.textContent = `${interviewers.length} interviewers found`;

  if (interviewers.length === 0) {
    grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1; padding:32px; text-align:center;">No interviewers found.</p>`;
    return;
  }

  grid.innerHTML = interviewers.map(iv => {
    const initials = iv.fullName ? iv.fullName.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2) : '??';
    const expertiseTags = (iv.expertises || []).map(e => `<span class="tag">${e}</span>`).join('');
    const viewBtn = `<button class="btn-outline btn-sm btn-full" onclick="openInterviewerDetails(${iv.id})">View</button>`;
    const assignBtn = (iv.applicationStatus === 'APPROVED' && iv.positionId)
      ? `<button class="btn-primary btn-sm btn-full" onclick="openAssignCandidates(${iv.id}, ${iv.positionId}, ${JSON.stringify(iv.fullName || 'Interviewer').replace(/\"/g, '&quot;')}, ${JSON.stringify(iv.positionTitle || 'Position').replace(/\"/g, '&quot;')})">Assign Candidates</button>`
      : '';
    const actionBtns = iv.appliedToCompany
      ? (iv.applicationStatus === 'APPLIED'
        ? `<button class="btn-primary btn-sm btn-full" onclick="approveInterviewer(${iv.applicationId})">Approve</button>
             <button class="btn-outline btn-sm btn-full" style="color:#dc2626;border-color:#dc2626;" onclick="rejectInterviewer(${iv.applicationId})">Reject</button>`
        : iv.applicationStatus === 'APPROVED'
          ? `${assignBtn}<button class="btn-outline btn-sm btn-full" style="color:#dc2626;border-color:#dc2626;" onclick="rejectInterviewer(${iv.applicationId})">Remove</button>`
          : `<button class="btn-primary btn-sm btn-full" onclick="approveInterviewer(${iv.applicationId})">Re-approve</button>`)
      : `<button class="btn-outline btn-sm btn-full">Not Applied</button>`;

    const positionLine = iv.positionTitle
      ? `<div class="badge badge-blue" style="display:inline-block; margin:6px auto 12px; padding:6px 10px; font-weight:600;">${escapeHtml(iv.positionTitle)}</div>`
      : '';

    return `
      <div class="card interviewer-card">
        <div class="interviewer-header">
          <div class="avatar-large" style="background:linear-gradient(135deg,var(--blue-600),var(--blue-400)); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:28px;">
            ${initials}
          </div>
          <div class="interviewer-status">${availBadge(iv.availabilityStatus)}</div>
        </div>
        <h3 class="interviewer-name">${iv.fullName}</h3>
        <p class="text-muted" style="margin-bottom:4px; font-size:13px;">${iv.email}</p>
        <div style="margin-bottom:12px; text-align:center;">${iv.applicationStatus ? appStatusBadge(iv.applicationStatus) : ''}</div>
        <div style="text-align:center;">${positionLine}</div>
        <div class="expertise-tags">${expertiseTags || '<span style="font-size:13px;color:var(--gray-400);">No expertise listed</span>'}</div>
        <div class="stats-mini">
          <div class="stat">
            <p class="stat-value">${iv.completedInterviews != null ? iv.completedInterviews : (iv.totalInterviewsConducted || 0)}</p>
            <p class="stat-label">Completed</p>
          </div>
          <div class="stat">
            <p class="stat-value">${iv.upcomingInterviews != null ? iv.upcomingInterviews : (iv.upcomingScheduled || 0)}</p>
            <p class="stat-label">Upcoming</p>
          </div>
        </div>
        <div class="card-actions">${viewBtn}${actionBtns}</div>
      </div>
    `;
  }).join('');
}

function openAssignModal() {
  const modal = document.getElementById('assignCandidatesModal');
  if (!modal) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeAssignModal() {
  const modal = document.getElementById('assignCandidatesModal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

window.openAssignCandidates = async function (interviewerId, positionId, interviewerName, positionTitle) {
  const titleEl = document.getElementById('assignCandidatesTitle');
  const listEl = document.getElementById('assignCandidatesList');
  if (titleEl) titleEl.textContent = `Assign Candidates • ${positionTitle} • ${interviewerName}`;
  if (listEl) listEl.innerHTML = `<div class="modal-item">Loading...</div>`;
  openAssignModal();

  try {
    const candidates = await api.getPositionCandidates(positionId);
    const unassigned = (candidates || []).filter(c => !c.assignedInterviewerId && c.appliedDirectly);

    if (!unassigned || unassigned.length === 0) {
      if (listEl) listEl.innerHTML = `<div class="modal-item">No unassigned candidates for this position.</div>`;
      return;
    }

    if (listEl) {
      listEl.innerHTML = unassigned.map(c => `
        <div class="modal-item" data-app-id="${c.applicationId}">
          <div class="item-title">${c.fullName}</div>
          <div class="item-meta">${c.email} • ${c.status}</div>
          <div style="margin-top:10px; display:flex; justify-content:flex-end;">
            <button class="btn-primary btn-sm" onclick="assignCandidate(${positionId}, ${interviewerId}, ${c.applicationId})">Assign</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    if (listEl) listEl.innerHTML = `<div class="modal-item" style="color:#dc2626;">Failed to load candidates: ${e.message}</div>`;
  }
};

window.assignCandidate = async function (positionId, interviewerId, applicationId) {
  try {
    await api.assignCandidateToInterviewer(companyId, applicationId, interviewerId);
    // remove from list UI
    const row = document.querySelector(`#assignCandidatesList .modal-item[data-app-id="${applicationId}"]`);
    if (row) row.remove();
    const listEl = document.getElementById('assignCandidatesList');
    if (listEl) {
      const remaining = listEl.querySelectorAll('.modal-item[data-app-id]').length;
      if (remaining === 0) {
        listEl.innerHTML = `<div class="modal-item">All candidates for this position are assigned.</div>`;
      }
    }
  } catch (e) {
    alert('Failed to assign: ' + e.message);
  }
};

// ===== VIEW DETAILS =====
window.openInterviewerDetails = function (interviewerId) {
  const interviewer = allInterviewers.find(iv => iv.id === interviewerId);
  if (!interviewer) return;

  const modal = document.getElementById('interviewerDetailsModal');
  if (!modal) return;

  const titleEl = document.getElementById('interviewerDetailsTitle');
  const bioEl = document.getElementById('interviewerDetailsBio');
  const expertiseEl = document.getElementById('interviewerDetailsExpertise');
  const availabilityEl = document.getElementById('interviewerDetailsAvailability');
  const totalInterviewsEl = document.getElementById('interviewerDetailsTotalInterviews');
  const upcomingEl = document.getElementById('interviewerDetailsUpcoming');

  if (titleEl) titleEl.textContent = interviewer.fullName || 'Interviewer Details';
  if (bioEl) bioEl.textContent = interviewer.bio || 'No bio provided.';

  if (expertiseEl) {
    const tags = (interviewer.expertises || []).map(e => `<span class="modal-tag">${escapeHtml(e)}</span>`).join('');
    expertiseEl.innerHTML = tags || '<span class="text-muted" style="font-size:13px;">No expertise listed.</span>';
  }

  if (availabilityEl) availabilityEl.textContent = interviewer.availabilityStatus || 'N/A';
  if (totalInterviewsEl) totalInterviewsEl.textContent = String(interviewer.totalInterviewsConducted || 0);
  if (upcomingEl) upcomingEl.textContent = String(interviewer.upcomingScheduled || 0);

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
};

function closeInterviewerDetails() {
  const modal = document.getElementById('interviewerDetailsModal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

// ===== APPROVE / REJECT =====
window.approveInterviewer = async function (applicationId) {
  try {
    await api.updateInterviewerApplicationStatus(applicationId, 'APPROVED');
    await loadInterviewers();
    applyFilters();
  } catch (err) {
    alert('Failed to approve: ' + err.message);
  }
};

window.rejectInterviewer = async function (applicationId) {
  try {
    await api.updateInterviewerApplicationStatus(applicationId, 'REJECTED');
    await loadInterviewers();
    applyFilters();
  } catch (err) {
    alert('Failed to reject: ' + err.message);
  }
};

// ===== FILTER =====
window.filterInterviewers = function (status) {
  currentStatusFilter = status;
  
  // Update UI
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick')?.includes(`'${status}'`)) {
      btn.classList.add('active');
    }
  });

  applyFilters();
};

function applyFilters() {
  const statusFilter = currentStatusFilter;
  const postFilter = currentPostFilter;

  let filtered = allInterviewers.filter(iv => {
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'APPROVED' && iv.applicationStatus === 'APPROVED') ||
      (statusFilter === 'APPLIED' && iv.applicationStatus === 'APPLIED') ||
      (statusFilter === 'REJECTED' && iv.applicationStatus === 'REJECTED');
    const matchPost = postFilter === 'all' || String(iv.positionId) === String(postFilter);
    return matchStatus && matchPost;
  });
  renderInterviewers(filtered);
}

function wireUpPostFilter() {
  const el = document.getElementById('postFilter');
  if (!el) return;
  el.addEventListener('change', () => {
    currentPostFilter = el.value || 'all';
    applyFilters();
  });
}

async function populatePostFilter() {
  const el = document.getElementById('postFilter');
  if (!el) return;
  try {
    const positions = await api.getCompanyPositions(companyId);
    const open = (positions || []).filter(p => p.status === 'OPEN');
    el.innerHTML = `<option value="all">All Posts</option>` + open
      .map(p => `<option value="${p.id}">${p.positionTitle}</option>`)
      .join('');
  } catch (e) {
    // ignore
  }
  el.value = currentPostFilter;
}

// ===== LOAD DATA =====
async function loadInterviewers() {
  if (!companyId) {
    const grid = document.querySelector('.interviewers-grid');
    if (grid) grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;padding:32px;text-align:center;">Please login as Company Admin to view interviewers.</p>';
    return;
  }

  const grid = document.querySelector('.interviewers-grid');
  if (grid) grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;padding:32px;text-align:center;">Loading...</p>';

  try {
    allInterviewers = await api.getCompanyInterviewers(companyId);
    // Respect current filter selection on reload
    applyFilters();
  } catch (err) {
    console.error('Error loading interviewers:', err);
    if (grid) grid.innerHTML = '<p style="grid-column:1/-1;padding:32px;text-align:center;color:#dc2626;">Failed to load interviewers.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {

  const detailsClose = document.getElementById('interviewerDetailsClose');
  if (detailsClose) detailsClose.addEventListener('click', closeInterviewerDetails);

  const detailsModal = document.getElementById('interviewerDetailsModal');
  if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
      if (e.target === detailsModal) closeInterviewerDetails();
    });
  }

  const assignClose = document.getElementById('assignCandidatesClose');
  if (assignClose) assignClose.addEventListener('click', closeAssignModal);
  const assignModal = document.getElementById('assignCandidatesModal');
  if (assignModal) {
    assignModal.addEventListener('click', (e) => {
      if (e.target === assignModal) closeAssignModal();
    });
  }
  wireUpPostFilter();
  populatePostFilter();

  loadInterviewers();
  setAdminName();
});
