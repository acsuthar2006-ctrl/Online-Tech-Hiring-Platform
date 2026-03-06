import { api } from '../../common/api.js';

const companyId = sessionStorage.getItem('companyId');
let allPositions = [];
let currentPositionId = null;

// ===== RENDER JOBS =====
function renderJobs(positions) {
  const container = document.getElementById('jobsContainer');
  const emptyState = document.getElementById('emptyState');
  if (!container) return;
  container.innerHTML = '';

  if (!positions || positions.length === 0) {
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  positions.forEach(pos => {
    const statusColors = {
      OPEN: { bg: '#dcfce7', color: '#166534' },
      CLOSED: { bg: '#fee2e2', color: '#991b1b' },
      FILLED: { bg: 'var(--blue-100)', color: 'var(--blue-800)' },
    };
    const sc = statusColors[pos.status] || statusColors.OPEN;
    const skills = pos.requiredExpertise ? pos.requiredExpertise.split(',').map(s => s.trim()) : [];
    const skillTags = skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
    const date = pos.createdAt ? new Date(pos.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    container.insertAdjacentHTML('beforeend', `
      <div class="job-card card">
        <div class="job-card-header">
          <div>
            <h3 class="job-title">${pos.positionTitle}</h3>
            <p class="text-muted" style="font-size:13px; margin-top:4px;">Posted ${date}</p>
          </div>
          <span class="badge" style="background:${sc.bg}; color:${sc.color};">${pos.status}</span>
        </div>
        <p class="job-desc" style="color:var(--gray-600); margin:12px 0; font-size:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${pos.jobDescription || 'No description provided.'}
        </p>
        <div class="skill-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">${skillTags}</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:13px; color:var(--gray-500);">💰 ${pos.salaryRange || 'Salary not specified'}</span>
        </div>
        <div class="card-actions" style="margin-top:16px; display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn-primary btn-sm" onclick="openJobDetails(${pos.id})">View Details</button>
          <button class="btn-outline btn-sm" onclick="togglePositionStatus(${pos.id}, '${pos.status}')">
            ${pos.status === 'OPEN' ? 'Close Position' : 'Reopen Position'}
          </button>
          <button class="btn-outline btn-sm" style="color:#dc2626; border-color:#dc2626;" onclick="confirmDeletePosition(${pos.id})">Delete</button>
        </div>
      </div>
    `);
  });
}

// ===== LOAD JOBS =====
async function loadJobs() {
  if (!companyId) {
    console.warn('No companyId in session. Cannot load positions.');
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  try {
    allPositions = await api.getCompanyPositions(companyId);
    renderJobs(allPositions);
  } catch (err) {
    console.error('Error loading positions:', err);
  }
}

// ===== OPEN POST JOB MODAL =====
window.openPostJobModal = function () {
  document.getElementById('postJobModal').style.display = 'flex';
  // Clear form
  ['positionTitle', 'jobDescription', 'salaryMin', 'salaryMax', 'requiredSkills'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
};

window.closePostJobModal = function () {
  document.getElementById('postJobModal').style.display = 'none';
};

// ===== POST JOB =====
window.postJob = async function () {
  const title = document.getElementById('positionTitle').value.trim();
  const description = document.getElementById('jobDescription').value.trim();
  const salaryMin = document.getElementById('salaryMin').value;
  const salaryMax = document.getElementById('salaryMax').value;
  const skills = document.getElementById('requiredSkills').value.trim();

  if (!title) { alert('Please enter a position title.'); return; }

  const salaryRange = (salaryMin && salaryMax) ? `${salaryMin} - ${salaryMax}` :
    (salaryMin ? `From ${salaryMin}` : (salaryMax ? `Up to ${salaryMax}` : null));

  try {
    await api.createPosition({
      companyId: Number(companyId),
      positionTitle: title,
      jobDescription: description,
      salaryRange: salaryRange,
      requiredExpertise: skills
    });
    closePostJobModal();
    await loadJobs();
  } catch (err) {
    alert('Failed to create position: ' + err.message);
  }
};

// ===== TOGGLE STATUS =====
window.togglePositionStatus = async function (positionId, currentStatus) {
  const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
  try {
    await api.updatePositionStatus(positionId, newStatus);
    await loadJobs();
  } catch (err) {
    alert('Failed to update position status: ' + err.message);
  }
};

// ===== DELETE POSITION =====
window.confirmDeletePosition = function (positionId) {
  if (confirm('Are you sure you want to delete this position? This action cannot be undone.')) {
    api.deleteCompanyPosition(positionId).then(() => loadJobs()).catch(err => alert('Delete failed: ' + err.message));
  }
};

// ===== JOB DETAILS MODAL =====
window.openJobDetails = async function (positionId) {
  currentPositionId = positionId;
  const pos = allPositions.find(p => p.id === positionId);
  if (!pos) return;

  document.getElementById('jobTitle').textContent = pos.positionTitle;
  document.getElementById('detailTitle').textContent = pos.positionTitle;
  document.getElementById('detailStatus').textContent = pos.status;
  document.getElementById('detailSalary').textContent = pos.salaryRange || 'Not specified';
  document.getElementById('detailSkills').textContent = pos.requiredExpertise || 'None specified';
  document.getElementById('detailDescription').textContent = pos.jobDescription || 'No description.';

  document.getElementById('jobDetailsModal').style.display = 'flex';
  switchJobTab('overview');
};

window.closeJobDetailsModal = function () {
  document.getElementById('jobDetailsModal').style.display = 'none';
};

window.switchJobTab = async function (tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const tabBtn = [...document.querySelectorAll('.tab-btn')].find(b => b.textContent.toLowerCase().includes(tab));
  if (tabBtn) tabBtn.classList.add('active');
  const tabContent = document.getElementById(tab + 'Tab') || document.getElementById(tab === 'overview' ? 'overviewTab' : tab === 'candidates' ? 'candidatesTab' : 'interviewersTab');
  if (tabContent) tabContent.classList.add('active');

  if (tab === 'candidates' && currentPositionId) {
    const list = document.getElementById('candidatesList');
    if (list) {
      list.innerHTML = '<p class="text-muted">Loading...</p>';
      try {
        const candidates = await api.getPositionCandidates(currentPositionId);
        if (candidates.length === 0) {
          list.innerHTML = '<p class="text-muted">No candidates have applied yet.</p>';
        } else {
          list.innerHTML = candidates.map(c => `
            <div class="applicant-item" style="padding:12px; border-bottom:1px solid var(--gray-200); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${c.fullName}</strong>
                <p style="font-size:13px; color:var(--gray-500);">${c.email}</p>
                <p style="font-size:12px; color:var(--gray-400);">Applied: ${c.applicationDate || 'N/A'} &bull; Skills: ${(c.skills || []).join(', ') || 'None'}</p>
              </div>
              <span class="badge" style="background:var(--blue-100); color:var(--blue-800);">${c.status}</span>
            </div>
          `).join('');
        }
      } catch (err) {
        list.innerHTML = '<p class="text-muted">Failed to load candidates.</p>';
      }
    }
  }

  if (tab === 'interviewers' && currentPositionId) {
    const list = document.getElementById('interviewersList');
    if (list) {
      list.innerHTML = '<p class="text-muted">Loading...</p>';
      try {
        const interviewers = await api.getPositionInterviewers(currentPositionId);
        if (interviewers.length === 0) {
          list.innerHTML = '<p class="text-muted">No interviewers associated yet.</p>';
        } else {
          list.innerHTML = interviewers.map(iv => `
            <div class="applicant-item" style="padding:12px; border-bottom:1px solid var(--gray-200); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong>${iv.fullName}</strong>
                <p style="font-size:13px; color:var(--gray-500);">${iv.email}</p>
                <p style="font-size:12px; color:var(--gray-400);">Expertise: ${(iv.expertises || []).join(', ') || 'None'} &bull; Rating: ${iv.averageRating || 0}</p>
              </div>
              <span class="badge" style="background:${iv.applicationStatus === 'APPROVED' ? '#dcfce7' : iv.applicationStatus === 'REJECTED' ? '#fee2e2' : 'var(--blue-100)'}; color:${iv.applicationStatus === 'APPROVED' ? '#166534' : iv.applicationStatus === 'REJECTED' ? '#991b1b' : 'var(--blue-800)'};">${iv.applicationStatus || 'N/A'}</span>
            </div>
          `).join('');
        }
      } catch (err) {
        list.innerHTML = '<p class="text-muted">Failed to load interviewers.</p>';
      }
    }
  }
};

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target.id === 'postJobModal') closePostJobModal();
  if (e.target.id === 'jobDetailsModal') closeJobDetailsModal();
});

document.addEventListener('DOMContentLoaded', loadJobs);
