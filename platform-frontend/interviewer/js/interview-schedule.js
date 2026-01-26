// Interview Schedule Functionality
document.addEventListener('DOMContentLoaded', function () {
  checkAuthentication();
  initializeSchedulePage();
  loadUserData();
});

function checkAuthentication() {
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');

  if (!userRole || !username) {
    window.location.href = 'login.html';
  }

  if (userRole !== 'interviewer') {
    window.location.href = 'candidate-dashboard.html';
  }
}

function loadUserData() {
  const username = localStorage.getItem('username');
  const userElement = document.getElementById('username');

  if (userElement) {
    userElement.textContent = username || 'Interviewer';
  }
}

function initializeSchedulePage() {
  const filterButtons = document.querySelectorAll('.filter-btn');

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      filterButtons.forEach((b) => b.classList.remove('active'));
      this.classList.add('active');
      filterSchedule(this.dataset.filter);
    });
  });

  loadScheduleData();
}

function loadScheduleData() {
  const scheduleList = document.querySelector('.schedule-list');

  const mockSchedules = [
    {
      id: 1,
      candidate: 'John Doe',
      company: 'Tech Corp',
      type: 'Video Interview',
      time: '10:00 AM',
      date: 'Jan 20, 2025',
      duration: '45 mins',
      status: 'upcoming',
    },
    {
      id: 2,
      candidate: 'Jane Smith',
      company: 'Innovate Inc',
      type: 'Coding Round',
      time: '2:00 PM',
      date: 'Jan 21, 2025',
      duration: '60 mins',
      status: 'upcoming',
    },
    {
      id: 3,
      candidate: 'Mike Johnson',
      company: 'Tech Corp',
      type: 'Analytical Round',
      time: '3:30 PM',
      date: 'Jan 22, 2025',
      duration: '50 mins',
      status: 'upcoming',
    },
    {
      id: 4,
      candidate: 'Sarah Williams',
      company: 'Digital Solutions',
      type: 'Video Interview',
      time: '11:00 AM',
      date: 'Jan 19, 2025',
      duration: '45 mins',
      status: 'completed',
    },
  ];

  renderScheduleItems(mockSchedules);
}

function renderScheduleItems(items) {
  const scheduleList = document.querySelector('.schedule-list');
  scheduleList.innerHTML = '';

  if (items.length === 0) {
    scheduleList.innerHTML = `
      <div class="empty-state">
        <p>No interviews scheduled yet</p>
      </div>
    `;
    return;
  }

  items.forEach((item) => {
    const scheduleHTML = `
      <div class="schedule-item" data-status="${item.status}">
        <div class="schedule-time">
          <div class="time-badge">${item.time}</div>
          <div class="date-badge">${item.date}</div>
        </div>
        <div class="schedule-content">
          <h3 class="schedule-title">${item.candidate}</h3>
          <div class="schedule-meta">
            <div class="meta-item">
              <strong>Company:</strong> ${item.company}
            </div>
            <div class="meta-item">
              <strong>Type:</strong> ${item.type}
            </div>
            <div class="meta-item">
              <strong>Duration:</strong> ${item.duration}
            </div>
          </div>
          <span class="schedule-status ${item.status}">${item.status === 'upcoming' ? 'Upcoming' : 'Completed'}</span>
        </div>
        <div class="schedule-actions">
          ${
            item.status === 'upcoming'
              ? `
            <button class="action-btn" onclick="startInterview(${item.id})">Start Interview</button>
            <button class="action-btn secondary" onclick="reschedule(${item.id})">Reschedule</button>
          `
              : `
            <button class="action-btn secondary" onclick="viewDetails(${item.id})">View Details</button>
          `
          }
        </div>
      </div>
    `;
    scheduleList.innerHTML += scheduleHTML;
  });
}

function filterSchedule(filter) {
  const items = document.querySelectorAll('.schedule-item');

  items.forEach((item) => {
    if (filter === 'all') {
      item.style.display = 'flex';
    } else if (filter === item.dataset.status) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function filterSchedule(filterType) {
    const sections = document.querySelectorAll(".schedule-section")

    sections.forEach((section, index) => {
      if (filterType === "all") {
        section.style.display = "block"
      } else if (filterType === "upcoming" && index < 2) {
        section.style.display = "block"
      } else if (filterType === "completed" && index === 2) {
        section.style.display = "block"
      } else {
        section.style.display = "none"
      }
    })
  }

function startInterview(id) {
  alert(`Starting interview ${id}`);
  // Redirect to video interview page
  // window.location.href = 'video-interview.html?id=' + id;
}

function reschedule(id) {
  alert(`Rescheduling interview ${id}`);
  // Open reschedule modal or page
}

function viewDetails(id) {
  alert(`Viewing details for interview ${id}`);
  // Open details modal or page
}

// Logout functionality
function logout() {
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
  window.location.href = 'login.html';
}
