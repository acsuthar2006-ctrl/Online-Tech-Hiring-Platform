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
    // Group into sections: Upcoming, Completed
    const upcoming = allInterviews.filter(i => ['SCHEDULED', 'IN_PROGRESS'].includes(i.status));
    const completed = allInterviews.filter(i => ['COMPLETED', 'CANCELLED'].includes(i.status));

    const sections = document.querySelectorAll(".schedule-section");
    // Assuming: 
    // Section 0: Today (We can merge into Upcoming for now)
    // Section 1: Upcoming
    // Section 2: Completed

    if (sections.length >= 2) {
        // Today/Upcoming
        const upcomingList = sections[1].querySelector('.interview-list') || sections[1];
        if (upcomingList) upcomingList.innerHTML = renderInterviewList(upcoming);
        
        // Completed
        if (sections[2]) {
             const completedList = sections[2].querySelector('.interview-list') || sections[2];
             completedList.innerHTML = renderInterviewList(completed);
        }
    }

    sections.forEach((section, index) => {
      if (filterType === "all") {
        section.style.display = "block";
      } else if (filterType === "upcoming" && index < 2) {
        section.style.display = "block";
      } else if (filterType === "completed" && index === 2) {
        section.style.display = "block";
      } else {
        section.style.display = "none";
      }
    });
}

function renderInterviewList(interviews) {
    if (!interviews || interviews.length === 0) {
        return '<p class="text-muted">No interviews found.</p>';
    }
    return interviews.map(interview => {
        const dateTime = formatDateTime(interview.scheduledDate, interview.scheduledTime);
        const isJoinable = ['SCHEDULED', 'IN_PROGRESS'].includes(interview.status);
        
        return `
        <div class="interview-card">
              <div class="card-header-row">
                <span class="badge badge-purple">${interview.interviewRound || 'Interview'}</span>
                <span class="date">${dateTime}</span>
              </div>
              <h3>${interview.title || 'Technical Interview'}</h3>
              <p class="company">${interview.interviewer?.fullName || 'Interviewer'}</p>
              <div class="card-actions">
                ${isJoinable ? `<button class="btn btn-primary" onclick="joinInterview(${interview.id}, '${interview.meetingLink}')">Join Call</button>` : ''}
                <button class="btn btn-secondary">View Details</button>
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
