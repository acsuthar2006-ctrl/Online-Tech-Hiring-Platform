import { api } from '../../common/api.js'

let selectedRole = ""

function selectRole(role) {
  selectedRole = role
  document.getElementById("roleSelection").style.display = "none"
  document.getElementById("loginFormContainer").style.display = "block"

  const formTitle = document.getElementById("formTitle")
  formTitle.textContent = `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`
}

function backToRoleSelection() {
  document.getElementById("roleSelection").style.display = "block"
  document.getElementById("loginFormContainer").style.display = "none"
  selectedRole = ""
}

async function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const loginButton = event.target.querySelector('button[type="submit"]')

  // Show loading state
  const originalText = loginButton.textContent
  loginButton.disabled = true
  loginButton.textContent = "Logging in..."

  try {
    const response = await api.login(email, password)

    // Store user info
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("userId", response.userId)
    localStorage.setItem("username", response.fullName)
    localStorage.setItem("userRole", response.role.toLowerCase())

    // Redirect based on role
    const role = response.role.toLowerCase()
    if (role === "candidate") {
      window.location.href = "./candidate-dashboard.html"
    } else if (role === "interviewer") {
      window.location.href = "./interviewer-dashboard.html"
    }
  } catch (error) {
    alert(`Login failed: ${error.message}`)
    loginButton.disabled = false
    loginButton.textContent = originalText
  }
}

// Expose functions to global scope for onclick handlers
window.selectRole = selectRole
window.backToRoleSelection = backToRoleSelection
window.handleLogin = handleLogin
