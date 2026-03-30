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

// ===== RENDER TABLE =====
function renderInterviewers(interviewers) {
  const tbody = document.getElementById('interviewersTableBody');
  if (!tbody) return;

  const countEl = document.querySelector('.header-left .text-muted');
  const uniqueIds = new Set(interviewers.map(iv => iv.id));
  if (countEl) countEl.textContent = `${uniqueIds.size} interviewers found`;

  if (interviewers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--gray-500);">No interviewers found.</td></tr>`;
    return;
  }

  // Group by Interviewer ID
  const grouped = {};
  interviewers.forEach(iv => {
    if (!grouped[iv.id]) {
      grouped[iv.id] = { info: iv, apps: [] };
    }
    if (iv.appliedToCompany && iv.applicationId) {
      if (!grouped[iv.id].apps.find(a => a.applicationId === iv.applicationId)) {
        grouped[iv.id].apps.push(iv);
      }
    }
  });

  tbody.innerHTML = Object.values(grouped).map(g => {
    const main = g.info;
    const apps = g.apps;
    const expertiseTags = (main.expertises || []).map(e => `<span class="tag" style="margin-bottom:4px;">${e}</span>`).join('');
    const viewBtn = `<button class="btn-outline btn-sm" onclick="openInterviewerDetails(${main.id})">View Bio</button>`;

    const expertiseCol = `
      <div class="expertise-tags" style="margin:0; padding:0;">
         ${expertiseTags || '<span style="color:var(--gray-400); font-style:italic;">No expertise</span>'}
      </div>
    `;

    if (apps.length === 0) {
      return `
        <tr class="group-end">
          <td style="vertical-align: top; padding: 12px;"><strong>${main.fullName}</strong></td>
          <td style="vertical-align: top; padding: 12px; font-size: 13px;">${main.email}</td>
          <td style="vertical-align: top; padding: 12px; max-width: 200px;">${expertiseCol}</td>
          <td style="color:var(--gray-400);">Not Assigned</td>
          <td><span class="badge">Not Applied</span></td>
          <td style="color:var(--gray-400);">N/A</td>
          <td>
            <div class="table-actions" style="display:flex; gap:8px;">${viewBtn}</div>
          </td>
        </tr>
      `;
    }

    const rowSpan = apps.length;
    let html = '';

    apps.forEach((iv, idx) => {
      const assignBtn = (iv.applicationStatus === 'APPROVED' && iv.positionId)
        ? `<button class="btn-primary btn-sm" onclick="openViewCandidates(${iv.id}, ${iv.positionId}, ${JSON.stringify(iv.fullName || 'Interviewer').replace(/\"/g, '&quot;')}, ${JSON.stringify(iv.positionTitle || 'Position').replace(/\"/g, '&quot;')})">Candidates</button>`
        : '';

      const actionBtns = iv.appliedToCompany
        ? (iv.applicationStatus === 'APPLIED'
          ? `<button class="btn-primary btn-sm" onclick="approveInterviewer(${iv.applicationId})">Approve</button>
             <button class="btn-outline btn-sm" style="color:#dc2626;border-color:#dc2626;" onclick="rejectInterviewer(${iv.applicationId})">Reject</button>`
          : iv.applicationStatus === 'APPROVED'
            ? `${assignBtn}<button class="btn-outline btn-sm" style="color:#dc2626;border-color:#dc2626;" onclick="rejectInterviewer(${iv.applicationId})">Remove</button>`
            : `<button class="btn-primary btn-sm" onclick="approveInterviewer(${iv.applicationId})">Re-approve</button>`)
        : `<button class="btn-outline btn-sm" disabled>Not Applied</button>`;

      const statsCol = `
        <div style="font-size:13px; line-height:1.4;">
           <div><span style="color:var(--gray-500);">Completed:</span> <strong>${iv.completedInterviews != null ? iv.completedInterviews : (iv.totalInterviewsConducted || 0)}</strong></div>
           <div><span style="color:var(--gray-500);">Upcoming:</span> <strong>${iv.upcomingInterviews != null ? iv.upcomingInterviews : (iv.upcomingScheduled || 0)}</strong></div>
        </div>
      `;

      let topActionHtml = actionBtns;
      if (idx === 0) {
         topActionHtml = `${viewBtn}${actionBtns}`;
      }

      const isEnd = idx === apps.length - 1 ? ' class="group-end"' : '';

      if (idx === 0) {
        html += `
          <tr${isEnd}>
            <td rowspan="${rowSpan}" style="vertical-align: top; padding-top: 16px;"><strong>${main.fullName}</strong><div style="margin-top:4px;">${availBadge(main.availabilityStatus)}</div></td>
            <td rowspan="${rowSpan}" style="vertical-align: top; padding-top: 16px; font-size: 13px;">${main.email}</td>
            <td rowspan="${rowSpan}" style="vertical-align: top; padding-top: 16px; max-width: 250px;">${expertiseCol}</td>
            <td style="vertical-align: top; padding-top: 16px;"><strong>${escapeHtml(iv.positionTitle || 'Not Assigned')}</strong></td>
            <td style="vertical-align: top; padding-top: 16px;">${appStatusBadge(iv.applicationStatus)}</td>
            <td style="vertical-align: top; padding-top: 16px;">${statsCol}</td>
            <td style="vertical-align: top; padding-top: 16px;">
              <div class="table-actions" style="display:flex; gap:8px;">${topActionHtml}</div>
            </td>
          </tr>
        `;
      } else {
        html += `
          <tr${isEnd}>
            <td style="vertical-align: top; padding-top: 16px;"><strong>${escapeHtml(iv.positionTitle || 'Not Assigned')}</strong></td>
            <td style="vertical-align: top; padding-top: 16px;">${appStatusBadge(iv.applicationStatus)}</td>
            <td style="vertical-align: top; padding-top: 16px;">${statsCol}</td>
            <td style="vertical-align: top; padding-top: 16px;">
              <div class="table-actions" style="display:flex; gap:8px;">${actionBtns}</div>
            </td>
          </tr>
        `;
      }
    });

    return html;
  }).join('');
}


