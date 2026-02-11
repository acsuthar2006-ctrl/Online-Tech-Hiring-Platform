import { api } from './api.js'

// Authentication check for dashboard pages
;(() => {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn")
  const username = localStorage.getItem("username")
  const userRole = localStorage.getItem("userRole")
  const jwtToken = localStorage.getItem("jwt_token")

  // If not logged in or no JWT token, redirect to login page
  if (!isLoggedIn || !username || !userRole || !jwtToken) {
    window.location.href = "../login/login.html"
  }
})()

function logout() {
  api.clearToken()
  localStorage.removeItem("isLoggedIn")
  localStorage.removeItem("userId")
  localStorage.removeItem("username")
  localStorage.removeItem("userRole")
  window.location.href = "../login/login.html"
}

// Expose logout to global scope
window.logout = logout
