// Company Admin Settings JavaScript

// Switch between settings tabs
function switchTab(event, tabName) {
  event.preventDefault()

  // Hide all sections
  const sections = document.querySelectorAll('.settings-section')
  sections.forEach((section) => {
    section.classList.remove('active')
  })

  // Remove active class from all tabs
  const tabs = document.querySelectorAll('.settings-tab')
  tabs.forEach((tab) => {
    tab.classList.remove('active')
  })

  // Show selected section and set active tab
  const selectedSection = document.getElementById(tabName)
  if (selectedSection) {
    selectedSection.classList.add('active')
  }

  event.target.classList.add('active')
}

// Toggle switch functionality
window.addEventListener('load', () => {
  const toggleSwitches = document.querySelectorAll('.toggle-switch')
  toggleSwitches.forEach((toggle) => {
    toggle.addEventListener('click', function () {
      this.classList.toggle('on')
    })
  })
})