// ===== VIEW & CHANGE CANDIDATES =====
let currentViewCandidates = [];
let currentViewInterviewerId = null;
let currentViewPositionId = null;
let currentViewInterviewerName = '';
let currentViewPositionTitle = '';
let selectedCandidateAppIds = new Set();
let lastCheckedIndex = null;

function renderViewCandidatesList(query = '') {
  const listEl = document.getElementById('viewCandidatesList');
  if (!listEl) return;

  if (!currentViewCandidates || currentViewCandidates.length === 0) {
    listEl.innerHTML = `<div class="modal-item">No candidates currently assigned.</div>`;
    return;
  }

  const q = query.toLowerCase().trim();
  const filtered = currentViewCandidates.filter(c => 
    (c.fullName && c.fullName.toLowerCase().includes(q)) || 
    (c.email && c.email.toLowerCase().includes(q))
  );

  selectedCandidateAppIds.clear();
  lastCheckedIndex = null;
  updateAssignMultipleBtn();

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="modal-item" style="color:var(--gray-500); text-align:center;">No candidates match your search.</div>`;
    return;
  }

  listEl.innerHTML = filtered.map((c, idx) => {
    const statusUpper = (c.status || '').toUpperCase();
    let actionHtml = '';
    if (statusUpper === 'ACCEPTED') {
      actionHtml = `<span class="badge" style="background:#dcfce7; color:#166534;">Accepted</span>`;
    } else if (statusUpper === 'REJECTED') {
      actionHtml = `<span class="badge" style="background:#fee2e2; color:#991b1b;">Rejected</span>`;
    } else if (statusUpper.includes('SCHEDULED') || c.interviewStatus) { 
      actionHtml = `<span class="badge" style="background:#dbeafe; color:#1e40af;">Interview Scheduled</span>`;
    } else {
      actionHtml = `<button class="btn-primary btn-sm" onclick="openChangeInterviewer(${c.applicationId}, ${currentViewInterviewerId}, ${currentViewPositionId}, '${currentViewInterviewerName.replace(/'/g, "\\'")}', '${currentViewPositionTitle.replace(/'/g, "\\'")}')">Change</button>`;
    }

    const showCheckbox = !(statusUpper === 'ACCEPTED' || statusUpper === 'REJECTED' || statusUpper.includes('SCHEDULED') || c.interviewStatus);

    return `
      <div class="modal-item" data-app-id="${c.applicationId}" style="display:flex; align-items:center; gap:12px;">
        ${showCheckbox ? `<input type="checkbox" class="candidate-checkbox" data-index="${idx}" data-app-id="${c.applicationId}" onchange="handleCandidateCheckboxChange(event, ${idx}, ${c.applicationId})" style="width:16px;height:16px;cursor:pointer;">` : `<div style="width:16px;"></div>`}
        <div style="flex:1;">
          <div class="item-title">${c.fullName}</div>
          <div class="item-meta">${c.email} • ${c.status}</div>
        </div>
        <div style="display:flex; justify-content:flex-end; align-items:center;">
          ${actionHtml}
        </div>
      </div>
    `;
  }).join('');
}

