document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "User"

  // Update username display elements
  const profileUsernameElement = document.getElementById("profileUsername")
  if (profileUsernameElement) {
    profileUsernameElement.textContent = username
  }

  // Load saved profile data if it exists
  const savedFullName = localStorage.getItem("fullName")
  if (savedFullName) {
    document.getElementById("fullName").value = savedFullName
  }

  const savedEmail = localStorage.getItem("email")
  if (savedEmail) {
    document.getElementById("email").value = savedEmail
  }

  const savedPhone = localStorage.getItem("phone")
  if (savedPhone) {
    document.getElementById("phone").value = savedPhone
  }

  const savedLocation = localStorage.getItem("location")
  if (savedLocation) {
    document.getElementById("location").value = savedLocation
  }
})

// Save profile data when user makes changes
document.getElementById("fullName")?.addEventListener("change", (e) => {
  localStorage.setItem("fullName", e.target.value)
})

document.getElementById("email")?.addEventListener("change", (e) => {
  localStorage.setItem("email", e.target.value)
})

document.getElementById("phone")?.addEventListener("change", (e) => {
  localStorage.setItem("phone", e.target.value)
})

document.getElementById("location")?.addEventListener("change", (e) => {
  localStorage.setItem("location", e.target.value)
})
