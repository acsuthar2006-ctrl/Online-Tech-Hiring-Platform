/**
 * queue-sidebar.js
 * ----------------
 * Pure ES module for the candidate queue sidebar panel.
 *
 * Usage (imported by call.js):
 *   import { initQueueSidebar } from '../../queue/queue-sidebar.js';
 *   initQueueSidebar({ roomId, userEmail, userRole });
 *
 * Exposes on window:
 *   window.refreshQueue() — call after any queue-mutating action
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 5000;
const API_BASE = '/api/interviews/session';

// Status label map (defaults)
const STATUS_LABELS = {
  SCHEDULED: 'Not in lobby',
  IN_PROGRESS: 'Interview in progress',
  COMPLETED: 'Interview done',
  CANCELLED: 'Cancelled',
};

// CSS modifier class per status
const STATUS_CLASS = {
  SCHEDULED: 'queue-item--scheduled',
  IN_PROGRESS: 'queue-item--in-progress',
  COMPLETED: 'queue-item--completed',
  CANCELLED: 'queue-item--completed',  // reuse red style
};

// ─── Module State ─────────────────────────────────────────────────────────────

let _roomId = null;
let _userEmail = null;
let _userRole = null;
let _pollTimer = null;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialise the queue sidebar.
 * @param {object} opts
 * @param {string} opts.roomId    - Room/meeting-link ID from URL
 * @param {string} opts.userEmail - Logged-in user's email (for name masking)
 * @param {string} opts.userRole  - 'interviewer' | 'candidate'
 */
export function initQueueSidebar({ roomId, userEmail, userRole }) {
  _roomId = roomId;
  _userEmail = userEmail ? userEmail.toLowerCase().trim() : null;
  _userRole = userRole || 'candidate';

  if (!_roomId) {
    console.warn('[QueueSidebar] No roomId — sidebar will not initialise.');
    return;
  }

  _buildSidebarDOM();
  _attachToggleListener();
  _fetchAndRender();

  // Auto-refresh
  _pollTimer = setInterval(_fetchAndRender, POLL_INTERVAL_MS);

  // Expose refresh for external callers (e.g. queue-manager.js)
  window.refreshQueue = _fetchAndRender;

  console.log('[QueueSidebar] Initialised for room:', _roomId, '| role:', _userRole);
}

// ─── DOM Construction ─────────────────────────────────────────────────────────

/**
 * Inject sidebar HTML into <body> if not already present.
 */
function _buildSidebarDOM() {
  if (document.getElementById('queue-sidebar')) return; // Already injected

  const aside = document.createElement('aside');
  aside.id = 'queue-sidebar';
  aside.className = 'queue-sidebar';
  aside.setAttribute('aria-label', 'Interview Queue');

  aside.innerHTML = `
    <div class="queue-sidebar__header">
      <i class="fas fa-list-ol queue-icon" aria-hidden="true"></i>
      <span class="queue-sidebar__title">Interview Queue</span>
      <button class="queue-sidebar__toggle" id="queue-toggle-btn" aria-label="Toggle queue sidebar" title="Toggle Queue">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    <div class="queue-sidebar__subtitle" id="queue-sidebar-subtitle">Loading…</div>
    <div class="queue-sidebar__list queue-sidebar--loading" id="queue-sidebar-list">
      <div class="queue-sidebar__state">
        <i class="fas fa-circle-notch fa-spin"></i>
        Loading queue…
      </div>
    </div>
  `;

  document.body.appendChild(aside);
}

// ─── Toggle (Collapse / Expand) ───────────────────────────────────────────────

