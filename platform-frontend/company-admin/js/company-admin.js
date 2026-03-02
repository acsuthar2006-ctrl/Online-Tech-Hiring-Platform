// Company Admin Dashboard JavaScript

// Load admin username on page load
window.addEventListener('load', () => {
  const username = localStorage.getItem('username')
  if (username) {
    const adminNameElements = document.querySelectorAll('#adminUsername, #adminName')
    adminNameElements.forEach((el) => {
      el.textContent = username
    })
  }
})

// Update profile
function updateProfile() {
  const companyName = document.getElementById('companyNameInput').value
  const companyEmail = document.getElementById('companyEmailInput').value
  const adminName = document.getElementById('adminNameInput').value

  if (companyName && companyEmail && adminName) {
    localStorage.setItem('companyName', companyName)
    localStorage.setItem('companyEmail', companyEmail)
    localStorage.setItem('adminName', adminName)
    alert('Profile updated successfully!')
  } else {
    alert('Please fill in all fields')
  }
}

// Logout function
function logout() {
  localStorage.removeItem('isLoggedIn')
  localStorage.removeItem('username')
  localStorage.removeItem('userRole')
  window.location.href = 'login.html'
}
