/* Interviewer Dashboard */

import { api } from '../../common/api.js';
import { Router } from '../../common/router.js'; // Auth check
import { getMediaBase } from '../../common/media-config.js';
import {
  formatDateTime,
  createLoadingState,
  createErrorState,
  createEmptyState
} from '../../common/dashboard-utils.js';
import { initNotifications } from '../../common/notifications.js';

// Global state
let interviewerProfile = null
let scheduledInterviews = []
let approvedCompanies = []
let allPositionsMap = {}


// Initialize dashboard on page load

async function initializeDashboard() {
  try {
    // Show loading state
    const contentDiv = document.getElementById('dashboard-content');
    if (contentDiv) {
      contentDiv.innerHTML = createLoadingState();
    }

    // Load interviewer profile
    interviewerProfile = await api.getUserProfile();

    // Redirect if not interviewer
    if (interviewerProfile.role !== 'INTERVIEWER') {
      window.location.href = '/candidate/candidate-dashboard.html';
      return;
    }

    // Load interviews where this interviewer is assigned
    scheduledInterviews = await api.getUpcomingInterviewsForInterviewer(interviewerProfile.email)
    console.log('Scheduled interviews loaded:', scheduledInterviews)

    // Load approved companies and all positions
    try {
      const [companiesArr, allPos] = await Promise.all([
        api.getApprovedCompanies(interviewerProfile.id),
        api.getAllPositions()
      ]);
      approvedCompanies = companiesArr;
      
      // Create a map for quick status lookup
      allPositionsMap = {};
      (allPos || []).forEach(p => {
        allPositionsMap[p.id] = p.status;
      });
      
      console.log('Approved Companies loaded:', approvedCompanies);
    } catch (e) {
      console.warn('Failed to load approved companies or positions:', e)
      approvedCompanies = []
    }

    // Render dashboard
    await renderDashboard();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    const contentDiv = document.getElementById('dashboard-content');
    if (contentDiv) {
      contentDiv.innerHTML = createErrorState(error.message || 'Failed to load dashboard');
    }
  }
}

