/**
 * Shared dashboard utility functions
 * Modular helpers for UI rendering across dashboards
 */

/**
 * Format date and time for display
 * @param {string|Date} date - ISO date string or Date object
 * @param {string|Date} time - ISO time string or Date object
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(date, time) {
  try {
    if (!date) return 'TBD';
    
    // Handle full ISO strings that might contain time
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'TBD';
    
    const dateStr = dateObj.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });

    if (time) {
      // Handle "HH:mm:ss" or "HH:mm"
      const [hours, minutes] = time.split(':');
      const timeObj = new Date();
      timeObj.setHours(parseInt(hours), parseInt(minutes));
      
      const timeStr = timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} @ ${timeStr}`;
    }
    return dateStr;
  } catch (e) {
    console.warn("Date formatting error", e);
    return 'Invalid Date';
  }
}

/**
 * Create loading skeleton
 * @returns {string} HTML for loading state
 */
export function createLoadingState() {
  return `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your dashboard...</p>
    </div>
  `;
}

/**
 * Create error message
 * @param {string} message - Error message to display
 * @returns {string} HTML for error state
 */
export function createErrorState(message) {
  return `
    <div class="error-state">
      <p class="error-message">⚠️ ${message}</p>
      <button class="btn btn-secondary" onclick="location.reload()">Try Again</button>
    </div>
  `;
}

/**
 * Create empty state message
 * @param {string} message - Message to display
 * @returns {string} HTML for empty state
 */
export function createEmptyState(message) {
  return `
    <div class="empty-state">
      <p>${message}</p>
    </div>
  `;
}
