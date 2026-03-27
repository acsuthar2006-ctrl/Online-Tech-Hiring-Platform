import { api } from '../../common/api.js';
import { getMediaBase } from '../../common/media-config.js';
import { createErrorState, createEmptyState, formatDate, formatTime } from '../../common/dashboard-utils.js';
import { initNotifications } from '../../common/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeSchedule();
});

window.markOutcome = async (interviewId, outcome) => {
  if (!confirm(`Mark this candidate as ${outcome}?`)) return;
  try {
    await api.updateInterviewOutcome(interviewId, outcome);
    await initializeSchedule();
    await initNotifications();
  } catch (e) {
    alert('Failed to update candidate outcome: ' + (e.message || e));
  }
};

async function initializeSchedule() {
  const container = document.getElementById('scheduleContainer');
  const profileName = document.getElementById('profileName');

  try {
    const profile = await api.getUserProfile();
    if (profile) {
      profileName.textContent = profile.fullName;
      const interviews = await api.getUpcomingInterviewsForInterviewer(profile.email);
      renderSchedule(interviews);
      await initNotifications();
    } else {
      throw new Error('Profile not found');
    }
  } catch (error) {
    console.error('Failed to load schedule:', error);
    container.innerHTML = createErrorState('Failed to load your schedule. Please try again later.');
  }
}

function renderSchedule(interviews) {
  const container = document.getElementById('scheduleContainer');
  const loadingState = container.querySelector('.loading-state');
  if (loadingState) loadingState.remove();

  if (!interviews || interviews.length === 0) {
    container.innerHTML = createEmptyState('You have no interviews scheduled at the moment.');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayInterviews = [];
  const weekInterviews = [];
  const completedInterviews = [];

  interviews.forEach(interview => {
    // Fix: Combine date and time for proper parsing
    const dateTimeStr = `${interview.scheduledDate}T${interview.scheduledTime}`;
    const interviewDate = new Date(dateTimeStr);
    
    // Create a date-only object for comparison
    const interviewDateOnly = new Date(interviewDate);
    interviewDateOnly.setHours(0, 0, 0, 0);

    if (interview.status === 'COMPLETED') {
      completedInterviews.push(interview);
    } else if (interview.status === 'SCHEDULED' || interview.status === 'IN_PROGRESS') {
      const hasValidDate = !Number.isNaN(interviewDateOnly.getTime());
      if (!hasValidDate) return;
      if (interviewDateOnly.getTime() === today.getTime()) {
        todayInterviews.push(interview);
      } else if (interviewDateOnly > today) {
        weekInterviews.push(interview);
      }
    }
  });

  updateSection('today', todayInterviews);
  updateSection('week', weekInterviews);
  updateSection('completed', completedInterviews);



  setupFilters();
}

function updateSection(id, interviews) {
  const section = document.getElementById(`${id}Section`);
  const timeline = document.getElementById(`${id}Timeline`);
  const count = document.getElementById(`${id}Count`);

  if (interviews.length > 0) {
    section.style.display = 'block';
    count.textContent = interviews.length;
    timeline.innerHTML = interviews.map(interview => renderTimelineItem(interview, id)).join('');
  } else {
    section.style.display = 'none';
  }
}

function renderTimelineItem(interview, sectionId) {
  const dateTimeStr = `${interview.scheduledDate}T${interview.scheduledTime}`;
  const date = new Date(dateTimeStr);
  const isCompleted = interview.status === 'COMPLETED';
  const statusClass = isCompleted ? 'status-completed' : 'status-upcoming';
  const monthLabel = formatDate(date, { month: 'short' });
  const dayLabel = formatDate(date, { day: '2-digit' });
  const timeLabel = formatTime(date);
  let outcomeHtml = '';
  if (isCompleted && interview.candidateOutcome && interview.candidateOutcome !== 'PENDING') {
    const isAccepted = interview.candidateOutcome === 'ACCEPTED';
    const bg = isAccepted ? 'background:#dcfce7;color:#166534' : 'background:#fee2e2;color:#991b1b';
    outcomeHtml = `<span class="status-badge" style="margin-left:8px; border:1px solid currentColor; ${bg}">${interview.candidateOutcome}</span>`;
  }

  let completedOutcomeActions = '';
  if (isCompleted) {
    if (!interview.candidateOutcome || interview.candidateOutcome === 'PENDING') {
      completedOutcomeActions = `
        <button class="btn btn-sm" style="background:#16a34a;color:white;margin-left:6px;" onclick="window.markOutcome(${interview.id}, 'ACCEPTED')">✓ Accept</button>
        <button class="btn btn-sm" style="background:#dc2626;color:white;margin-left:6px;" onclick="window.markOutcome(${interview.id}, 'REJECTED')">✕ Reject</button>
      `;
    }
  }

  return `
        <div class="timeline-item">
            <div class="timeline-date">
                <div class="date-badge">${sectionId === 'today' ? 'Today' : monthLabel}</div>
                <div class="date-number">${dayLabel}</div>
                <div class="date-time">${timeLabel}</div>
            </div>
            <div class="interview-card">
                <div class="interview-header">
                    <h3>${interview.title || 'Technical Interview'}</h3>
                    <div>
                      <span class="status-badge ${statusClass}">${interview.status}</span>
                      ${outcomeHtml}
                    </div>
                </div>
                <div class="interview-details">
                    <p class="company-name">${interview.description || 'Job Interview'}</p>
                    <div class="interview-info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>${interview.candidate ? interview.candidate.fullName : 'Candidate'}</span>
                    </div>
                    <div class="interview-info-row">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>${interview.interviewType || 'Video Interview'}</span>
                    </div>
                </div>
                <div class="interview-actions">
                    ${!isCompleted ? `<button class="btn-primary btn-sm" onclick="joinInterview('${interview.meetingLink}')">Join Interview</button>` : ''}
                    ${isCompleted ? completedOutcomeActions : ''}
                    ${isCompleted && interview.recordingUrl
                      ? (() => {
                          const mediaBase = getMediaBase();
                          const fileUrl = `${mediaBase}/recordings/${interview.recordingUrl}`;
                          return `<button class="btn btn-primary btn-sm force-download-btn" style="margin-left: 6px;" data-url="${fileUrl}" data-filename="${interview.recordingUrl}">Download Recording</button>`;
                        })()
                      : ''}
                </div>
            </div>
        </div>
    `;
}

function setupFilters() {
  const filters = document.querySelectorAll('.filter-btn');
  filters.forEach(btn => {
    btn.onclick = () => {
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      document.getElementById('todaySection').style.display = (filter === 'all' || filter === 'upcoming') && document.getElementById('todayCount').textContent !== '0' ? 'block' : 'none';
      document.getElementById('weekSection').style.display = (filter === 'all' || filter === 'upcoming') && document.getElementById('weekCount').textContent !== '0' ? 'block' : 'none';
      document.getElementById('completedSection').style.display = (filter === 'all' || filter === 'completed') && document.getElementById('completedCount').textContent !== '0' ? 'block' : 'none';
    };
  });
}

window.joinInterview = async (link) => {
  if (link) {
    try {
        const profile = await api.getUserProfile();
        const email = profile ? profile.email : '';
        window.location.href = `../../interview-screen/video-interview.html?room=${encodeURIComponent(link)}&role=interviewer&email=${encodeURIComponent(email)}`;
    } catch (e) {
        console.warn("Could not get profile for email param", e);
        window.location.href = `../../interview-screen/video-interview.html?room=${encodeURIComponent(link)}&role=interviewer`;
    }
  } else {
    alert('Meeting link not available.');
  }
};

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
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
});