function _attachToggleListener() {
  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('queue-sidebar');
    if (!sidebar) return;

    const btn = e.target.closest('#queue-toggle-btn');

    // If the button was clicked explicitly, toggle state
    if (btn) {
      sidebar.classList.toggle('collapsed');
      return;
    }

    // If the sidebar is currently collapsed and the user clicked anywhere *on* the sidebar
    if (sidebar.classList.contains('collapsed') && sidebar.contains(e.target)) {
      sidebar.classList.remove('collapsed');
    }
  });
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function _fetchAndRender() {
  const list = document.getElementById('queue-sidebar-list');
  const subtitle = document.getElementById('queue-sidebar-subtitle');
  if (!list) return;

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(_roomId)}/queue`);

    if (!res.ok) {
      if (res.status === 401) {
        _renderState(list, 'fa-lock', 'Authentication required. Please log in.');
        if (subtitle) subtitle.textContent = '';
      } else {
        _renderState(list, 'fa-triangle-exclamation', `Error ${res.status} loading queue.`);
      }
      return;
    }

    const data = await res.json();
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];

    _renderQueue(list, subtitle, timeline);

  } catch (err) {
    console.error('[QueueSidebar] Fetch error:', err);
    _renderState(list, 'fa-wifi', 'Network error. Retrying…');
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * Render the timeline list into the sidebar.
 * @param {HTMLElement} listEl
 * @param {HTMLElement} subtitleEl
 * @param {Array}       timeline   - Array of interview objects from backend
 */
function _renderQueue(listEl, subtitleEl, timeline) {
  listEl.classList.remove('queue-sidebar--loading');

  if (!timeline.length) {
    _renderState(listEl, 'fa-calendar-xmark', 'No candidates scheduled for this room.');
    if (subtitleEl) subtitleEl.textContent = '';
    return;
  }

  // Update subtitle
  const total = timeline.length;
  const completed = timeline.filter(i => i.status === 'COMPLETED').length;
  const inProg = timeline.filter(i => i.status === 'IN_PROGRESS').length;

  if (subtitleEl) {
    if (inProg > 0) {
      subtitleEl.textContent = `${completed} done · 1 in progress · ${total - completed - inProg} waiting`;
    } else {
      subtitleEl.textContent = `${completed} of ${total} completed`;
    }
  }

  // Build list HTML
  const fragment = document.createDocumentFragment();

  timeline.forEach((interview, index) => {
    const position = index + 1;
    const status = interview.status || 'SCHEDULED';
    const candidate = interview.candidate || {};
    const email = (candidate.email || '').toLowerCase().trim();
    const isSelf = _userRole === 'candidate' && _userEmail && email === _userEmail;
    const isInterviewer = _userRole === 'interviewer';

    // Name masking: candidates see only their own name
    const displayName = (isSelf || isInterviewer)
      ? (candidate.fullName || candidate.email || `Candidate #${position}`)
      : `Candidate #${position}`;

    const statusClass = STATUS_CLASS[status] || 'queue-item--scheduled';
    let statusLabel = STATUS_LABELS[status] || status;
    const selfClass = isSelf ? ' queue-item--self' : '';

    // Override label and class if they are scheduled but in the lobby
    if (status === 'SCHEDULED' && interview.inLobby) {
      statusLabel = 'Waiting';
      // Optionally add a modifier class if wanted
    }

    const item = document.createElement('div');
    item.className = `queue-item ${statusClass}${selfClass}`;
    item.setAttribute('aria-label', `Position ${position}: ${displayName} — ${statusLabel}`);

    // Format expected time if this candidate is not currently in progress or completed
    let timingHtml = '';
    if (status === 'SCHEDULED' && interview.expectedStartTime) {
      const expectedDate = new Date(interview.expectedStartTime);
      if (!isNaN(expectedDate.getTime())) {
        const timeStr = expectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timingHtml = `<div class="queue-item__timing" style="font-size: 10px; color: var(--text-muted, #8899ac); margin-top: 2px;">Expected begin time - ${timeStr}</div>`;
      }
    }

    item.innerHTML = `
      <div class="queue-item__number" aria-hidden="true">${position}</div>
      <div class="queue-item__info">
        <div class="queue-item__name">${_escapeHtml(displayName)}</div>
        <div class="queue-item__status">${_escapeHtml(statusLabel)}</div>
        ${timingHtml}
      </div>
      ${isSelf ? '<span class="queue-item__self-badge" aria-label="You">YOU</span>' : ''}
    `;

    fragment.appendChild(item);
  });

  listEl.innerHTML = '';
  listEl.appendChild(fragment);
}

/**
 * Show an icon + message state in the list container.
 */
function _renderState(listEl, iconClass, message) {
  listEl.innerHTML = `
    <div class="queue-sidebar__state">
      <i class="fas ${_escapeHtml(iconClass)}" aria-hidden="true"></i>
      ${_escapeHtml(message)}
    </div>
  `;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Basic HTML escape to prevent XSS from candidate names.
 */
function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
