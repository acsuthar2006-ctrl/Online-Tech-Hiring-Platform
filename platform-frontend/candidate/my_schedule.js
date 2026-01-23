// Schedule page functionality

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "User";
  const userEmail = localStorage.getItem("userEmail"); // Ensure this is set during login!

  // Update username displays
  const userNameElements = document.querySelectorAll("#userName, #profileName");
  userNameElements.forEach((element) => {
    element.textContent = username;
  });

  if (userEmail) {
    fetchSchedule(userEmail);
  } else {
    console.warn("No user email found in localStorage");
  }

  async function fetchSchedule(email) {
    try {
      // Clear static lists
      const videoList = document.getElementById("videoInterviewList");
      if (videoList) videoList.innerHTML = '<p>Loading...</p>';

      const res = await fetch(`/api/interviews/candidate/upcoming?email=${encodeURIComponent(email)}`);
      const interviews = await res.json();

      if (videoList) videoList.innerHTML = '';

      document.getElementById('videoCount').textContent = interviews.length;

      if (interviews.length === 0) {
        if (videoList) videoList.innerHTML = '<p>No upcoming interviews.</p>';
        return;
      }

      interviews.forEach(interview => {
        const date = new Date(interview.scheduledTime);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });

        const html = `
              <div class="timeline-item">
                <div class="timeline-date">
                  <div class="date-badge">${month}</div>
                  <div class="date-number">${day}</div>
                </div>
                <div class="interview-card">
                  <div class="interview-header">
                    <h3>${interview.title}</h3>
                    <span class="status-badge status-upcoming">${interview.status}</span>
                  </div>
                  <div class="interview-details">
                    <p class="company-name">${interview.interviewer ? interview.interviewer.companyName : 'Tech Company'}</p>
                    <div class="interview-info-row">
                      <span>${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="interview-info-row">
                      <span>Video Interview</span>
                    </div>
                  </div>
                  <div class="interview-actions">
                    <a href="/?room=${interview.meetingLink}&role=candidate" class="btn-primary btn-sm" style="text-decoration:none;">Join Interview</a>
                  </div>
                </div>
              </div>`;

        if (videoList) videoList.insertAdjacentHTML('beforeend', html);
      });

    } catch (e) {
      console.error("Error fetching schedule", e);
    }
  }

  // Filter Buttons Logic (Visual only for now if we only fetch upcoming)
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      // TODO: client side filter or different API calls
    });
  });
});
