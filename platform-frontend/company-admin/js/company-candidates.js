import { api } from '../../common/api.js';

const companyId = sessionStorage.getItem('companyId');
let allCandidates = [];
let allPositionTitles = new Set();
let currentStatusFilter = 'all';
let companyName = '';
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

function renderTable(candidates) {
  const tbody = document.getElementById('candidatesTableBody');
  const header = document.querySelector('.candidates-table thead');
  
  if (!tbody) {
    const existingTbody = document.querySelector('.candidates-table tbody');
    if (existingTbody) existingTbody.id = 'candidatesTableBody';
    renderTable(candidates);
    return;
  }

  // Count unique candidates for header
  const candIds = new Set(candidates.map(c => c.id));
  const countEl = document.querySelector('.header-left .text-muted');
  if (countEl) countEl.textContent = `${candIds.size} total candidates`;

  if (candidates.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:var(--gray-500);">No candidates found.</td></tr>`;
    return;
  }

  // Group by Candidate ID
  const grouped = {};
  candidates.forEach(c => {
    if (!grouped[c.id]) {
      grouped[c.id] = { info: c, apps: [] };
    }
    if (c.status !== 'NOT_APPLIED' && c.positionId) {
      if (!grouped[c.id].apps.find(a => a.applicationId === c.applicationId)) {
        grouped[c.id].apps.push(c);
      }
    }
  });

  tbody.innerHTML = Object.values(grouped).map(g => {
    const main = g.info;
    const apps = g.apps;

    if (apps.length === 0) {
      return `
        <tr class="group-end">
          <td style="vertical-align: top; padding: 12px;"><strong>${main.fullName}</strong></td>
          <td style="vertical-align: top; padding: 12px;">${main.email}</td>
          <td style="color:var(--gray-400); padding: 12px;">Not Assigned</td>
          <td style="padding: 12px;">N/A</td>
          <td style="padding: 12px;">${statusBadge('NOT_APPLIED')}</td>
          <td style="padding: 12px;">N/A</td>
          <td style="padding: 12px;">
            <div class="table-actions">
               <button class="btn-text" onclick="viewCandidateDetails(${main.id}, ${JSON.stringify(main.fullName || 'Candidate').replace(/\"/g, '&quot;')})">View Profile</button>
            </div>
          </td>
        </tr>
      `;
    }

    const rowSpan = apps.length;
    let html = '';

    apps.forEach((app, idx) => {
      let displayDate = app.applicationDate || 'N/A';
      if (displayDate !== 'N/A' && displayDate.includes('T')) {
         displayDate = displayDate.split('T')[0];
      }

      let appActions = '';
      if (app.appliedDirectly && app.status === 'SHORTLISTED') {
        const comp = companyName || 'the company';
        const subject = `Selected for ${app.positionTitle || 'the position'} at ${comp} - Offer Letter`;
        const href = `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(subject)}`;
        appActions = `<a class="btn-text" href="${href}">Send Offer</a>`;
      }

      let actionHtml = appActions;
      if (idx === 0) {
         actionHtml = `
           <button class="btn-text" onclick="viewCandidateDetails(${main.id}, ${JSON.stringify(main.fullName || 'Candidate').replace(/\"/g, '&quot;')})">View Profile</button>
           ${appActions}
         `;
      }

      const isEnd = idx === apps.length - 1 ? ' class="group-end"' : '';

      if (idx === 0) {
        html += `
          <tr${isEnd}>
            <td rowspan="${rowSpan}" style="vertical-align: top; padding-top: 16px;"><strong>${main.fullName}</strong></td>
            <td rowspan="${rowSpan}" style="vertical-align: top; padding-top: 16px;">${main.email}</td>
            <td style="vertical-align: top; padding-top: 16px;"><strong>${app.positionTitle || 'Not Assigned'}</strong></td>
            <td style="vertical-align: top; padding-top: 16px;">${displayDate}</td>
            <td style="vertical-align: top; padding-top: 16px;">${statusBadge(app.status)}</td>
            <td style="vertical-align: top; padding-top: 16px;">${app.assignedInterviewerName || 'N/A'}</td>
            <td style="vertical-align: top; padding-top: 16px;">
              <div class="table-actions" style="display:flex; gap:8px;">${actionHtml}</div>
            </td>
          </tr>
        `;
      } else {
        html += `
          <tr${isEnd}>
            <td style="vertical-align: top; padding-top: 16px;"><strong>${app.positionTitle || 'Not Assigned'}</strong></td>
            <td style="vertical-align: top; padding-top: 16px;">${displayDate}</td>
            <td style="vertical-align: top; padding-top: 16px;">${statusBadge(app.status)}</td>
            <td style="vertical-align: top; padding-top: 16px;">${app.assignedInterviewerName || 'N/A'}</td>
            <td style="vertical-align: top; padding-top: 16px;">
              <div class="table-actions" style="display:flex; gap:8px;">${actionHtml}</div>
            </td>
          </tr>
        `;
      }
    });

    return html;
  }).join('');
}

// ===== VIEW CANDIDATE DETAILS =====
function setModalLoading() {
  const bioEl = document.getElementById('candidateBio');
  const skillsEl = document.getElementById('candidateSkills');
  const expEl = document.getElementById('candidateExperience');
  const eduEl = document.getElementById('candidateEducation');
  if (bioEl) bioEl.textContent = 'Loading...';
  if (skillsEl) skillsEl.textContent = 'Loading...';
  if (expEl) expEl.textContent = 'Loading...';
  if (eduEl) eduEl.textContent = 'Loading...';
}

