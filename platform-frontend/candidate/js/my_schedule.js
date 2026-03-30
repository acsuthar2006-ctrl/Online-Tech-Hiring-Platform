import { api } from '../../common/api.js';
import { getMediaBase } from '../../common/media-config.js';

import { createErrorState, createEmptyState, formatDateTime } from '../../common/dashboard-utils.js';
import { initNotifications } from '../../common/notifications.js';

let allInterviews = [];
let currentPositionFilter = 'all';

function formatTimeLabelFromTimeString(timeStr) {
  try {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    if (hours == null || minutes == null) return null;
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return null;
  }
}

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

function formatDurationFromDateTimes(startStr, endStr) {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours <= 0) return `${mins}m`;
    if (mins <= 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const userInfo = api.getUserInfo();
  if (!userInfo) {
    window.location.href = '../../login/login.html';
    return;
  }

  // Update headers
  const userNameElements = document.querySelectorAll("#userName, #profileName");
  userNameElements.forEach((element) => {
    element.textContent = userInfo.fullName;
  });

  await loadSchedule();

  setupFilters();
  await initNotifications();
});

async function loadSchedule() {
  try {
    const userInfo = api.getUserInfo();
    let interviews = await api.getUpcomingInterviews(userInfo.email);

    allInterviews = interviews;

    // Populate position filter
    const positionFilter = document.getElementById('positionFilter');
    if (positionFilter) {
      const titles = [...new Set((interviews || []).map(i => i.positionTitle).filter(Boolean))];
      positionFilter.innerHTML = `<option value="all">All Positions</option>` +
        titles.map(t => `<option value="${t}">${t}</option>`).join('');
    }

    renderSchedule('all');
  } catch (error) {
    console.error("Failed to load schedule", error);
  }
}

function setupFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filterType = btn.getAttribute("data-filter");
      renderSchedule(filterType);
    });
  });

  const positionFilter = document.getElementById('positionFilter');
  if (positionFilter) {
    positionFilter.addEventListener('change', () => {
      currentPositionFilter = positionFilter.value || 'all';
      const activeBtn = document.querySelector('.filter-btn.active');
      renderSchedule(activeBtn?.getAttribute('data-filter') || 'all');
    });
  }
}

function renderSchedule(filterType) {
  const upcomingList = document.getElementById('upcomingInterviewList');
  const completedList = document.getElementById('completedInterviewList');

  // Counts
  const upcomingCount = document.getElementById('upcomingCount');
  const completedCount = document.getElementById('completedCount');

  // Filter Logic
  let completed = allInterviews.filter(i => ['COMPLETED', 'CANCELLED'].includes(i.status));
  let upcoming = allInterviews.filter(i => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status));

  // Apply position filter
  if (currentPositionFilter !== 'all') {
    completed = completed.filter(i => i.positionTitle === currentPositionFilter);
    upcoming = upcoming.filter(i => i.positionTitle === currentPositionFilter);
  }

  // Render Lists
  if (upcomingList) upcomingList.innerHTML = renderInterviewList(upcoming);
  if (completedList) completedList.innerHTML = renderInterviewList(completed);

  // Update Counts
  if (upcomingCount) upcomingCount.innerText = upcoming.length;
  if (completedCount) completedCount.innerText = completed.length;

  // Handle Section Visibility
  const upcomingSection = document.getElementById('upcomingSection');
  const completedSection = document.getElementById('completedSection');

  if (filterType === 'all') {
    if (upcomingSection) upcomingSection.style.display = 'block';
    if (completedSection) completedSection.style.display = 'block';
  } else if (filterType === 'upcoming') {
    if (upcomingSection) upcomingSection.style.display = 'block';
    if (completedSection) completedSection.style.display = 'none';
  } else if (filterType === 'completed') {
    if (upcomingSection) upcomingSection.style.display = 'none';
    if (completedSection) completedSection.style.display = 'block';
  }
}

