import { api } from '../common/api.js'

let selectedRole = ""

function selectRole(role) {
  selectedRole = role
  document.getElementById("roleSelection").style.display = "none"
  document.getElementById("loginFormContainer").style.display = "block"

  const formTitle = document.getElementById("formTitle")
  formTitle.textContent = `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`

  // No role-specific fields requested during signup anymore
  // Keep the area empty in case older markup expects it
  const roleSpecificFields = document.getElementById("roleSpecificFields")
  if (roleSpecificFields) roleSpecificFields.innerHTML = ''
}

function backToRoleSelection() {
  document.getElementById("roleSelection").style.display = "block"
  document.getElementById("loginFormContainer").style.display = "none"
  selectedRole = ""
  document.getElementById("signupForm").reset()
  document.getElementById("roleSpecificFields").innerHTML = ""
}

async function handleSignup(event) {
  event.preventDefault()

  const fullName = document.getElementById("fullname").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const signupButton = event.target.querySelector('button[type="submit"]')

  if (password !== confirmPassword) {
    alert("Passwords do not match. Please try again.")
    return
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.")
    return
  }

  // Show loading state
  const originalText = signupButton.textContent
  signupButton.disabled = true
  signupButton.textContent = "Creating account..."

  try {
    // Send only the basic signup fields; backend will create the appropriate user type
    const response = await api.signup(email, password, fullName, selectedRole)

    alert("Account created successfully! Please login to continue.")

    // Redirect to login page to login and get JWT token
    window.location.href = "./login.html"
  } catch (error) {
    alert(`Signup failed: ${error.message}`)
    signupButton.disabled = false
    signupButton.textContent = originalText
  }
}

// Expose functions to global scope for onclick handlers
window.selectRole = selectRole
window.backToRoleSelection = backToRoleSelection
window.handleSignup = handleSignup