function openModal() {
  const modal = document.getElementById('candidateModal');
  if (!modal) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  const modal = document.getElementById('candidateModal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function formatMonthYear(dateStr) {
  if (!dateStr) return 'Present';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function renderSkills(skills) {
  const skillsEl = document.getElementById('candidateSkills');
  if (!skillsEl) return;
  if (!skills || skills.length === 0) {
    skillsEl.textContent = 'No skills added.';
    return;
  }
  skillsEl.innerHTML = skills.map(s => `<span class="badge" style="margin-right:6px;">${s}</span>`).join('');
}

function renderExperience(items) {
  const expEl = document.getElementById('candidateExperience');
  if (!expEl) return;
  if (!items || items.length === 0) {
    expEl.textContent = 'No work experience added.';
    return;
  }
  expEl.innerHTML = `<div class="modal-list">${
    items.map(item => {
      const duration = item.durationMonths ? `${item.durationMonths} months` : null;
      const range = `${formatMonthYear(item.startDate)} - ${formatMonthYear(item.endDate)}`;
      const meta = [range, duration].filter(Boolean).join(' | ');
      const desc = item.description ? `<div>${item.description}</div>` : '';
      return `
        <div class="modal-item">
          <div class="item-title">${item.jobTitle} at ${item.companyName}</div>
          <div class="item-meta">${meta}</div>
          ${desc}
        </div>
      `;
    }).join('')
  }</div>`;
}

function renderEducation(items) {
  const eduEl = document.getElementById('candidateEducation');
  if (!eduEl) return;
  if (!items || items.length === 0) {
    eduEl.textContent = 'No education added.';
    return;
  }
  eduEl.innerHTML = `<div class="modal-list">${
    items.map(item => {
      const field = item.fieldOfStudy ? `, ${item.fieldOfStudy}` : '';
      const grad = item.graduationDate ? ` | Graduated ${formatMonthYear(item.graduationDate)}` : '';
      return `
        <div class="modal-item">
          <div class="item-title">${item.degree}${field}</div>
          <div class="item-meta">${item.schoolName}${grad}</div>
        </div>
      `;
    }).join('')
  }</div>`;
}

window.viewCandidateDetails = async function (candidateId, candidateName) {
  const titleEl = document.getElementById('candidateModalTitle');
  if (titleEl) titleEl.textContent = candidateName ? `${candidateName} - Profile` : 'Candidate Profile';
  setModalLoading();
  openModal();
  try {
    const profile = await api.getCompanyCandidateProfile(candidateId);
    const bioEl = document.getElementById('candidateBio');
    if (bioEl) {
      bioEl.textContent = profile.bio && profile.bio.trim() ? profile.bio : 'No bio added.';
    }
    renderSkills(profile.skills || []);
    renderExperience(profile.experience || []);
    renderEducation(profile.education || []);

    // Show/hide resume
    let resumeBtn = document.getElementById('candidateResumeBtn');
    if (resumeBtn) {
      if (profile.resumeUrl) {
        resumeBtn.style.display = 'inline-block';
        resumeBtn.href = profile.resumeUrl;
        resumeBtn.target = '_blank';
      } else {
        resumeBtn.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Failed to load candidate profile:', err);
    const bioEl = document.getElementById('candidateBio');
    const skillsEl = document.getElementById('candidateSkills');
    const expEl = document.getElementById('candidateExperience');
    const eduEl = document.getElementById('candidateEducation');
    if (bioEl) bioEl.textContent = 'Failed to load candidate details.';
    if (skillsEl) skillsEl.textContent = 'â€”';
    if (expEl) expEl.textContent = 'â€”';
    if (eduEl) eduEl.textContent = 'â€”';
  }
};

// ===== FILTER =====
window.filterCandidates = function (status) {
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

  let filtered = allCandidates.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter || 
                        (statusFilter === 'ACCEPTED' && (c.status === 'OFFERED' || c.status === 'SHORTLISTED'));
    const matchPost = postFilter === 'all' || String(c.positionId) === String(postFilter);
    return matchStatus && matchPost;
  });
  renderTable(filtered);
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
    // fallback: keep default
  }
  el.value = currentPostFilter;
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
    // Load company name (for offer email subject)
    if (!companyName) {
      try {
        const profile = await api.getCompanyProfile(companyId);
        companyName = profile?.companyName || '';
      } catch (e) {
        companyName = '';
      }
    }

    const rawCandidates = await api.getCompanyCandidates(companyId);

    // Expand any aggregated candidate -> applications into a flat list so every position shows
    allCandidates = (rawCandidates || []).flatMap(c => {
      if (Array.isArray(c.applications) && c.applications.length) {
        return c.applications.map(app => ({
          ...c,
          ...app,
          // Ensure position identifiers/titles exist on the flattened record
          positionId: app.positionId || app.position?.id || app.position?.positionId || c.positionId,
          positionTitle: app.positionTitle || app.position?.positionTitle || app.position?.title || c.positionTitle,
          status: app.status || c.status,
          applicationDate: app.applicationDate || c.applicationDate,
          assignedInterviewerName: app.assignedInterviewerName || c.assignedInterviewerName,
          appliedDirectly: app.appliedDirectly ?? c.appliedDirectly ?? true
        }));
      }
      return c ? [c] : [];
    });
    // Populate position filter
    const positionFilter = document.getElementById('positionFilter');
    if (positionFilter) {
      allCandidates.forEach(c => { if (c.positionTitle) allPositionTitles.add(c.positionTitle); });
      positionFilter.innerHTML = '<option value="all">All Positions</option>' +
        [...allPositionTitles].map(p => `<option value="${p}">${p}</option>`).join('');
    }
    renderTable(allCandidates);
    applyFilters();
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

  wireUpPostFilter();
  populatePostFilter();

  loadCandidates();
  setAdminName();

  const modal = document.getElementById('candidateModal');
  const modalClose = document.getElementById('candidateModalClose');
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
});