window.handleCandidateCheckboxChange = function(event, index, appId) {
  const isChecked = event.target.checked;
  const checkboxes = Array.from(document.querySelectorAll('.candidate-checkbox'));

  if (event.shiftKey && lastCheckedIndex !== null) {
    const start = Math.min(lastCheckedIndex, index);
    const end = Math.max(lastCheckedIndex, index);
    
    for (let i = start; i <= end; i++) {
        const cb = checkboxes.find(c => parseInt(c.dataset.index) === i);
        if (cb) {
            cb.checked = isChecked;
            const currentAppId = parseInt(cb.dataset.appId);
            if (isChecked) {
                selectedCandidateAppIds.add(currentAppId);
            } else {
                selectedCandidateAppIds.delete(currentAppId);
            }
        }
    }
  } else {
    if (isChecked) {
      selectedCandidateAppIds.add(appId);
    } else {
      selectedCandidateAppIds.delete(appId);
    }
  }
  
  lastCheckedIndex = index;
  updateAssignMultipleBtn();
};

function updateAssignMultipleBtn() {
    const btn = document.getElementById('viewCandidatesAssignSelectedBtn');
    if (!btn) return;
    if (selectedCandidateAppIds.size > 0) {
        btn.style.display = 'inline-block';
        btn.textContent = `Assign To (${selectedCandidateAppIds.size})`;
    } else {
        btn.style.display = 'none';
    }
}

window.openViewCandidates = async function(interviewerId, positionId, interviewerName, positionTitle) {
  const titleEl = document.getElementById('viewCandidatesTitle');
  const listEl = document.getElementById('viewCandidatesList');
  const searchInput = document.getElementById('viewCandidatesSearch');
  
  if (titleEl) titleEl.textContent = `Assigned Candidates • ${positionTitle} • ${interviewerName}`;
  if (listEl) listEl.innerHTML = `<div class="modal-item">Loading...</div>`;
  if (searchInput) searchInput.value = '';
  
  const modal = document.getElementById('viewCandidatesModal');
  if (modal) { modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); }

  try {
    currentViewCandidates = await api.getCandidatesForPositionAssigned(positionId, interviewerId);
    currentViewInterviewerId = interviewerId;
    currentViewPositionId = positionId;
    currentViewInterviewerName = interviewerName;
    currentViewPositionTitle = positionTitle;
    
    renderViewCandidatesList('');
  } catch (e) {
    if (listEl) listEl.innerHTML = `<div class="modal-item" style="color:#dc2626;">Failed to load candidates: ${e.message}</div>`;
  }
};

