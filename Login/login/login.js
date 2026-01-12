let selectedRole = ""

function selectRole(role) {
  selectedRole = role
  document.getElementById("roleSelection").style.display = "none"
  document.getElementById("loginFormContainer").style.display = "block"

  const formTitle = document.getElementById("formTitle")
  formTitle.textContent = `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`
}

function handleLogin(event) {
  event.preventDefault()

  const username = document.getElementById("username").value
  const password = document.getElementById("password").value

  sessionStorage.setItem("isLoggedIn", "true")
  sessionStorage.setItem("username", username)
  sessionStorage.setItem("userRole", selectedRole)

  // Redirect based on role
  if (selectedRole === "candidate") {
    window.location.href = "../candidate/candidate-dashboard.html"
  } else if (selectedRole === "interviewer") {
    window.location.href = "../interviewer/interviewer-dashboard.html"
  }
}

function logout() {
  sessionStorage.removeItem("isLoggedIn")
  sessionStorage.removeItem("username")
  sessionStorage.removeItem("userRole")
  window.location.href = "../login/login.html"
}
