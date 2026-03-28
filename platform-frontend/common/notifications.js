import { api } from './api.js';

function roleToProfileUrl(role) {
  if (role === 'CANDIDATE') return '/candidate/profile.html';
  if (role === 'INTERVIEWER') return '/interviewer/interviewer-profile.html';
  if (role === 'COMPANY_ADMIN') return '/company-admin/company-admin-profile.html';
  return '/';
}

function hide(el) {
  if (el) el.style.display = 'none';
}

function show(el) {
  if (el) el.style.display = '';
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function loadDismissedIds() {
  try {
    const raw = localStorage.getItem('thp_dismissed_notifications');
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    console.warn('Failed to load dismissed notifications', e);
    return new Set();
  }
}

function saveDismissedIds(set) {
  try {
    localStorage.setItem('thp_dismissed_notifications', JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('Failed to persist dismissed notifications', e);
  }
}

function ensurePanel(notificationBtn) {
  let panel = document.getElementById('notificationPanel');
  if (panel) return panel;

  panel = document.createElement('div');
  panel.id = 'notificationPanel';
  panel.className = 'notification-panel';
  panel.style.display = 'none';

  // Basic positioning relative to the bell.
  const rect = notificationBtn.getBoundingClientRect();
  panel.style.position = 'fixed';
  panel.style.top = `${Math.round(rect.bottom + 8)}px`;
  panel.style.right = `${Math.round(window.innerWidth - rect.right)}px`;

  document.body.appendChild(panel);

  // Close on outside click.
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!panel || panel.style.display === 'none') return;
    if (panel.contains(target) || notificationBtn.contains(target)) return;
    panel.style.display = 'none';
  });

  // Reposition on resize/scroll.
  const reposition = () => {
    const r = notificationBtn.getBoundingClientRect();
    panel.style.top = `${Math.round(r.bottom + 8)}px`;
    panel.style.right = `${Math.round(window.innerWidth - r.right)}px`;
  };
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);

  return panel;
}

function renderPanel(panel, items, onItemClick) {
  if (!panel) return;

  if (!items || items.length === 0) {
    panel.innerHTML = `<div class="notification-panel-inner">
      <div class="notification-title">Notifications</div>
      <div class="notification-empty">No notifications</div>
    </div>`;
    return;
  }

  panel.innerHTML = `<div class="notification-panel-inner">
    <div class="notification-title">Notifications</div>
    <div class="notification-items">
      ${items.map((it) => `
        <button class="notification-item" data-id="${escapeHtml(it.id || '')}" data-action-url="${escapeHtml(it.actionUrl || '')}">
          <div class="notification-item-title">${escapeHtml(it.title || '')}</div>
          <div class="notification-item-message">${escapeHtml(it.message || '')}</div>
        </button>
      `).join('')}
    </div>
  </div>`;

  panel.querySelectorAll('button.notification-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const url = btn.getAttribute('data-action-url');
      if (typeof onItemClick === 'function' && id) {
        onItemClick(id);
      }
      if (url) window.location.href = url;
    });
  });
}

// Keep a singleton state to avoid double-binding click handlers on pages that call initNotifications twice.
const __notifState = (() => {
  if (!window.__thNotifState) {
    window.__thNotifState = { initialized: false, panel: null };
  }
  return window.__thNotifState;
})();

export async function initNotifications() {
  const notificationBtn = document.getElementById('notificationBtn');
  if (!notificationBtn) return;

  const badge = notificationBtn.querySelector('.notification-badge');
  if (badge) hide(badge);

  // Create the panel immediately so the bell is clickable even if fetch fails.
  let panel = __notifState.panel || ensurePanel(notificationBtn);
  __notifState.panel = panel;

  const togglePanel = () => {
    if (!panel) {
      panel = ensurePanel(notificationBtn);
      __notifState.panel = panel;
    }
    // Reposition before showing in case of scroll/resize
    const r = notificationBtn.getBoundingClientRect();
    panel.style.top = `${Math.round(r.bottom + 8)}px`;
    panel.style.right = `${Math.round(window.innerWidth - r.right)}px`;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  };

  // Bind click only once
  if (!__notifState.initialized) {
    notificationBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });
    __notifState.initialized = true;
  }

  const userInfo = api.getUserInfo();
  const role = userInfo?.role || null;
  const profileUrl = roleToProfileUrl(role);

  let data;
  try {
    data = await api.getNotifications();
  } catch (e) {
    console.warn('Failed to load notifications', e);
    // Show a lightweight error state instead of leaving the bell dead.
    renderPanel(panel, [{
      id: 'error',
      title: 'Notifications unavailable',
      message: 'Could not load notifications right now.',
      actionUrl: ''
    }], () => {});

    return;
  }

  const allItems = data?.items || [];

  const dismissedIds = loadDismissedIds();
  let visibleItems = allItems.filter((it) => it && it.id && !dismissedIds.has(it.id));

  const count = visibleItems.length;
  if (badge) {
    badge.textContent = String(count);
    if (count > 0) show(badge);
    else hide(badge);
  }

  const onItemClick = (id) => {
    dismissedIds.add(id);
    saveDismissedIds(dismissedIds);
    visibleItems = visibleItems.filter((it) => it.id !== id);

    const newCount = visibleItems.length;
    if (badge) {
      badge.textContent = String(newCount);
      if (newCount > 0) show(badge);
      else hide(badge);
    }

    renderPanel(panel, visibleItems, onItemClick);
  };

  // Single profile notification should still respect profile URL
  if (allItems.length === 1 && allItems[0]?.type === 'PROFILE_INCOMPLETE' && (!allItems[0].actionUrl || allItems[0].actionUrl === '/')) {
    allItems[0].actionUrl = profileUrl;
  }

  renderPanel(panel, visibleItems, onItemClick);
  // Panel already toggles via click handler defined above.
}