window.openChangeInterviewer = async function(applicationId, currentInterviewerId, positionId, interviewerName, positionTitle) {
  const viewModal = document.getElementById('viewCandidatesModal');
  if (viewModal) { viewModal.classList.remove('show'); viewModal.setAttribute('aria-hidden', 'true'); }

  const titleEl = document.getElementById('changeInterviewerTitle');
  const listEl = document.getElementById('changeInterviewerList');
  if (titleEl) titleEl.textContent = `Select New Interviewer`;
  if (listEl) listEl.innerHTML = `<div class="modal-item">Loading...</div>`;
  
  const modal = document.getElementById('changeInterviewerModal');
  if (modal) { modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); }

  try {
    const interviewers = await api.getPositionInterviewers(positionId);
    let alternatives = [];
    if (interviewers && Array.isArray(interviewers)) {
      alternatives = interviewers.filter(i => 
        i.applicationStatus === 'APPROVED' && String(i.id) !== String(currentInterviewerId)
      );
    }

    if (!alternatives || alternatives.length === 0) {
      if (listEl) {
        listEl.innerHTML = `
          <div class="modal-item">No other approved interviewers found for this position.</div>
          <div style="margin-top:10px;text-align:right;">
             <button class="btn-outline btn-sm" onclick="cancelChangeInterviewer(${currentInterviewerId}, ${positionId}, '${interviewerName.replace(/'/g, "\\'")}', '${positionTitle.replace(/'/g, "\\'")}')">Back</button>
          </div>
        `;
      }
      return;
    }

    if (listEl) {
      listEl.innerHTML = alternatives.map(i => {
        return `
          <div class="modal-item">
            <div class="item-title">${i.fullName}</div>
            <div class="item-meta">${i.email || ''}</div>
            <div style="margin-top:10px; display:flex; justify-content:flex-end;">
              <button class="btn-primary btn-sm" onclick="confirmChangeInterviewer(${applicationId}, ${i.id}, ${currentInterviewerId}, ${positionId}, '${interviewerName.replace(/'/g, "\\'")}', '${positionTitle.replace(/'/g, "\\'")}')">Select</button>
            </div>
          </div>
        `;
      }).join('') + `
        <div class="modal-item" style="border:none; text-align:right;">
           <button class="btn-outline btn-sm" onclick="cancelChangeInterviewer(${currentInterviewerId}, ${positionId}, '${interviewerName.replace(/'/g, "\\'")}', '${positionTitle.replace(/'/g, "\\'")}')">Cancel</button>
        </div>
      `;
    }
  } catch (e) {
    if (listEl) listEl.innerHTML = `<div class="modal-item" style="color:#dc2626;">Failed to load interviewers: ${e.message}</div>`;
  }
};

window.cancelChangeInterviewer = function(interviewerId, positionId, interviewerName, positionTitle) {
  const modal = document.getElementById('changeInterviewerModal');
  if (modal) { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); }
  window.openViewCandidates(interviewerId, positionId, interviewerName, positionTitle);
};

window.confirmChangeInterviewer = async function(applicationId, newInterviewerId, currentInterviewerId, positionId, interviewerName, positionTitle) {
  try {
    await api.assignCandidateToInterviewer(companyId, applicationId, newInterviewerId);
    const modal = document.getElementById('changeInterviewerModal');
    if (modal) { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); }
    window.openViewCandidates(currentInterviewerId, positionId, interviewerName, positionTitle);
  } catch (e) {
    alert('Failed to change interviewer: ' + e.message);
  }
};

