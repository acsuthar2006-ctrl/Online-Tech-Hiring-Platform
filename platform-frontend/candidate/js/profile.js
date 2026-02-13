import { api } from '../../common/api.js';

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
});

async function loadProfile() {
  try {
    const [profile, interviews] = await Promise.all([
      api.getUserProfile(),
      api.getUpcomingInterviews(localStorage.getItem('userEmail'))
    ]);

    if (profile) {
      // Update Header Card
      const profileUsernameElement = document.getElementById("profileUsername");
      if (profileUsernameElement) profileUsernameElement.textContent = profile.fullName;

      // Populate Personal Information
      const fullNameInput = document.getElementById("fullName");
      const emailInput = document.getElementById("email");
      const phoneInput = document.getElementById("phone");

      if (fullNameInput) fullNameInput.value = profile.fullName || '';
      if (emailInput) emailInput.value = profile.email || '';
      if (phoneInput) phoneInput.value = profile.phone || ''; // Note: DTO might need update but we'll try

      // Update Statistics
      // Backend fields from Candidate entity: totalInterviewsAttended (completed), averageRating
      const totalInterviews = (profile.totalInterviewsAttended || 0) + interviews.length;
      const completedInterviews = profile.totalInterviewsAttended || 0;
      const pendingInterviews = interviews.length;

      updateStat('Total Interviews', totalInterviews);
      updateStat('Completed', completedInterviews);
      updateStat('Pending', pendingInterviews);
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

function updateStat(label, value) {
  const statsList = document.querySelector('.stats-list');
  if (!statsList) return;

  const statItems = statsList.querySelectorAll('.stat-item');
  statItems.forEach(item => {
    const itemLabel = item.querySelector('span:not(.stat-number):not(.stat-dot)').textContent;
    if (itemLabel.trim() === label) {
      item.querySelector('.stat-number').textContent = value;
    }
  });
}

// Keep the save listeners as placeholders since backend endpoints are missing
document.querySelectorAll('.form-input').forEach(input => {
  input.addEventListener('change', (e) => {
    console.log(`Field ${e.target.id} changed to ${e.target.value}. Update API missing on main branch.`);
  });
});
