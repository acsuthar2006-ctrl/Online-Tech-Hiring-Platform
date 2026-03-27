// Candidate Dashboard
import { api } from '../../common/api.js';
import { Router } from '../../common/router.js'; // Auth check
import { getMediaBase } from '../../common/media-config.js';
import { initNotifications } from '../../common/notifications.js';
import {
  formatDateTime,
  createLoadingState,
  createErrorState,
} from '../../common/dashboard-utils.js';

// Global state
let candidateProfile = null;
let upcomingInterviews = [];

function formatTimeLabelFromDateTime(dtStr) {
  try {
    if (!dtStr) return null;
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

function formatDateLabelFromDateTime(dtStr) {
  try {
    if (!dtStr) return null;
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return null;
  }
}

/**
 * Initialize dashboard on page load
 */
async function initializeDashboard() {
  try {
    // Show loading state
    const contentDiv = document.getElementById('dashboard-content');
    if (contentDiv) {
      contentDiv.innerHTML = createLoadingState();
    }

    // Load candidate profile
    // Try to get from session first to display quickly, then refresh
    const cachedUser = api.getUserInfo();
    if (cachedUser && cachedUser.role === 'CANDIDATE') {
         candidateProfile = cachedUser;
         // Set name immediately
         const nameEl = document.getElementById('userName');
         if(nameEl) nameEl.textContent = candidateProfile.fullName;
    }


    // Fetch fresh profile
    try {
        candidateProfile = await api.getUserProfile();
    } catch (e) {
        console.warn("Failed to refresh profile, using cached if available", e);
        if (!candidateProfile) throw e;
    }
    
    // Redirect if not candidate (Double check)
    if (candidateProfile.role !== 'CANDIDATE') {
      window.location.href = '/interviewer/interviewer-dashboard.html';
      return;
    }

    // Load upcoming interviews
    const interviewsData = await api.getUpcomingInterviews(candidateProfile.email);
    
    upcomingInterviews = interviewsData;

    // Render dashboard
    renderDashboard();
  } catch (error) {
    console.error('Dashboard initialization error:', error);
    const contentDiv = document.getElementById('dashboard-content');
    if (contentDiv) {
      contentDiv.innerHTML = createErrorState(error.message || 'Failed to load dashboard');
    }
  }
}

/**
 * Render complete dashboard
 */
function renderDashboard() {
  const contentDiv = document.getElementById('dashboard-content');
  if (!contentDiv) {
    return;
  }

  // Calculate stats
  // Note: Backend might not provide all these stats in the profile DTO yet, adding fallbacks
  const scheduledCount = upcomingInterviews ? upcomingInterviews.filter(i => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS').length : 0;
  const completedCount = upcomingInterviews ? upcomingInterviews.filter(i => i.status === 'COMPLETED').length : 0;
  const avgRating = (candidateProfile.averageRating && candidateProfile.averageRating > 0)
    ? candidateProfile.averageRating.toFixed(1) + '/5'
    : 'N/A';

  const html = `
    <!-- Header -->
    <div class="header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div class="header-left">
        <h1>Welcome, <span id="userName">${candidateProfile.fullName}</span>!</h1>
        <p class="text-muted">Track your interviews and explore opportunities</p>
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
                  <div class="profile-name" id="profileName">${candidateProfile.fullName}</div>
                  <div class="profile-role">Candidate</div>
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
          <h3>Scheduled</h3>
          <p class="stat-number">${scheduledCount}</p>
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
      <!-- Upcoming Interviews Card -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Upcoming Interviews</h2>
        </div>
        <div class="interview-list" style="padding: 20px;">
           ${renderInterviewList(upcomingInterviews, 'upcoming')}
        </div>
      </div>

      <!-- Past Interviews Card -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Past Interviews</h2>
        </div>
        <div class="interview-list" style="padding: 20px;">
           ${renderInterviewList(upcomingInterviews, 'past')}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; margin-top: 20px;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; font-size: 18px;">Quick Actions</h2>
        </div>
        <div class="quick-actions" style="padding: 20px;">
          <a href="./profile.html" class="action-card">
            <div class="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="action-info">
              <h4>Update Profile</h4>
              <p>Keep your profile current</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `;

contentDiv.innerHTML = html;
initNotifications();
}


/**
 * Render interview list items
 */
function renderInterviewList(interviews, type) {
  if (!interviews || interviews.length === 0) {
    return '<p class="text-muted">No interviews found.</p>'
  }

  let filtered = [];
  if (type === 'upcoming') {
      filtered = interviews
        .filter(i => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status))
        // soonest first
        .sort((a, b) => new Date(a.scheduledDate + 'T' + a.scheduledTime) - new Date(b.scheduledDate + 'T' + b.scheduledTime))
        .slice(0, 3);
  } else {
      filtered = interviews.filter(i => ['COMPLETED', 'CANCELLED'].includes(i.status));
      // Sort past interviews desc
      filtered.sort((a, b) => new Date(b.scheduledDate + 'T' + b.scheduledTime) - new Date(a.scheduledDate + 'T' + a.scheduledTime));
      filtered = filtered.slice(0, 3);
  }

  if (filtered.length === 0) {
    return `<p class="text-muted">No ${type} interviews.</p>`
  }

  return filtered.map(i => createInterviewItem(i, type)).join('')
}

/**
 * Create HTML for a single interview item
 */
function createInterviewItem(interview, type) {
  const dateStr = interview.scheduledDate || 'TBD';
  const timeStr = interview.scheduledTime || '';
  let dateTime = formatDateTime(interview.scheduledDate, interview.scheduledTime);
  if (interview.status === 'COMPLETED') {
    const actualStartLabel = formatTimeLabelFromDateTime(interview.actualStartTime);
    const actualEndLabel = formatTimeLabelFromDateTime(interview.actualEndTime);
    const actualDateLabel = formatDateLabelFromDateTime(interview.actualStartTime)
      || formatDateLabelFromDateTime(interview.actualEndTime);
    if (actualStartLabel && actualEndLabel && actualDateLabel) {
      dateTime = `${actualDateLabel} @ ${actualStartLabel} - ${actualEndLabel}`;
    }
  }
  
  let actionBtn = '';
  if (type === 'upcoming') {
      actionBtn = `<button class="btn btn-primary btn-sm" onclick="joinInterview(${interview.id}, '${interview.meetingLink}')">Join</button>`;
  } else if (interview.recordingUrl) {
      const mediaBase = getMediaBase();
      const fileUrl = `${mediaBase}/recordings/${interview.recordingUrl}`;
      actionBtn = `<button class="btn btn-primary btn-sm force-download-btn" style="margin-left:5px;" data-url="${fileUrl}" data-filename="${interview.recordingUrl}">Download Recording</button>`;
  } else {
      actionBtn = `<span class="text-muted" style="font-size: 0.8rem">No Recording</span>`;
  }

  const outcomeBadge = (interview.status === 'COMPLETED' && interview.candidateOutcome && interview.candidateOutcome !== 'PENDING')
    ? `<span class="badge ${interview.candidateOutcome === 'ACCEPTED' ? 'badge-green' : 'badge-red'}">${interview.candidateOutcome}</span>`
    : '';

  return `
    <div class="interview-item">
      <div class="interview-info">
        <h4>${interview.title || 'Technical Interview'}</h4>
        <p>with ${interview.interviewer?.fullName || 'Interviewer'}</p>
        <div class="interview-meta">
          <span class="badge badge-blue">${interview.interviewRound || 'General'}</span>
          <span>${dateTime}</span>
          <span class="badge ${interview.status === 'COMPLETED' ? 'badge-green' : 'badge-gray'}">${interview.status}</span>
          ${outcomeBadge}
        </div>
      </div>
      <div>${actionBtn}</div>
    </div>
  `
}

/**
 * Join interview call
 */
async function joinInterview(interviewId, meetingLink) {
  try {
    console.log(`Joining interview ${interviewId}`);
    // Candidate should never auto-start the interview
    // await api.startInterview(interviewId);
    
    // Get email
    const email = candidateProfile ? candidateProfile.email : '';
    window.location.href = `../../interview-screen/video-interview.html?room=${encodeURIComponent(meetingLink)}&role=candidate&email=${encodeURIComponent(email)}`;
  } catch (error) {
    alert(`Failed to join interview: ${error.message}`);
  }
}

/**
 * Logout
 */
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

// Expose functions
window.joinInterview = joinInterview
window.logout = logout

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

// Initialize
document.addEventListener('DOMContentLoaded', initializeDashboard)