window.openChangeInterviewerMultiple = async function() {
    if (selectedCandidateAppIds.size === 0) return;
    
    const viewModal = document.getElementById('viewCandidatesModal');
    if (viewModal) { viewModal.classList.remove('show'); viewModal.setAttribute('aria-hidden', 'true'); }

    const titleEl = document.getElementById('changeInterviewerTitle');
    const listEl = document.getElementById('changeInterviewerList');
    if (titleEl) titleEl.textContent = `Select New Interviewer for ${selectedCandidateAppIds.size} Candidates`;
    if (listEl) listEl.innerHTML = `<div class="modal-item">Loading...</div>`;
    
    const modal = document.getElementById('changeInterviewerModal');
    if (modal) { modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false'); }

    try {
        const interviewers = await api.getPositionInterviewers(currentViewPositionId);
        let alternatives = [];
        if (interviewers && Array.isArray(interviewers)) {
          alternatives = interviewers.filter(i => 
            i.applicationStatus === 'APPROVED' && String(i.id) !== String(currentViewInterviewerId)
          );
        }

        if (!alternatives || alternatives.length === 0) {
          if (listEl) {
            listEl.innerHTML = `
              <div class="modal-item">No other approved interviewers found for this position.</div>
              <div style="margin-top:10px;text-align:right;">
                 <button class="btn-outline btn-sm" onclick="cancelChangeInterviewer(${currentViewInterviewerId}, ${currentViewPositionId}, '${currentViewInterviewerName.replace(/'/g, "\\'")}', '${currentViewPositionTitle.replace(/'/g, "\\'")}')">Back</button>
              </div>
            `;
          }
          return;
        }

        if (listEl) {
          listEl.innerHTML = alternatives.map(i => {
            return `
              <div class="modal-item">
                <div class="item-title">${i.fullName}</div>
                <div class="item-meta">${i.email || ''}</div>
                <div style="margin-top:10px; display:flex; justify-content:flex-end;">
                  <button class="btn-primary btn-sm" onclick="confirmChangeInterviewerMultiple(${i.id})">Select</button>
                </div>
              </div>
            `;
          }).join('') + `
            <div class="modal-item" style="border:none; text-align:right;">
               <button class="btn-outline btn-sm" onclick="cancelChangeInterviewer(${currentViewInterviewerId}, ${currentViewPositionId}, '${currentViewInterviewerName.replace(/'/g, "\\'")}', '${currentViewPositionTitle.replace(/'/g, "\\'")}')">Cancel</button>
            </div>
          `;
        }
      } catch (e) {
        if (listEl) listEl.innerHTML = `<div class="modal-item" style="color:#dc2626;">Failed to load interviewers: ${e.message}</div>`;
      }
};

window.confirmChangeInterviewerMultiple = async function(newInterviewerId) {
    try {
        const appIds = Array.from(selectedCandidateAppIds);
        await Promise.all(appIds.map(appId => 
            api.assignCandidateToInterviewer(companyId, appId, newInterviewerId)
        ));
        
        selectedCandidateAppIds.clear();
        updateAssignMultipleBtn();
        
        const modal = document.getElementById('changeInterviewerModal');
        if (modal) { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); }
        window.openViewCandidates(currentViewInterviewerId, currentViewPositionId, currentViewInterviewerName, currentViewPositionTitle);
    } catch (e) {
        alert('Failed to change interviewer for multiple candidates: ' + e.message);
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
  const resumeBtn = document.getElementById('interviewerDetailsResumeBtn');

  if (titleEl) titleEl.textContent = interviewer.fullName || 'Interviewer Details';
  if (bioEl) bioEl.textContent = interviewer.bio || 'No bio provided.';

  if (expertiseEl) {
    const tags = (interviewer.expertises || []).map(e => `<span class="modal-tag">${escapeHtml(e)}</span>`).join('');
    expertiseEl.innerHTML = tags || '<span class="text-muted" style="font-size:13px;">No expertise listed.</span>';
  }

  if (availabilityEl) availabilityEl.textContent = interviewer.availabilityStatus || 'N/A';
  if (totalInterviewsEl) totalInterviewsEl.textContent = String(interviewer.totalInterviewsConducted || 0);
  if (upcomingEl) upcomingEl.textContent = String(interviewer.upcomingScheduled || 0);

  if (resumeBtn) {
    if (interviewer.resumeUrl) {
      resumeBtn.style.display = 'block';
      resumeBtn.onclick = () => window.open(interviewer.resumeUrl, '_blank');
    } else {
      resumeBtn.style.display = 'none';
      resumeBtn.onclick = null;
    }
  }

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

  const viewCandidatesCloseBtn = document.getElementById('viewCandidatesClose');
  if (viewCandidatesCloseBtn) viewCandidatesCloseBtn.addEventListener('click', () => {
    document.getElementById('viewCandidatesModal').classList.remove('show');
    document.getElementById('viewCandidatesModal').setAttribute('aria-hidden', 'true');
  });

  const viewCandidatesModal = document.getElementById('viewCandidatesModal');
  if (viewCandidatesModal) {
    viewCandidatesModal.addEventListener('click', (e) => {
      if (e.target === viewCandidatesModal) {
        viewCandidatesModal.classList.remove('show');
        viewCandidatesModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  const viewCandidatesSearch = document.getElementById('viewCandidatesSearch');
  if (viewCandidatesSearch) {
    viewCandidatesSearch.addEventListener('input', (e) => {
      renderViewCandidatesList(e.target.value);
    });
  }

  const changeInterviewerCloseBtn = document.getElementById('changeInterviewerClose');
  if (changeInterviewerCloseBtn) changeInterviewerCloseBtn.addEventListener('click', () => {
    document.getElementById('changeInterviewerModal').classList.remove('show');
    document.getElementById('changeInterviewerModal').setAttribute('aria-hidden', 'true');
  });

  const changeInterviewerModal = document.getElementById('changeInterviewerModal');
  if (changeInterviewerModal) {
    changeInterviewerModal.addEventListener('click', (e) => {
      if (e.target === changeInterviewerModal) {
        changeInterviewerModal.classList.remove('show');
        changeInterviewerModal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  wireUpPostFilter();
  populatePostFilter();

  loadInterviewers();
  setAdminName();
});
