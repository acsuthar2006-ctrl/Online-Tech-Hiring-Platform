import { api } from '../../common/api.js';

const companyId = sessionStorage.getItem('companyId');
let allCandidates = [];
let allPositionTitles = new Set();

// ===== STATUS BADGE =====
function statusBadge(status) {
  const map = {
    APPLIED: { bg: '#dbeafe', color: '#1e40af', label: 'Applied' },
    SHORTLISTED: { bg: '#fef3c7', color: '#92400e', label: 'Shortlisted' },
    INTERVIEW_SCHEDULED: { bg: '#e0f2fe', color: '#0369a1', label: 'Interview Scheduled' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
    OFFERED: { bg: '#dcfce7', color: '#166534', label: 'Offered' },
    MATCHED: { bg: '#ede9fe', color: '#5b21b6', label: 'Skill Matched' },
    NOT_APPLIED: { bg: '#f3f4f6', color: '#6b7280', label: 'Not Applied' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return `<span class="badge" style="background:${s.bg}; color:${s.color};">${s.label}</span>`;
}

// ===== RENDER TABLE =====
function renderTable(candidates) {
  const tbody = document.getElementById('candidatesTableBody');
  const header = document.querySelector('.candidates-table thead');
  const table = document.querySelector('.candidates-table');

  // Replace static tbody with dynamic one if needed
  if (!tbody) {
    const existingTbody = document.querySelector('.candidates-table tbody');
    if (existingTbody) existingTbody.id = 'candidatesTableBody';
    renderTable(candidates);
    return;
  }

  const countEl = document.querySelector('.header-left .text-muted');
  if (countEl) countEl.textContent = `${candidates.length} total candidates`;

  if (candidates.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--gray-500);">No candidates found.</td></tr>`;
    return;
  }

  tbody.innerHTML = candidates.map(c => `
    <tr>
      <td><strong>${c.fullName}</strong></td>
      <td>${c.email}</td>
      <td>${c.positionTitle || '<em style="color:var(--gray-400)">—</em>'}</td>
      <td>${c.applicationDate || '—'}</td>
      <td>${statusBadge(c.status)}</td>
      <td>${c.score != null ? c.score + '/10' : '—'}</td>
      <td style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn-text" onclick="viewCandidateSkills(${JSON.stringify(c.skills || []).replace(/"/g, '&quot;')})">Skills</button>
        ${!c.appliedDirectly ? '' : `<button class="btn-text">View</button>`}
      </td>
    </tr>
  `).join('');
}

// ===== SKILLS POPUP =====
window.viewCandidateSkills = function (skills) {
  if (!skills || skills.length === 0) { alert('No skills listed for this candidate.'); return; }
  alert('Skills: ' + skills.join(', '));
};

// ===== FILTER =====
function applyFilters() {
  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const posFilter = document.getElementById('positionFilter')?.value || 'all';
  const statusFilter = document.getElementById('statusFilter')?.value || 'all';

  let filtered = allCandidates.filter(c => {
    const matchSearch = !searchVal ||
      (c.fullName || '').toLowerCase().includes(searchVal) ||
      (c.email || '').toLowerCase().includes(searchVal) ||
      (c.positionTitle || '').toLowerCase().includes(searchVal);
    const matchPos = posFilter === 'all' || (c.positionTitle || '') === posFilter;
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchPos && matchStatus;
  });
  renderTable(filtered);
}

// ===== LOAD DATA =====
async function loadCandidates() {
  if (!companyId) {
    console.warn('No companyId in session');
    renderTable([]);
    return;
  }

  // Replace static tbody content
  const existingTbody = document.querySelector('.candidates-table tbody');
  if (existingTbody) {
    existingTbody.id = 'candidatesTableBody';
    existingTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-500);">Loading...</td></tr>';
  }

  try {
    allCandidates = await api.getCompanyCandidates(companyId);
    // Populate position filter
    const positionFilter = document.getElementById('positionFilter');
    if (positionFilter) {
      allCandidates.forEach(c => { if (c.positionTitle) allPositionTitles.add(c.positionTitle); });
      positionFilter.innerHTML = '<option value="all">All Positions</option>' +
        [...allPositionTitles].map(p => `<option value="${p}">${p}</option>`).join('');
    }
    renderTable(allCandidates);
  } catch (err) {
    console.error('Error loading candidates:', err);
    const tbody = document.getElementById('candidatesTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#dc2626;">Failed to load candidates.</td></tr>';
  }
}

// ===== WIRE UP FILTERS =====
document.addEventListener('DOMContentLoaded', () => {
  // Give the table body an id
  const tbody = document.querySelector('.candidates-table tbody');
  if (tbody) tbody.id = 'candidatesTableBody';

  // Give selects ids for filter access
  const selects = document.querySelectorAll('.search-bar select');
  if (selects[0]) selects[0].id = 'positionFilter';
  if (selects[1]) selects[1].id = 'statusFilter';

  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.id = 'searchInput';
    searchInput.addEventListener('input', applyFilters);
  }

  if (selects[0]) selects[0].addEventListener('change', applyFilters);
  if (selects[1]) selects[1].addEventListener('change', applyFilters);

  loadCandidates();
});
