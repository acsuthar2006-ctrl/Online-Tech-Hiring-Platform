import { api } from '../../common/api.js';
import { getMediaBase } from '../../common/media-config.js';

const companyId = sessionStorage.getItem('companyId');
let allInterviews = [];
let currentFilter = 'all';

// ===== SET ADMIN NAME =====
function setAdminName() {
  const userInfo = api.getUserInfo();
  if (userInfo) {
    const nameEl = document.getElementById('adminName');
    if (nameEl) nameEl.textContent = userInfo.fullName || 'Admin';
  }
}


// ===== STATUS HELPERS =====
function statusBadge(status) {
  const map = {
    SCHEDULED:  { bg: 'var(--blue-100)', color: 'var(--blue-800)', label: 'Upcoming' },
    IN_PROGRESS:{ bg: '#fef3c7', color: '#92400e', label: 'In Progress' },
    COMPLETED:  { bg: '#dcfce7', color: '#166534', label: 'Completed' },
    CANCELLED:  { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
  };
  const s = map[status] || { bg: 'var(--blue-100)', color: 'var(--blue-800)', label: status || '—' };
  return `<span class="badge" style="background:${s.bg}; color:${s.color};">${s.label}</span>`;
}

function outcomeBadge(outcome) {
  if (!outcome || outcome === 'PENDING') return '';
  const cfg = outcome === 'ACCEPTED'
    ? { bg: '#dcfce7', color: '#166534', label: 'Accepted' }
    : { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' };
  return `<span class="badge" style="background:${cfg.bg}; color:${cfg.color}; margin-left:6px;">${cfg.label}</span>`;
}

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

    const scheduledStartLabel = formatTimeLabelFromTimeString(iv.scheduledTime) || 'Time TBD';
    let timeLabel = scheduledStartLabel;

    // Upcoming and in-progress interviews show only the scheduled start time (matches interviewer view).
    // Completed interviews show actual start/end as tracked in the call flow.
    if (iv.status === 'COMPLETED') {
      const actualStartLabel = formatTimeLabelFromDateTime(iv.actualStartTime);
      const actualEndLabel = formatTimeLabelFromDateTime(iv.actualEndTime);
      const durationLabel = (iv.actualStartTime && iv.actualEndTime)
        ? formatDurationFromDateTimes(iv.actualStartTime, iv.actualEndTime)
        : null;

      if (actualStartLabel && actualEndLabel) {
        timeLabel = `${actualStartLabel} - ${actualEndLabel}${durationLabel ? ` (${durationLabel})` : ''}`;
      }
    }

    const recordingBtn = iv.recordingUrl
      ? (() => {
          const mediaBase = getMediaBase();
          const fileUrl = `${mediaBase}/recordings/${iv.recordingUrl}`;
          return `<button class="btn btn-primary btn-sm force-download-btn" style="margin-left: 6px;" data-url="${fileUrl}" data-filename="${iv.recordingUrl}">Download Recording</button>`;
        })()
      : '';

    const actionBtns = iv.status === 'COMPLETED'
      ? `${recordingBtn}`
      : iv.status === 'SCHEDULED'
        ? ``
        : iv.status === 'CANCELLED'
          ? `<button class="btn-outline btn-sm">Details</button>`
          : '';

    return `
      <div class="interview-card" data-status="${iv.status}">
        <div class="card-date">${dateStr}</div>
        <div class="card-content">
          <div class="interview-header">
            <h3>${iv.candidateName || 'Unknown'} – ${iv.title || iv.interviewRound || 'Interview'}</h3>
            <div style="display:flex;align-items:center;gap:6px;">${statusBadge(iv.status)}${outcomeBadge(iv.candidateOutcome)}</div>
          </div>
          <div class="interview-details">
            <p><strong>Interviewer:</strong> ${iv.interviewerName || '—'}</p>
            <p><strong>Time:</strong> ${timeLabel}</p>
            <p><strong>Type:</strong> ${iv.interviewType || iv.interviewRound || '—'}</p>
            <p><strong>Position:</strong> ${iv.positionTitle || '—'}</p>
            ${iv.status === 'COMPLETED' && iv.score ? `<p><strong>Score:</strong> ${iv.score}/10</p>` : ''}
            ${iv.status === 'COMPLETED' && iv.feedback ? `<p><strong>Feedback:</strong> ${iv.feedback}</p>` : ''}
            ${iv.meetingLink ? `<p><strong>Room:</strong> ${iv.meetingLink}</p>` : ''}
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

    // Update counts in filter buttons
    const upcoming = allInterviews.filter(iv => iv.status === 'SCHEDULED' || iv.status === 'IN_PROGRESS').length;
    const completed = allInterviews.filter(iv => iv.status === 'COMPLETED').length;
    const upcomingEl = document.getElementById('upcomingCount');
    const completedEl = document.getElementById('completedCount');
    if (upcomingEl) upcomingEl.textContent = String(upcoming);
    if (completedEl) completedEl.textContent = String(completed);

    renderSchedule(allInterviews);
  } catch (err) {
    console.error('Error loading interviews:', err);
    if (container) container.innerHTML = '<p style="padding:32px;color:#dc2626;">Failed to load interviews.</p>';
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  setAdminName();
  loadInterviews();
});
