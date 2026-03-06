import { api } from '../common/api.js'

let selectedRole = ""

function selectRole(role) {
  selectedRole = role
  document.getElementById("roleSelection").style.display = "none"
  document.getElementById("loginFormContainer").style.display = "block"

  let label = role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
  if (role === 'company_admin') label = 'Company Admin'

  const formTitle = document.getElementById("formTitle")
  formTitle.textContent = `Sign Up as ${label}`

  // Show company name field only for company_admin
  const companyNameGroup = document.getElementById("companyNameGroup")
  const companyNameInput = document.getElementById("companyName")
  if (role === 'company_admin') {
    companyNameGroup.style.display = "block"
    companyNameInput.required = true
  } else {
    companyNameGroup.style.display = "none"
    companyNameInput.required = false
  }

  const roleSpecificFields = document.getElementById("roleSpecificFields")
  if (roleSpecificFields) roleSpecificFields.innerHTML = ''
}

function backToRoleSelection() {
  document.getElementById("roleSelection").style.display = "block"
  document.getElementById("loginFormContainer").style.display = "none"
  selectedRole = ""
  document.getElementById("signupForm").reset()
  const companyNameGroup = document.getElementById("companyNameGroup")
  if (companyNameGroup) companyNameGroup.style.display = "none"
  const roleSpecificFields = document.getElementById("roleSpecificFields")
  if (roleSpecificFields) roleSpecificFields.innerHTML = ""
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

  // Validate company name for company admin
  let companyName = null
  if (selectedRole === 'company_admin') {
    companyName = document.getElementById("companyName").value
    if (!companyName || !companyName.trim()) {
      alert("Please enter your company name.")
      return
    }
  }

  // Show loading state
  const originalText = signupButton.textContent
  signupButton.disabled = true
  signupButton.textContent = "Creating account..."

  try {
    const additionalData = companyName ? { companyName: companyName.trim() } : {}
    const response = await api.signup(email, password, fullName, selectedRole, additionalData)

    alert("Account created successfully! Please login to continue.")
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
