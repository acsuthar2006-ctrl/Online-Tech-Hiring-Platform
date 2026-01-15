// ui-utils.js - Shared UI Helper Functions

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - 'info', 'success', 'error', 'warning'
 */
export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) {
    // Fallback if no container (though base.css/html should ensure it)
    console.warn("Toast container not found:", message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Add icon based on type (consistent across Lobby and Call)
  const iconMap = {
    error: '<i class="fas fa-exclamation-circle"></i>',
    success: '<i class="fas fa-check-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>',
  };

  // Check if we need to insert icon or just text
  // Lobby.js had icons, ui.js didn't. Let's add them for consistency.
  const icon = iconMap[type] || iconMap["info"];
  toast.innerHTML = `${icon} <span>${message}</span>`;

  container.appendChild(toast);

  // Animation out
  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000); // 4 seconds typical
}

let loadingTimeout;

/**
 * Show or hide the global loading spinner
 * @param {boolean} show
 */
export function showLoading(show = true) {
  const spinner = document.getElementById("loading-spinner");
  if (spinner) {
    spinner.style.display = show ? "flex" : "none";

    // Clear safety timeout
    if (loadingTimeout) clearTimeout(loadingTimeout);

    // Safety: Auto-hide after 15s
    if (show) {
      loadingTimeout = setTimeout(() => {
        if (spinner.style.display === "flex") {
          spinner.style.display = "none";
          showToast("Request timed out or took too long", "warning");
        }
      }, 15000);
    }
  }
}
