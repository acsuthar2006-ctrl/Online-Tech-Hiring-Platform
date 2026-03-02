// Company Interviews Schedule JavaScript

// Filter schedule by status
function filterSchedule(status) {
  const buttons = document.querySelectorAll('.filter-btn')
  buttons.forEach((btn) => {
    btn.classList.remove('active')
  })
  event.target.classList.add('active')

  console.log('[v0] Filtering interviews by status:', status)
  // Filter logic can be implemented here
}