async function renderDashboard() {
  // Add styles for empty state if not present
  if (!document.getElementById('dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
    style.textContent = `
      .empty-state { text-align: center; padding: 30px; }
      .empty-icon { font-size: 48px; margin-bottom: 10px; }
      .empty-state h3 { color: #374151; margin-bottom: 5px; }
    `;
    document.head.appendChild(style);
  }

  const contentDiv = document.getElementById('dashboard-content');
  if (!contentDiv) {
    return;
  }

  // Calculate Stats
  const upcomingCount = scheduledInterviews.filter(i => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS').length;
  const totalCompletedCount = scheduledInterviews.filter(i => i.status === 'COMPLETED').length;
  // Also keep the profile count if needed, but the user requested local accurate counts based on the list
  const completedCount = totalCompletedCount;

  // Derive active companies from scheduled interviews
  const companySet = new Set(scheduledInterviews.map(i => i.companyName).filter(Boolean))
  const activeCompanies = interviewerProfile.activeCompanies || companySet.size
  const totalEarnings = interviewerProfile.totalEarnings ? `$${interviewerProfile.totalEarnings}` : '$0'


  // Pre-render lists to handle async fetching
  const upcomingListHtml = await renderScheduleList(scheduledInterviews, 'upcoming');
  const completedListHtml = await renderScheduleList(scheduledInterviews, 'completed');

  const html = `
    <!-- Header -->
    <div class="header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div class="header-left">
        <h1>Welcome, <span id="userName">${interviewerProfile.fullName}</span>!</h1>
        <p class="text-muted">Manage your interviews and explore opportunities</p>
      </div>
      <div class="header-right">
        <button class="btn-icon" id="notificationBtn">
            <span class="notification-badge" style="display:none;">0</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" />
                    <path
                          d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
        </button>
        <div class="profile-menu">
            <div class="profile-info">
                 <div class="profile-name" id="profileName">${interviewerProfile.fullName}</div>
                    <div class="profile-role">Interviewer</div>
                 </div>
            </div>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <div class="stat-info">
          <h3>Upcoming</h3>
          <p class="stat-number">${upcomingCount}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background-color: #dcfce7; color: #16a34a;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="stat-info">
          <h3>Completed</h3>
          <p class="stat-number">${completedCount}</p>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Upcoming Interviews -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; width: 100%; margin-bottom: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Upcoming Interviews</h2>
        </div>
        <div class="schedule-list" style="padding: 20px;">
           ${upcomingListHtml}
        </div>
      </div>

      <!-- Completed Interviews -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; width: 100%; margin-bottom: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Completed Interviews</h2>
        </div>
        <div class="schedule-list" style="padding: 20px;">
           ${completedListHtml}
        </div>
      </div>

      <!-- Approved Companies -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">My Approved Companies</h2>
        </div>
        <div class="company-list" style="padding: 20px;" id="companyListContainer">
           ${renderApprovedCompanyList(approvedCompanies)}
        </div>
      </div>
    </div>
    
    <!-- Candidates Modal -->
    <div id="candidatesModal" class="modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: white; border-radius: 8px; padding: 24px; min-width: 500px; max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 id="modalTitle" style="margin: 0;">Candidates</h2>
                <button onclick="closeCandidatesModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div id="candidatesList">
                <p>Loading candidates...</p>
            </div>
        </div>
    </div>
    


  `;

contentDiv.innerHTML = html;
  await initNotifications();
}

function renderApprovedCompanyList(companies) {
  if (!companies || companies.length === 0) {
    return '<p class="text-muted">You have not been approved for any companies yet.</p>'
  }

  return companies.map(company => {
    let positionsHtml = '';
    if (company.positions && company.positions.length > 0) {
      // Use the global positions map for the most accurate status
      const openPositions = company.positions.filter(p => {
        const liveStatus = allPositionsMap[p.positionId];
        return liveStatus === 'OPEN';
      });

      if (openPositions.length > 0) {
        positionsHtml = openPositions.map(p =>
          `<button class="btn btn-outline btn-sm" style="margin-right: 8px; margin-top: 8px;" onclick="viewCandidates(${company.companyId}, ${p.positionId}, '${p.positionTitle.replace(/'/g, "\\'")}', '${company.companyName.replace(/'/g, "\\'")}')">
                  ${p.positionTitle} (View Candidates)
              </button>`
        ).join('');
      } else {
        positionsHtml = `<p class="text-muted" style="font-size: 12px;">No open positions at the moment.</p>`;
      }
    } else {
      positionsHtml = `<p class="text-muted" style="font-size: 12px;">No open positions.</p>`;
    }

    return `
    <div class="company-item" style="padding: 15px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; margin-bottom: 10px;">
      <div class="company-info" style="margin-bottom: 10px;">
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${company.companyName}</h4>
        <p style="margin: 0; font-size: 14px; color: #166534;">Approved Interviewer</p>
      </div>
      <div>
        ${positionsHtml}
      </div>
    </div>
  `}).join('')
}

// Returns candidates who still need an interview scheduled
function getPendingCandidates(candidates) {
  return candidates.filter(c => {
    if (c.candidateOutcome && c.candidateOutcome !== 'PENDING') return false;
    if (c.interviewStatus === 'SCHEDULED' || c.interviewStatus === 'IN_PROGRESS' || c.interviewStatus === 'COMPLETED') return false;
    return c.status === 'APPLIED' || c.status === 'SHORTLISTED' || c.status === 'PENDING';
  });
}

// Builds the URL to open the schedule page with multiple emails pre-filled
function buildScheduleAllUrl(emails, positionTitle, companyName, companyId, positionId) {
  const params = new URLSearchParams({
    email: emails.join(', '),
    positionTitle,
    companyName,
    ...(companyId ? { companyId } : {}),
    ...(positionId ? { positionId } : {})
  });
  return `schedule-an-interview.html?${params.toString()}`;
}

window.viewCandidates = async (companyId, positionId, positionTitle, companyName) => {
  const modal = document.getElementById('candidatesModal');
  const title = document.getElementById('modalTitle');
  const list = document.getElementById('candidatesList');

  title.textContent = `Candidates for ${positionTitle}`;
  list.innerHTML = `<p>Loading candidates...</p>`;
  modal.style.display = 'flex';

  try {
    const candidates = await api.getCandidatesForPositionAssigned(positionId, interviewerProfile?.id);
    if (!candidates || candidates.length === 0) {
      list.innerHTML = `<p class="text-muted">No candidates have applied for this position yet.</p>`;
      return;
    }

    // --- Schedule All button ---
    const pendingCandidates = getPendingCandidates(candidates);
    const scheduleAllHtml = pendingCandidates.length > 0
      ? `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
           <button
             class="btn btn-primary"
             style="width:100%;font-weight:600;"
             onclick="window.location.href='${buildScheduleAllUrl(pendingCandidates.map(c => c.email), positionTitle, companyName, companyId, positionId)}'">
             📅 Schedule Interview for all (${pendingCandidates.length} candidate${pendingCandidates.length > 1 ? 's' : ''})
           </button>
         </div>`
      : '';

    const renderCandidateRow = (c) => {
      let actionHTML = '';

      // Priority: outcome > interview status > application status
      if (c.candidateOutcome && c.candidateOutcome !== 'PENDING') {
        const badgeClass = c.candidateOutcome === 'ACCEPTED' ? 'badge-green' : 'badge-red';
        const label = c.candidateOutcome === 'ACCEPTED' ? '✓ Accepted' : '✕ Rejected';
        actionHTML = `<span class="badge ${badgeClass}" style="font-size:12px;font-weight:600;padding:6px 10px;">${label}</span>`;
      } else if (c.interviewStatus === 'COMPLETED') {
        // Show Accept/Reject buttons directly in the modal
        actionHTML = `
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <span class="badge badge-green" style="font-size:12px;">Interview Completed</span>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-sm" style="background:#16a34a;color:white;" onclick="markOutcomeInModal(event, ${c.interviewId}, 'ACCEPTED', ${positionId}, '${positionTitle.replace(/'/g, "\\'")}', '${companyName.replace(/'/g, "\\'")}')">✓ Accept</button>
              <button class="btn btn-sm" style="background:#dc2626;color:white;" onclick="markOutcomeInModal(event, ${c.interviewId}, 'REJECTED', ${positionId}, '${positionTitle.replace(/'/g, "\\'")}', '${companyName.replace(/'/g, "\\'")}')">✕ Reject</button>
            </div>
          </div>`;
      } else if (c.interviewStatus === 'SCHEDULED' || c.interviewStatus === 'IN_PROGRESS') {
        const label = c.interviewStatus === 'IN_PROGRESS' ? '🔴 In Progress' : '📅 Scheduled';
        actionHTML = `<span class="badge badge-blue" style="font-size:12px;font-weight:500;padding:6px 10px;">${label}</span>`;
      } else if (c.status === 'APPLIED' || c.status === 'SHORTLISTED' || c.status === 'PENDING') {
        actionHTML = `<button class="btn btn-primary btn-sm" onclick="openSchedulePage('${c.email}', '${c.fullName.replace(/'/g, "\\'")}', '${positionTitle.replace(/'/g, "\\'")}', '${companyName.replace(/'/g, "\\'")}'${companyId ? `, ${companyId}` : ''}, ${positionId})">Schedule Interview</button>`;
      } else {
        const badgeClass = c.status === 'REJECTED' ? 'badge-red' : (c.status === 'OFFERED' || c.status === 'ACCEPTED' ? 'badge-green' : 'badge-blue');
        actionHTML = `<span class="badge ${badgeClass}" style="font-size:12px;font-weight:500;">${c.status.replace('_', ' ')}</span>`;
      }

      return `
        <div data-candidate-id="${c.id}" style="border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h4 style="margin:0 0 4px 0">${c.fullName}</h4>
            <p style="margin:0;font-size:13px;color:#6b7280;">${c.email} | Status: ${c.status}</p>
          </div>
          <div class="candidate-action">${actionHTML}</div>
        </div>
      `;
    };

    list.innerHTML = scheduleAllHtml + candidates.map(renderCandidateRow).join('');
  } catch (e) {
    list.innerHTML = `<p style="color:red;">Failed to load candidates: ${e.message}</p>`;
  }
};

window.closeCandidatesModal = () => {
  document.getElementById('candidatesModal').style.display = 'none';
};

window.openSchedulePage = (email, name, positionTitle, companyName, companyId, positionId) => {
  const params = new URLSearchParams({
    email,
    name,
    positionTitle,
    companyName,
    companyId,
    positionId
  });
  window.location.href = `schedule-an-interview.html?${params.toString()}`;
};

window.closeScheduleModal = () => {
  document.getElementById('scheduleModal').style.display = 'none';
};

window.handleScheduleSubmit = async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Scheduling...";

  // Generate random meet link
  const randomStr = Math.random().toString(36).substring(2, 10);
  const meetingLink = `meet-${randomStr}`;

  const requestData = {
    candidateEmail: document.getElementById('schedCandidateEmail').value,
    candidateName: document.getElementById('schedCandidateName').value,
    interviewerEmail: interviewerProfile.email,
    interviewerId: interviewerProfile.id,
    scheduledTime: document.getElementById('schedDate').value,
    title: document.getElementById('schedTitle').value,
    meetingLink: meetingLink,
    description: "Technical Interview generated via Dashboard",
    durationMinutes: parseInt(document.getElementById('schedDuration').value),
    interviewType: "TECHNICAL"
  };

  try {
    await api.scheduleInterview(requestData);
    alert('Interview scheduled successfully!');
    window.closeScheduleModal();
    // Reload dashboard
    initializeDashboard();
  } catch (err) {
    alert('Failed to schedule: ' + err.message);
    btn.disabled = false;
    btn.textContent = "Confirm Schedule";
  }
};

// Make this async to fetch recordings
async function renderScheduleList(interviews, type = 'upcoming') {
  if (!interviews || interviews.length === 0) {
    if (type === 'upcoming') return '<p class="text-muted">No upcoming interviews.</p>';
    if (type === 'completed') return '<p class="text-muted">No completed interviews.</p>';
    return '<p class="text-muted">No interviews found.</p>';
  }

  const filtered = (type === 'completed')
    ? interviews.filter(i => i.status === 'COMPLETED' || i.status === 'CANCELLED')
    : interviews.filter(i => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS');

  if (!filtered || filtered.length === 0) {
    if (type === 'upcoming') return '<p class="text-muted">No upcoming interviews.</p>';
    if (type === 'completed') return '<p class="text-muted">No completed interviews.</p>';
    return '<p class="text-muted">No interviews found.</p>';
  }

  // Sort + limit for dashboard (only show recent 3)
  const sortedLimited = [...filtered].sort((a, b) => {
    const da = new Date((a.scheduledDate || '') + 'T' + (a.scheduledTime || '00:00:00'));
    const db = new Date((b.scheduledDate || '') + 'T' + (b.scheduledTime || '00:00:00'));
    return type === 'completed' ? (db - da) : (da - db);
  }).slice(0, 3);

  return sortedLimited.map(createScheduleItem).join('');
}


function createScheduleItem(interview) {
  // Extract time from scheduledTime "HH:mm:ss"
  const time = interview.scheduledTime ? interview.scheduledTime.substring(0, 5) : 'TBD';
  const candidateName = interview.candidate ? interview.candidate.fullName : 'Candidate';
  const statusClass = interview.status === 'COMPLETED' ? 'badge-green' : 'badge-blue';

  return `
      <div class="schedule-item">
        <div class="schedule-time">
          <div class="time-badge">${time}</div>
        </div>
        <div class="schedule-info">
          <h4>${interview.title || 'Technical Interview'}</h4>
          <p>${interview.companyName || 'Company'} • Candidate: ${candidateName}</p>
          <div class="schedule-meta">
            <span class="badge ${statusClass}">${interview.status}</span>
            <span>${interview.interviewRound || 'Round'}</span>
          </div>
        </div>
        <div class="schedule-actions">
            ${createActionButtons(interview)}
        </div>
      </div>
    `;
}

function createActionButtons(interview) {
  if (interview.status === 'SCHEDULED' || interview.status === 'IN_PROGRESS') {
    return `<button class="btn btn-primary btn-sm" onclick="joinInterview(${interview.id}, '${interview.meetingLink}')">Start</button>`;
  } else if (interview.status === 'COMPLETED') {
    let buttons = ``;

    // Add Accept/Reject buttons if outcome not yet set
    if (!interview.candidateOutcome || interview.candidateOutcome === 'PENDING') {
      buttons += `<button class="btn btn-sm" style="background:#16a34a;color:white;margin-right:4px;" onclick="window.markOutcome(${interview.id}, 'ACCEPTED')">✓ Accept</button>`;
      buttons += `<button class="btn btn-sm" style="background:#dc2626;color:white;margin-right:4px;" onclick="window.markOutcome(${interview.id}, 'REJECTED')">✕ Reject</button>`;
    } else {
      let outcomeClass = interview.candidateOutcome === 'ACCEPTED' ? 'badge-green' : 'badge-red';
      buttons += `<span class="badge ${outcomeClass}" style="margin-right:4px;">${interview.candidateOutcome}</span>`;
    }

    if (interview.recordingUrl) {
      const fileUrl = `/recordings/${interview.recordingUrl}`;
      buttons += `<button class="btn btn-primary btn-sm force-download-btn" style="margin-left: 5px;" data-url="${fileUrl}" data-filename="${interview.recordingUrl}">Download Recording</button>`;
    }
    return buttons;
  }
  return '';
}

window.markOutcome = async (interviewId, outcome) => {
  if (!confirm(`Mark this candidate as ${outcome}?`)) return;
  try {
    await api.updateInterviewOutcome(interviewId, outcome);
    // Refresh dashboard to show the badge
    initializeDashboard();
  } catch (e) {
    alert('Failed to update candidate outcome: ' + e.message);
  }
};

// Used inside the candidates modal — updates inline without closing modal
window.markOutcomeInModal = async (event, interviewId, outcome, positionId, positionTitle, companyName) => {
  if (!confirm(`Mark this candidate as ${outcome}?`)) return;
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Saving...';
  try {
    await api.updateInterviewOutcome(interviewId, outcome);
    // Update the action area inline
    const actionDiv = btn.closest('.candidate-action');
    if (actionDiv) {
      const badgeClass = outcome === 'ACCEPTED' ? 'badge-green' : 'badge-red';
      const label = outcome === 'ACCEPTED' ? '✓ Accepted' : '✕ Rejected';
      actionDiv.innerHTML = `<span class="badge ${badgeClass}" style="font-size:12px;font-weight:600;padding:6px 10px;">${label}</span>`;
    }
    // Also refresh dashboard counts in background
    initializeDashboard();
  } catch (e) {
    alert('Failed to update candidate outcome: ' + e.message);
    btn.disabled = false;
    btn.textContent = outcome === 'ACCEPTED' ? '✓ Accept' : '✕ Reject';
  }
};

// Join/Start interview call

async function joinInterview(interviewId, meetingLink) {
  try {
    console.log(`Joining interview ${interviewId} with meeting link: ${meetingLink}`);
    // Do not auto-start. Let the interviewer "Call In" from the video room.
    // await api.startInterview(interviewId); 

    // Get email for direct access
    const email = interviewerProfile ? interviewerProfile.email : '';
    window.location.href = `../../interview-screen/video-interview.html?room=${encodeURIComponent(meetingLink)}&role=interviewer&email=${encodeURIComponent(email)}`;
  } catch (error) {
    alert(`Failed to join interview: ${error.message}`);
  }
}

// Logout

async function logout() {
  if (confirm('Are you sure you want to logout?')) {
    api.clearToken()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    window.location.href = '/login/login.html'
  }
}

window.joinInterview = joinInterview
window.logout = logout
window.refreshQueue = initializeDashboard

// Global click handler for forcing downloads cross-origin without opening a new tab
document.addEventListener("click", async (e) => {
  const btn = e.target.closest('.force-download-btn');
  if (btn) {
    e.preventDefault();
    
    const originalText = btn.innerHTML;
    try {
      btn.innerHTML = 'Downloading...';
      btn.disabled = true;
      
      const url = btn.getAttribute("data-url");
      const filename = btn.getAttribute("data-filename") || "recording.mp4";
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const windowUrl = window.URL || window.webkitURL;
      const downloadUrl = windowUrl.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      windowUrl.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error("Force download failed:", err);
      // alert("Download failed. Please try again later.");
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
});

document.addEventListener('DOMContentLoaded', initializeDashboard)