function renderInterviewList(interviews) {
  if (!interviews || interviews.length === 0) {
    return `
        <div class="empty-state">
            <svg class="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3>No interviews scheduled</h3>
            <p>You don't have any interviews in this category yet. Check your dashboard for new invitations.</p>
        </div>
        `;
  }
  return interviews.map(interview => {
    // Parse date for badge
    // dateTime string format typically "YYYY-MM-DD" + "HH:mm:ss"
    const dateObj = new Date(interview.scheduledDate + 'T' + interview.scheduledTime);
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const day = dateObj.getDate().toString().padStart(2, '0');

    const scheduledStartLabel = formatTimeLabelFromTimeString(interview.scheduledTime)
      || dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    let timeLabel = scheduledStartLabel;
    if (interview.status === 'COMPLETED') {
      const actualStartLabel = formatTimeLabelFromDateTime(interview.actualStartTime);
      const actualEndLabel = formatTimeLabelFromDateTime(interview.actualEndTime);
      const durationLabel = (interview.actualStartTime && interview.actualEndTime)
        ? formatDurationFromDateTimes(interview.actualStartTime, interview.actualEndTime)
        : null;
      if (actualStartLabel && actualEndLabel) {
        timeLabel = `${actualStartLabel} - ${actualEndLabel}${durationLabel ? ` (${durationLabel})` : ''}`;
      }
    }

    const isJoinable = ['SCHEDULED', 'IN_PROGRESS'].includes(interview.status);
    const statusClass = interview.status === 'COMPLETED' ? 'status-completed' : 'status-upcoming';

    let outcomeHtml = '';
    if (interview.status === 'COMPLETED' && interview.candidateOutcome && interview.candidateOutcome !== 'PENDING') {
      let outcomeClass = interview.candidateOutcome === 'ACCEPTED' ? 'status-completed' : 'status-upcoming'; // reusing existing colors or generic
      let bgClass = interview.candidateOutcome === 'ACCEPTED' ? 'background:#dcfce7;color:#166534' : 'background:#fee2e2;color:#991b1b';
      outcomeHtml = `<span class="status-badge" style="margin-left: 8px; border:1px solid currentColor; ${bgClass}">${interview.candidateOutcome}</span>`;
    }

    return `
          <div class="timeline-item">
            <div class="timeline-date">
              <div class="date-badge">${month}</div>
              <div class="date-number">${day}</div>
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
                <p class="company-name">${interview.description || 'Tech Company'}</p>
                <div class="interview-info-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                  <span>${timeLabel}</span>
                </div>
                <div class="interview-info-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 7L16 12L23 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                      stroke-linejoin="round" />
                    <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>${interview.interviewType || 'Video Interview'}</span>
                </div>
              </div>
              <div class="interview-actions">
                ${isJoinable ? `<button class="btn-primary btn-sm" onclick="joinInterview(${interview.id}, '${interview.meetingLink}')">Join Interview</button>` : ''}
                ${interview.status === 'COMPLETED' && interview.recordingUrl
        ? (() => {
            const fileUrl = `/recordings/${interview.recordingUrl}`;
            return `<button class="btn btn-primary btn-sm force-download-btn" style="margin-left: 5px;" data-url="${fileUrl}" data-filename="${interview.recordingUrl}">Download Recording</button>`;
          })()
        : ''}
              </div>
            </div>
          </div>
        `;
  }).join('');
}

async function joinInterview(interviewId, meetingLink) {
  try {
    console.log(`Joining interview ${interviewId}`);
    // await api.startInterview(interviewId); // Candidate doesn't start it, they just join

    const userInfo = api.getUserInfo();
    const email = userInfo ? userInfo.email : '';

    window.location.href = `../../interview-screen/video-interview.html?room=${encodeURIComponent(meetingLink)}&role=candidate&email=${encodeURIComponent(email)}`;
  } catch (error) {
    alert(`Failed to join interview: ${error.message}`);
  }
}

window.joinInterview = joinInterview;

// Global click handler for forcing downloads
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("force-download-btn")) {
    e.preventDefault();
    const btn = e.target;
    const originalText = btn.innerText;
    
    try {
      btn.innerText = "Downloading...";
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
      alert("Download failed. Please try again later.");
    } finally {
      btn.innerText = originalText;
    }
  }
});
