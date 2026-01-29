// Load username from localStorage and display it
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "User"
  const userRole = localStorage.getItem("userRole") || "Candidate"

  // Update all username displays
  const userNameElements = document.querySelectorAll("#userName, #profileName")
  userNameElements.forEach((element) => {
    element.textContent = username
  })

  // Notification button
  const notificationBtn = document.getElementById("notificationBtn")
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      alert("You have new interview notifications!")
    })
  }
})