import { api } from '../../common/api.js';
import { createErrorState, createEmptyState } from '../../common/dashboard-utils.js';

document.addEventListener("DOMContentLoaded", () => {
  initializeSchedule();
});

async function initializeSchedule() {
  const userEmail = localStorage.getItem("userEmail");
  const videoList = document.getElementById("videoInterviewList");
  const technicalList = document.getElementById("technicalInterviewList");
  const completedList = document.getElementById("completedInterviewList");

  if (!userEmail) {
    window.location.href = '../../login/login.html';
    return;
  }

  try {
    const interviews = await api.getUpcomingInterviews(userEmail);

    // Update counts
    const videoInterviews = interviews.filter(i => i.interviewType === 'VIDEO' || i.title.toLowerCase().includes('interview'));
    const technicalInterviews = interviews.filter(i => i.interviewType === 'TECHNICAL' || i.title.toLowerCase().includes('round') || i.title.toLowerCase().includes('coding'));

    // Since we don't have a completed endpoint, we'll just show what we have
    const completedInterviews = interviews.filter(i => i.status === 'COMPLETED');

    document.getElementById("videoCount").textContent = videoInterviews.length;
    document.getElementById("technicalCount").textContent = technicalInterviews.length;
    document.getElementById("completedCount").textContent = completedInterviews.length;

    renderInterviewList(videoList, videoInterviews, 'No video interviews scheduled.');
    renderInterviewList(technicalList, technicalInterviews, 'No technical rounds scheduled.');
    renderInterviewList(completedList, completedInterviews, 'No completed interviews found.');

    setupFilters();
  } catch (error) {
    console.error('Failed to load schedule:', error);
    const errorHtml = createErrorState('Failed to load your schedule. Please try again.');
    videoList.innerHTML = errorHtml;
    technicalList.innerHTML = errorHtml;
    completedList.innerHTML = errorHtml;
  }
}

function renderInterviewList(container, interviews, emptyMessage) {
  if (!interviews || interviews.length === 0) {
    container.innerHTML = createEmptyState(emptyMessage);
    return;
  }

  container.innerHTML = interviews.map(i => {
    const date = new Date(i.scheduledDate);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });

    // Format time
    const timeStr = i.scheduledTime ? i.scheduledTime.substring(0, 5) : 'TBD';

    return `
            <div class="timeline-item">
                <div class="timeline-date">
                    <div class="date-badge">${month}</div>
                    <div class="date-number">${day}</div>
                </div>
                <div class="interview-card">
                    <div class="interview-header">
                        <h3>${i.title}</h3>
                        <span class="status-badge status-${i.status.toLowerCase()}">${i.status}</span>
                    </div>
                    <div class="interview-details">
                        <p class="company-name">${i.interviewer?.fullName || 'Interviewer'} | TechHiring</p>
                        <div class="interview-info-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 6V12L16 14"/>
                            </svg>
                            <span>${timeStr}</span>
                        </div>
                        <div class="interview-info-row">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 7L16 12L23 17V7Z"/>
                                <rect x="1" y="5" width="15" height="14" rx="2"/>
                            </svg>
                            <span>${i.interviewType || 'Video Interview'}</span>
                        </div>
                    </div>
                    <div class="interview-actions">
                        <button class="btn-secondary btn-sm" onclick="viewDetails(${i.id})">View Details</button>
                        ${i.status === 'SCHEDULED' ? `
                            <button class="btn-primary btn-sm" onclick="joinInterview('${i.meetingLink}')">Join Interview</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
  }).join('');
}

function setupFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filterType = btn.getAttribute("data-filter");

      const sections = document.querySelectorAll(".schedule-section");
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
    });
  });
}

window.joinInterview = (room) => {
  const email = localStorage.getItem("userEmail");
  window.location.href = `waiting.html?room=${room}&email=${email}`;
};

window.viewDetails = (id) => {
  alert(`Viewing details for interview ID: ${id}`);
};
