import { api } from '../../common/api.js';

const companyId = sessionStorage.getItem('companyId');
let allInterviews = [];
let currentFilter = 'all';

// ===== STATUS HELPERS =====
function statusBadge(status) {
  const map = {
    SCHEDULED: { bg: 'var(--blue-100)', color: 'var(--blue-800)', label: 'Upcoming' },
    IN_PROGRESS: { bg: '#fef3c7', color: '#92400e', label: 'In Progress' },
    COMPLETED: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
    CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  };
  const s = map[status] || { bg: 'var(--blue-100)', color: 'var(--blue-800)', label: status || '—' };
  return `<span class="badge" style="background:${s.bg}; color:${s.color};">${s.label}</span>`;
}

// ===== RENDER SCHEDULE =====
function renderSchedule(interviews) {
  const container = document.querySelector('.schedule-container');
  if (!container) return;

  if (interviews.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:48px;color:var(--gray-500);">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity:0.3;margin-bottom:12px;">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/>
      </svg>
      <p>No interviews found for this filter.</p>
    </div>`;
    return;
  }

  container.innerHTML = interviews.map(iv => {
    const dateStr = iv.scheduledDate
      ? new Date(iv.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Date TBD';
    const timeStr = iv.scheduledTime ? iv.scheduledTime.substring(0, 5) : 'Time TBD';
    const endTime = iv.scheduledTime && iv.durationMinutes
      ? computeEndTime(iv.scheduledTime, iv.durationMinutes) : null;
    const timeRange = endTime ? `${timeStr} – ${endTime}` : timeStr;

    const actionBtns = iv.status === 'COMPLETED'
      ? `<button class="btn-outline btn-sm">View Feedback</button>
         ${iv.recordingUrl ? `<button class="btn-outline btn-sm">View Recording</button>` : ''}`
      : iv.status === 'SCHEDULED'
        ? `<button class="btn-outline btn-sm">Reschedule</button>
         <button class="btn-outline btn-sm" style="color:#dc2626;border-color:#dc2626;">Cancel</button>`
        : iv.status === 'CANCELLED'
          ? `<button class="btn-outline btn-sm">Details</button>`
          : '';

    return `
      <div class="interview-card" data-status="${iv.status}">
        <div class="card-date">${dateStr}</div>
        <div class="card-content">
          <div class="interview-header">
            <h3>${iv.candidateName || 'Unknown'} – ${iv.title || iv.interviewRound || 'Interview'}</h3>
            ${statusBadge(iv.status)}
          </div>
          <div class="interview-details">
            <p><strong>Interviewer:</strong> ${iv.interviewerName || '—'}</p>
            <p><strong>Time:</strong> ${timeRange}</p>
            <p><strong>Type:</strong> ${iv.interviewType || iv.interviewRound || '—'}</p>
            <p><strong>Position:</strong> ${iv.positionTitle || '—'}</p>
            ${iv.status === 'COMPLETED' && iv.score ? `<p><strong>Score:</strong> ${iv.score}/10</p>` : ''}
            ${iv.status === 'COMPLETED' && iv.feedback ? `<p><strong>Feedback:</strong> ${iv.feedback}</p>` : ''}
            ${iv.meetingLink ? `<p><strong>Room:</strong> <a href="${iv.meetingLink}" style="color:var(--blue-600);">${iv.meetingLink}</a></p>` : ''}
          </div>
          ${actionBtns ? `<div class="card-actions">${actionBtns}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function computeEndTime(timeStr, durationMinutes) {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
  } catch { return null; }
}

// ===== FILTER =====
window.filterSchedule = function (filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const btn = [...document.querySelectorAll('.filter-btn')].find(b => b.getAttribute('onclick')?.includes(`'${filter}'`));
  if (btn) btn.classList.add('active');

  let filtered = allInterviews;
  if (filter === 'upcoming') filtered = allInterviews.filter(iv => iv.status === 'SCHEDULED' || iv.status === 'IN_PROGRESS');
  else if (filter === 'completed') filtered = allInterviews.filter(iv => iv.status === 'COMPLETED');
  else if (filter === 'cancelled') filtered = allInterviews.filter(iv => iv.status === 'CANCELLED');
  renderSchedule(filtered);
};

// ===== LOAD =====
async function loadInterviews() {
  if (!companyId) {
    const container = document.querySelector('.schedule-container');
    if (container) container.innerHTML = '<p class="text-muted" style="padding:32px;">Please login as Company Admin to view interviews.</p>';
    return;
  }
  const container = document.querySelector('.schedule-container');
  if (container) container.innerHTML = '<p class="text-muted" style="padding:32px;">Loading interviews...</p>';
  try {
    allInterviews = await api.getCompanyInterviews(companyId);
    // Sort by scheduled date descending
    allInterviews.sort((a, b) => {
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(b.scheduledDate) - new Date(a.scheduledDate);
    });
    renderSchedule(allInterviews);
  } catch (err) {
    console.error('Error loading interviews:', err);
    if (container) container.innerHTML = '<p style="padding:32px;color:#dc2626;">Failed to load interviews.</p>';
  }
}

document.addEventListener('DOMContentLoaded', loadInterviews);
