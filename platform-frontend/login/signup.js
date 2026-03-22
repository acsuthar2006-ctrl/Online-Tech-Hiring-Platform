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

function createErrorElement() {
  const form = document.getElementById('signupForm')
  const div = document.createElement('div')
  div.id = 'error-message'
  div.style.color = 'red'
  div.style.display = 'none'
  form.appendChild(div)
  return div
}

function clearError() {
  const errorMessage = document.getElementById('error-message')
  if (errorMessage) {
    errorMessage.style.display = 'none'
    errorMessage.textContent = ''
  }
}

function showError(message) {
  let errorMessage = document.getElementById('error-message') || createErrorElement()
  errorMessage.textContent = message
  errorMessage.style.display = 'block'
  errorMessage.style.color = '#dc2626'
  errorMessage.style.backgroundColor = '#fee2e2'
  errorMessage.style.padding = '10px'
  errorMessage.style.borderRadius = '6px'
  errorMessage.style.marginTop = '16px'
  errorMessage.style.fontSize = '14px'
  errorMessage.style.border = '1px solid #fecaca'
  errorMessage.style.textAlign = 'center'
}

async function handleSignup(event) {
  event.preventDefault()

  clearError()

  const fullName = document.getElementById("fullname").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const signupButton = event.target.querySelector('button[type="submit"]')

  if (password !== confirmPassword) {
    showError("Passwords do not match. Please try again.")
    return
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters long.")
    return
  }

  let companyName = null
  if (selectedRole === 'company_admin') {
    companyName = document.getElementById("companyName").value
    if (!companyName || !companyName.trim()) {
      showError("Please enter your company name.")
      return
    }
  }

  const originalText = signupButton.textContent
  signupButton.disabled = true
  signupButton.textContent = "Creating account..."

  try {
    const additionalData = companyName ? { companyName: companyName.trim() } : {}
    const response = await api.signup(email, password, fullName, selectedRole, additionalData)

    alert("Account created successfully! Please login to continue.")
    window.location.href = "./login.html"
  } catch (error) {
    showError(error.message || "Signup failed")
  } finally {
    signupButton.disabled = false
    signupButton.textContent = originalText
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm')
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup)

    const inputs = signupForm.querySelectorAll('input')
    inputs.forEach(input => {
      input.addEventListener('input', clearError)
    })
  }
})

window.selectRole = selectRole
window.backToRoleSelection = backToRoleSelection
