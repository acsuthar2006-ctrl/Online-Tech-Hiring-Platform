import { api } from '../../common/api.js';

const companyId = sessionStorage.getItem('companyId');

async function loadDashboard() {
  // Set admin name
  const userInfo = api.getUserInfo();
  if (userInfo) {
    const usernameEl = document.getElementById('adminUsername');
    const nameEl = document.getElementById('adminName');
    if (usernameEl) usernameEl.textContent = userInfo.fullName || 'Admin';
    if (nameEl) nameEl.textContent = userInfo.fullName || 'Admin';
  }

  if (!companyId) return;

  try {
    const stats = await api.getCompanyDashboard(companyId);
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
      statValues[0].textContent = stats.totalInterviews;
      statValues[1].textContent = stats.activeCandidates;
      statValues[2].textContent = stats.hiredInterviewers;
      statValues[3].textContent = stats.openPositions;
    }
    // Update stat labels
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels.length >= 4) {
      statLabels[3].textContent = 'Open Positions';
    }
    // Clear stat-change texts to hide hardcoded % changes
    document.querySelectorAll('.stat-change').forEach(el => el.textContent = '');
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }

  // Load recent interviews
  try {
    const interviews = await api.getCompanyInterviews(companyId);
    const activitiesList = document.querySelector('.activities-list');
    if (!activitiesList) return;
    activitiesList.innerHTML = '';
    if (interviews.length === 0) {
      activitiesList.innerHTML = '<p class="text-muted" style="padding:16px;">No interview activities yet.</p>';
      return;
    }
    const recent = interviews.slice(0, 5);
    recent.forEach(iv => {
      const statusColors = {
        SCHEDULED: { bg: 'var(--blue-100)', color: 'var(--blue-800)', label: 'Upcoming' },
        IN_PROGRESS: { bg: '#fef3c7', color: '#92400e', label: 'In Progress' },
        COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
        CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' }
      };
      const sc = statusColors[iv.status] || { bg: 'var(--blue-100)', color: 'var(--blue-800)', label: iv.status };
      const dateStr = iv.scheduledDate ? new Date(iv.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';
      const timeStr = iv.scheduledTime ? iv.scheduledTime.substring(0, 5) : '';
      activitiesList.insertAdjacentHTML('beforeend', `
        <div class="activity-item">
          <div class="activity-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" fill="currentColor"/>
            </svg>
          </div>
          <div class="activity-details">
            <h4>${iv.candidateName || 'Unknown'} - ${iv.title || iv.interviewRound || ''}</h4>
            <p>${dateStr}${timeStr ? ' at ' + timeStr : ''} &bull; Interviewer: ${iv.interviewerName || 'N/A'}</p>
          </div>
          <span class="badge" style="background: ${sc.bg}; color: ${sc.color};">${sc.label}</span>
        </div>
      `);
    });
  } catch (err) {
    console.error('Error loading recent interviews:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
