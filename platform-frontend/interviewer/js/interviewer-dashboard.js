/* Interviewer Dashboard */

import { api } from '../../common/api.js'
import {
  formatDateTime,
  createLoadingState,
  createErrorState,
  createEmptyState
} from '../../common/dashboard-utils.js'

// Global state
let interviewerProfile = null
let scheduledInterviews = []
let hiringCompanies = []

// Initialize dashboard on page load

async function initializeDashboard() {
  try {
    // Show loading state
    const contentDiv = document.getElementById('dashboard-content')
    if (contentDiv) {
      contentDiv.innerHTML = createLoadingState()
    }

    // Load interviewer profile
    interviewerProfile = await api.getUserProfile()
    console.log('Interviewer profile loaded:', interviewerProfile)

    // Load interviews where this interviewer is assigned
    scheduledInterviews = await api.getUpcomingInterviewsForInterviewer(interviewerProfile.email)
    console.log('Scheduled interviews loaded:', scheduledInterviews)

    // Load hiring companies
    try {
      hiringCompanies = await api.getAllCompanies()
      console.log('Companies loaded:', hiringCompanies)
    } catch (e) {
      console.warn('Failed to load companies:', e)
      hiringCompanies = []
    }

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

function renderDashboard() {
  const contentDiv = document.getElementById('dashboard-content')
  if (!contentDiv) {
    return
  }

  // Calculate Stats
  const todayCount = scheduledInterviews.length
  const completedCount = interviewerProfile.totalInterviewsConducted || 0

  // Derive active companies from scheduled interviews
  const companySet = new Set(scheduledInterviews.map(i => i.companyName).filter(Boolean))
  const activeCompanies = interviewerProfile.activeCompanies || companySet.size
  const totalEarnings = interviewerProfile.totalEarnings ? `$${interviewerProfile.totalEarnings}` : '$0'


  const html = `
    <!-- Header -->
    <div class="header" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
      <div class="header-left">
        <h1>Welcome, <span id="userName">${interviewerProfile.fullName}</span>!</h1>
        <p class="text-muted">Manage your interviews and explore opportunities</p>
      </div>
      <div class="header-right">
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
          <h3>Upcoming Interviews</h3>
          <p class="stat-number">${todayCount}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div class="stat-info">
          <h3>Completed (Mock)</h3>
          <p class="stat-number">${completedCount}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4"></path></svg>
        </div>
        <div class="stat-info">
          <h3>Active Companies</h3>
          <p class="stat-number">${activeCompanies}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="stat-info">
          <h3>Total Earnings</h3>
          <p class="stat-number">${totalEarnings}</p>
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="content-grid">
      <!-- Schedule List -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Interview Schedule</h2>
        </div>
        <div class="schedule-list" style="padding: 20px;">
           ${renderScheduleList(scheduledInterviews)}
        </div>
      </div>

     <!-- Companies Hiring (Static Placeholder to match look) -->
      <div class="card" style="background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
        <div class="card-header" style="background: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 18px;">Companies Hiring Interviewers</h2>
        </div>
        <div class="company-list" style="padding: 20px;">
           ${renderCompanyList(hiringCompanies)}
        </div>
      </div>
    </div>
  `;

  contentDiv.innerHTML = html
}

function renderCompanyList(companies) {
  if (!companies || companies.length === 0) {
    return '<p class="text-muted">No hiring companies found at the moment.</p>'
  }

  return companies.map(company => `
    <div class="company-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; margin-bottom: 10px;">
      <div class="company-info">
        <h4 style="margin: 0 0 5px 0; font-size: 16px;">${company.name}</h4>
        <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">${company.industry || 'Technology'}</p>
        <div class="company-meta" style="font-size: 13px; color: #1d4ed8;">
          <span>${company.location || 'Remote'}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="alert('Applications for ${company.name} coming soon!')">View</button>
    </div>
  `).join('')
}

function renderScheduleList(interviews) {
  if (!interviews || interviews.length === 0) {
    return '<p class="text-muted">No interviews scheduled.</p>'
  }

  return interviews.map(createScheduleItem).join('')
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
    return `<button class="btn btn-outline btn-sm" disabled>Completed</button>`;
  }
  return '';
}

// Join/Start interview call

async function joinInterview(interviewId, meetingLink) {
  try {
    console.log(`Joining interview ${interviewId} with meeting link: ${meetingLink}`)
    await api.startInterview(interviewId)
    window.location.href = `../../interview-screen/lobby.html?room=${encodeURIComponent(meetingLink)}&role=interviewer`
  } catch (error) {
    alert(`Failed to join interview: ${error.message}`)
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
    window.location.href = '../../login/login.html'
  }
}

window.joinInterview = joinInterview
window.logout = logout

document.addEventListener('DOMContentLoaded', initializeDashboard)
