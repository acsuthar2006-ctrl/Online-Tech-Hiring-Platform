/* Interviewer Dashboard */

import { api } from '../../common/api.js';
import { Router } from '../../common/router.js'; // Auth check
import {
  formatDateTime,
  createLoadingState,
  createErrorState,
  createEmptyState
} from '../../common/dashboard-utils.js';

// Global state
let interviewerProfile = null
let scheduledInterviews = []
let approvedCompanies = []


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

    // Load approved companies
    try {
      approvedCompanies = await api.getApprovedCompanies(interviewerProfile.id)
      console.log('Approved Companies loaded:', approvedCompanies)
    } catch (e) {
      console.warn('Failed to load approved companies:', e)
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
  const todayCount = scheduledInterviews.length
  const completedCount = interviewerProfile.totalInterviewsConducted || 0

  // Derive active companies from scheduled interviews
  const companySet = new Set(scheduledInterviews.map(i => i.companyName).filter(Boolean))
  const activeCompanies = interviewerProfile.activeCompanies || companySet.size
  const totalEarnings = interviewerProfile.totalEarnings ? `$${interviewerProfile.totalEarnings}` : '$0'


  // Pre-render schedule list to handle async fetching
  const scheduleListHtml = await renderScheduleList(scheduledInterviews);

  const html = `
    <!-- Header -->
    <div class="header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div class="header-left">
        <h1>Welcome, <span id="userName">${interviewerProfile.fullName}</span>!</h1>
        <p class="text-muted">Manage your interviews and explore opportunities</p>
      </div>
      <div class="header-right">
        <button class="btn-icon" id="notificationBtn">
            <span class="notification-badge">3</span>
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
          <p class="stat-number">${todayCount}</p>
        </div>
      </div>
      <!-- Other stats hidden until backend support exists -->
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Schedule List -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; width: 100%;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Interview Schedule</h2>
        </div>
        <div class="schedule-list" style="padding: 20px;">
           ${scheduleListHtml}
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
    
    <!-- Schedule Modal -->
    <div id="scheduleModal" class="modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 101; align-items: center; justify-content: center;">
        <div class="modal-content" style="background: white; border-radius: 8px; padding: 24px; min-width: 400px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="margin: 0;">Schedule Interview</h2>
                <button onclick="closeScheduleModal()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <form id="scheduleForm" onsubmit="handleScheduleSubmit(event)">
                <input type="hidden" id="schedCandidateEmail" required>
                <input type="hidden" id="schedCandidateName" required>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px;">Candidate Name</label>
                    <input type="text" id="schedCandidateNameDisp" class="form-input" style="width: 100%; border:1px solid #ccc; padding:8px; border-radius:4px" disabled required>
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px;">Interview Title</label>
                    <input type="text" id="schedTitle" class="form-input" style="width: 100%; border:1px solid #ccc; padding:8px; border-radius:4px" required value="Technical Interview">
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px;">Date & Time</label>
                    <input type="datetime-local" id="schedDate" class="form-input" style="width: 100%; border:1px solid #ccc; padding:8px; border-radius:4px" required>
                </div>
                
                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 4px;">Duration (Minutes)</label>
                    <input type="number" id="schedDuration" value="60" class="form-input" style="width: 100%; border:1px solid #ccc; padding:8px; border-radius:4px" required>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%">Confirm Schedule</button>
            </form>
        </div>
    </div>

  `;

  contentDiv.innerHTML = html;
}

function renderApprovedCompanyList(companies) {
  if (!companies || companies.length === 0) {
    return '<p class="text-muted">You have not been approved for any companies yet.</p>'
  }

  return companies.map(company => {
    let positionsHtml = '';
    if (company.positions && company.positions.length > 0) {
      positionsHtml = company.positions.map(p =>
        `<button class="btn btn-outline btn-sm" style="margin-right: 8px; margin-top: 8px;" onclick="viewCandidates(${company.companyId}, ${p.positionId}, '${p.positionTitle}')">
                ${p.positionTitle} (View Candidates)
            </button>`
      ).join('');
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

window.viewCandidates = async (companyId, positionId, positionTitle) => {
  const modal = document.getElementById('candidatesModal');
  const title = document.getElementById('modalTitle');
  const list = document.getElementById('candidatesList');

  title.textContent = `Candidates for ${positionTitle}`;
  list.innerHTML = `<p>Loading candidates...</p>`;
  modal.style.display = 'flex';

  try {
    const candidates = await api.getCandidatesForPosition(positionId);
    if (!candidates || candidates.length === 0) {
      list.innerHTML = `<p class="text-muted">No candidates have applied for this position yet.</p>`;
      return;
    }

    list.innerHTML = candidates.map(c => `
            <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 4px 0">${c.fullName}</h4>
                    <p style="margin: 0; font-size: 13px; color: #6b7280;">${c.email} | Status: ${c.status}</p>
                </div>
                <button class="btn btn-primary btn-sm" onclick="openScheduleModal('${c.email}', '${c.fullName}')">Schedule Interview</button>
            </div>
        `).join('');
  } catch (e) {
    list.innerHTML = `<p style="color: red;">Failed to load candidates: ${e.message}</p>`;
  }
};

window.closeCandidatesModal = () => {
  document.getElementById('candidatesModal').style.display = 'none';
};

window.openScheduleModal = (email, name) => {
  // Close candidate modal to avoid overlapping modals (or keep it open)
  window.closeCandidatesModal();

  document.getElementById('schedCandidateEmail').value = email;
  document.getElementById('schedCandidateName').value = name;
  document.getElementById('schedCandidateNameDisp').value = name;
  document.getElementById('scheduleModal').style.display = 'flex';
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
async function renderScheduleList(interviews) {
  if (!interviews || interviews.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No Upcoming Interviews</h3>
        <p class="text-muted">You don't have any interviews scheduled at the moment.</p>
      </div>
    `;
  }

  // Fetch recordings for completed interviews
  const interviewsWithRecordings = await Promise.all(interviews.map(async (interview) => {
    if (interview.status === 'COMPLETED') {
      try {
        const recordings = await api.getRecordings(interview.id);
        // recordings is a List<Recording>
        // We'll attach it to the interview object
        return { ...interview, recordings: recordings || [] };
      } catch (e) {
        console.warn(`Failed to fetch recordings for interview ${interview.id}`, e);
        return interview;
      }
    }
    return interview;
  }));

  return interviewsWithRecordings.map(createScheduleItem).join('');
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

    if (interview.recordings && interview.recordings.length > 0) {
      const rec = interview.recordings[0];
      buttons += ` <a href="http://localhost:3000/recordings/${rec.filename}" download="${rec.filename}" class="btn btn-secondary btn-sm" style="margin-left: 5px;">Recording</a>`;
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

document.addEventListener('DOMContentLoaded', initializeDashboard)
