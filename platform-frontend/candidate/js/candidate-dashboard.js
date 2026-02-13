// Candidate Dashboard
import { api } from '../../common/api.js'
import {
  formatDateTime,
  createLoadingState,
  createErrorState,
  createEmptyState
} from '../../common/dashboard-utils.js'

// Global state
let candidateProfile = null
let upcomingInterviews = []

/**
 * Initialize dashboard on page load
 */
async function initializeDashboard() {
  try {
    // Show loading state
    const contentDiv = document.getElementById('dashboard-content')
    if (contentDiv) {
      contentDiv.innerHTML = createLoadingState()
    }

    // Load candidate profile
    candidateProfile = await api.getUserProfile()
    console.log('Profile loaded:', candidateProfile)

    // Load upcoming interviews
    upcomingInterviews = await api.getUpcomingInterviews(candidateProfile.email)
    console.log('Interviews loaded:', upcomingInterviews)

    // Render dashboard
    renderDashboard()
  } catch (error) {
    console.error('Dashboard initialization error:', error)
    const contentDiv = document.getElementById('dashboard-content')
    if (contentDiv) {
      contentDiv.innerHTML = createErrorState(error.message || 'Failed to load dashboard')
    }
  }
}

/**
 * Render complete dashboard
 * Matches structure of platform-frontend/candidate/candidate-dashboard.html
 */
function renderDashboard() {
  const contentDiv = document.getElementById('dashboard-content')
  if (!contentDiv) {
    return
  }

  // Calculate stats
  // Note: Backend might not provide all these stats in the profile DTO yet, adding fallbacks
  const scheduledCount = upcomingInterviews.filter(i => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS').length
  const completedCount = candidateProfile.totalInterviewsAttended || 0
  const avgRating = (candidateProfile.averageRating && candidateProfile.averageRating > 0)
    ? candidateProfile.averageRating.toFixed(1) + '/5'
    : 'N/A'

  const html = `
    <!-- Header -->
    <div class="header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div class="header-left">
        <h1>Welcome, <span id="userName">${candidateProfile.fullName}</span>!</h1>
        <p class="text-muted">Track your interviews and explore opportunities</p>
      </div>
      <div class="header-right">
         <!-- Reuse static header right structure if needed, or simple actions -->
         <button class="btn btn-secondary btn-sm" onclick="window.logout()">Logout</button>
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
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="stat-info">
          <h3>Completed</h3>
          <p class="stat-number">${completedCount}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="stat-info">
          <h3>Avg Rating</h3>
          <p class="stat-number">${avgRating}</p>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Upcoming Interviews Card -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Upcoming Interviews</h2>
        </div>
        <div class="interview-list" style="padding: 20px;">
           ${renderInterviewList(upcomingInterviews)}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; font-size: 18px;">Quick Actions</h2>
        </div>
        <div class="quick-actions" style="padding: 20px;">
          <a href="./companies.html" class="action-card">
            <div class="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <div class="action-info">
              <h4>Browse Companies</h4>
              <p>Explore open positions</p>
            </div>
          </a>
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

  contentDiv.innerHTML = html
}

/**
 * Render interview list items
 */
function renderInterviewList(interviews) {
  if (!interviews || interviews.length === 0) {
    return '<p class="text-muted">No upcoming interviews scheduled.</p>'
  }

  // Filter only Scheduled/In Progress? 
  // Static dashboard had separate sections? No, it had "Upcoming Interviews" list.
  // We'll show all active ones.
  const activeInterviews = interviews.filter(i => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status));

  if (activeInterviews.length === 0) {
    return '<p class="text-muted">No upcoming interviews scheduled.</p>'
  }

  return activeInterviews.map(createInterviewItem).join('')
}

/**
 * Create HTML for a single interview item
 */
function createInterviewItem(interview) {
  const dateStr = interview.scheduledDate || 'TBD';
  const timeStr = interview.scheduledTime || '';
  const dateTime = formatDateTime(interview.scheduledDate, interview.scheduledTime);
  return `
    <div class="interview-item">
      <div class="interview-info">
        <h4>${interview.title || 'Technical Interview'}</h4>
        <p>with ${interview.interviewer?.fullName || 'Interviewer'}</p>
        <div class="interview-meta">
          <span class="badge badge-blue">${interview.interviewRound || 'General'}</span>
          <span>${dateTime}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="joinInterview(${interview.id}, '${interview.meetingLink}')">Join</button>
    </div>
  `
}

/**
 * Join interview call
 */
async function joinInterview(interviewId, meetingLink) {
  try {
    console.log(`Joining interview ${interviewId}`)
    await api.startInterview(interviewId)
    window.location.href = `../../interview-screen/lobby.html?room=${encodeURIComponent(meetingLink)}&role=candidate`
  } catch (error) {
    alert(`Failed to join interview: ${error.message}`)
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
    window.location.href = '../../login/login.html'
  }
}

// Expose functions
window.joinInterview = joinInterview
window.logout = logout

// Initialize
document.addEventListener('DOMContentLoaded', initializeDashboard)
