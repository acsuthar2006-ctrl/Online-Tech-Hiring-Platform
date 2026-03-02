// Company Interviewers JavaScript

// Search and filter interviewers
window.addEventListener('load', () => {
  const searchInput = document.querySelector('.search-bar .form-input')
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      console.log('[v0] Searching interviewers:', e.target.value)
    })
  }

  // Filter by expertise
  const expertiseSelect = document.querySelectorAll('.search-bar select')[0]
  if (expertiseSelect) {
    expertiseSelect.addEventListener('change', (e) => {
      console.log('[v0] Filtering by expertise:', e.target.value)
    })
  }

  // Filter by status
  const statusSelect = document.querySelectorAll('.search-bar select')[1]
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      console.log('[v0] Filtering by status:', e.target.value)
    })
  }
})
