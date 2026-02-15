import { api } from '../../common/api.js';

import { createErrorState, createEmptyState, formatDateTime } from '../../common/dashboard-utils.js';

let allInterviews = [];

document.addEventListener("DOMContentLoaded", async () => {
  const userInfo = api.getUserInfo();
  if (!userInfo) {
      window.location.href = '/login/login.html';
      return;
  }

  // Update headers
  const userNameElements = document.querySelectorAll("#userName, #profileName");
  userNameElements.forEach((element) => {
    element.textContent = userInfo.fullName;
  });

  await loadSchedule();

  setupFilters();
});

async function loadSchedule() {
    try {
        const userInfo = api.getUserInfo();
        allInterviews = await api.getUpcomingInterviews(userInfo.email);
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
}

function renderSchedule(filterType) {
    const videoList = document.getElementById('videoInterviewList');
    const technicalList = document.getElementById('technicalInterviewList');
    const completedList = document.getElementById('completedInterviewList');
    
    // Counts
    const videoCount = document.getElementById('videoCount');
    const technicalCount = document.getElementById('technicalCount');
    const completedCount = document.getElementById('completedCount');

    // Filter Logic
    const completed = allInterviews.filter(i => ['COMPLETED', 'CANCELLED'].includes(i.status));
    
    // Upcoming: Split into Video vs Technical based on type
    const upcoming = allInterviews.filter(i => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status));
    
    const technical = upcoming.filter(i => 
        i.interviewType === 'TECHNICAL' || 
        i.interviewType === 'SYSTEM_DESIGN' || 
        i.interviewType === 'CODING'
    );
    
    const video = upcoming.filter(i => !technical.includes(i));

    // Render Lists
    if (videoList) videoList.innerHTML = renderInterviewList(video);
    if (technicalList) technicalList.innerHTML = renderInterviewList(technical);
    if (completedList) completedList.innerHTML = renderInterviewList(completed);

    // Update Counts
    if (videoCount) videoCount.innerText = video.length;
    if (technicalCount) technicalCount.innerText = technical.length;
    if (completedCount) completedCount.innerText = completed.length;

    // Handle Section Visibility
    const videoSection = document.getElementById('videoSection');
    const technicalSection = document.getElementById('technicalSection');
    const completedSection = document.getElementById('completedSection');

    if (filterType === 'all') {
        if(videoSection) videoSection.style.display = 'block';
        if(technicalSection) technicalSection.style.display = 'block';
        if(completedSection) completedSection.style.display = 'block';
    } else if (filterType === 'upcoming') {
        if(videoSection) videoSection.style.display = 'block';
        if(technicalSection) technicalSection.style.display = 'block';
        if(completedSection) completedSection.style.display = 'none';
    } else if (filterType === 'completed') {
        if(videoSection) videoSection.style.display = 'none';
        if(technicalSection) technicalSection.style.display = 'none';
        if(completedSection) completedSection.style.display = 'block';
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
        
        // Time range (mock end time +1h for now)
        const startTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endDateObj = new Date(dateObj.getTime() + 60*60000);
        const endTime = endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const isJoinable = ['SCHEDULED', 'IN_PROGRESS'].includes(interview.status);
        const statusClass = interview.status === 'COMPLETED' ? 'status-completed' : 'status-upcoming';
        
        return `
          <div class="timeline-item">
            <div class="timeline-date">
              <div class="date-badge">${month}</div>
              <div class="date-number">${day}</div>
            </div>
            <div class="interview-card">
              <div class="interview-header">
                <h3>${interview.title || 'Technical Interview'}</h3>
                <span class="status-badge ${statusClass}">${interview.status}</span>
              </div>
              <div class="interview-details">
                <p class="company-name">${interview.description || 'Tech Company'}</p>
                <div class="interview-info-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                  <span>${startTime} - ${endTime}</span>
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
                <button class="btn-secondary btn-sm" onclick="alert('Viewing Details...')">View Details</button>
                ${isJoinable ? `<button class="btn-primary btn-sm" onclick="joinInterview(${interview.id}, '${interview.meetingLink}')">Join Interview</button>` : ''}
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
// Notification button
const notificationBtn = document.getElementById("notificationBtn");
if (notificationBtn) {
notificationBtn.addEventListener("click", () => {
    alert("No new notifications");
});
}
