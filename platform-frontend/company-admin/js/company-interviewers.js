import { api } from '../../common/api.js';

const companyId = sessionStorage.getItem('companyId');
let allInterviewers = [];

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
  return `<span class="badge" style="background:#ede9fe; color:#5b21b6;">Skill Match</span>`;
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
    const actionBtns = iv.appliedToCompany
      ? (iv.applicationStatus === 'APPLIED'
        ? `<button class="btn-primary btn-sm btn-full" onclick="approveInterviewer(${iv.applicationId})">Approve</button>
             <button class="btn-outline btn-sm btn-full" style="color:#dc2626;border-color:#dc2626;" onclick="rejectInterviewer(${iv.applicationId})">Reject</button>`
        : iv.applicationStatus === 'APPROVED'
          ? `<button class="btn-outline btn-sm btn-full" onclick="rejectInterviewer(${iv.applicationId})">Remove</button>`
          : `<button class="btn-primary btn-sm btn-full" onclick="approveInterviewer(${iv.applicationId})">Re-approve</button>`)
      : `<button class="btn-outline btn-sm btn-full">Not Applied</button>`;

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
        <div style="margin-bottom:12px; text-align:center;">${appStatusBadge(iv.applicationStatus)}</div>
        <div class="expertise-tags">${expertiseTags || '<span style="font-size:13px;color:var(--gray-400);">No expertise listed</span>'}</div>
        <div class="stats-mini">
          <div class="stat">
            <p class="stat-value">${iv.totalInterviewsConducted || 0}</p>
            <p class="stat-label">Interviews</p>
          </div>
          <div class="stat">
            <p class="stat-value">${iv.averageRating ? iv.averageRating.toFixed(1) : '—'}</p>
            <p class="stat-label">Rating</p>
          </div>
          <div class="stat">
            <p class="stat-value">${iv.upcomingScheduled || 0}</p>
            <p class="stat-label">Scheduled</p>
          </div>
        </div>
        <div class="card-actions">${viewBtn}${actionBtns}</div>
      </div>
    `;
  }).join('');
}

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
  } catch (err) {
    alert('Failed to approve: ' + err.message);
  }
};

window.rejectInterviewer = async function (applicationId) {
  try {
    await api.updateInterviewerApplicationStatus(applicationId, 'REJECTED');
    await loadInterviewers();
  } catch (err) {
    alert('Failed to reject: ' + err.message);
  }
};

// ===== FILTER =====
function applyFilters() {
  const searchVal = (document.getElementById('interviewerSearch')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('interviewerStatusFilter')?.value || 'all';

  let filtered = allInterviewers.filter(iv => {
    const matchSearch = !searchVal ||
      (iv.fullName || '').toLowerCase().includes(searchVal) ||
      (iv.email || '').toLowerCase().includes(searchVal) ||
      (iv.expertises || []).some(e => e.toLowerCase().includes(searchVal));
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'APPROVED' && iv.applicationStatus === 'APPROVED') ||
      (statusFilter === 'APPLIED' && iv.applicationStatus === 'APPLIED') ||
      (statusFilter === 'NOT_APPLIED' && !iv.appliedToCompany);
    return matchSearch && matchStatus;
  });
  renderInterviewers(filtered);
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
    renderInterviewers(allInterviewers);
  } catch (err) {
    console.error('Error loading interviewers:', err);
    if (grid) grid.innerHTML = '<p style="grid-column:1/-1;padding:32px;text-align:center;color:#dc2626;">Failed to load interviewers.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.id = 'interviewerSearch';
    searchInput.addEventListener('input', applyFilters);
  }

  const statusSelect = document.querySelectorAll('.search-bar select')[1];
  if (statusSelect) {
    statusSelect.id = 'interviewerStatusFilter';
    statusSelect.innerHTML = `
      <option value="all">All Status</option>
      <option value="APPROVED">Hired</option>
      <option value="APPLIED">Pending Approval</option>
      <option value="NOT_APPLIED">Not Applied</option>
    `;
    statusSelect.addEventListener('change', applyFilters);
  }

  const detailsClose = document.getElementById('interviewerDetailsClose');
  if (detailsClose) detailsClose.addEventListener('click', closeInterviewerDetails);

  const detailsModal = document.getElementById('interviewerDetailsModal');
  if (detailsModal) {
    detailsModal.addEventListener('click', (e) => {
      if (e.target === detailsModal) closeInterviewerDetails();
    });
  }

  loadInterviewers();
  setAdminName();
});
