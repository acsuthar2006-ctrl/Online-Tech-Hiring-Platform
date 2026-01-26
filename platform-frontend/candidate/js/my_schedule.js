// Schedule page functionality

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "User"
  const userRole = localStorage.getItem("userRole") || "candidate"

  // Update username displays
  const userNameElements = document.querySelectorAll("#userName, #profileName")
  userNameElements.forEach((element) => {
    element.textContent = username
  })

  const filterBtns = document.querySelectorAll(".filter-btn")
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"))
      // Add active class to clicked button
      btn.classList.add("active")

      const filterType = btn.getAttribute("data-filter")
      filterSchedule(filterType)
    })
  })

  function filterSchedule(filterType) {
    const sections = document.querySelectorAll(".schedule-section")

    sections.forEach((section, index) => {
      if (filterType === "all") {
        section.style.display = "block"
      } else if (filterType === "upcoming" && index < 2) {
        section.style.display = "block"
      } else if (filterType === "completed" && index === 2) {
        section.style.display = "block"
      } else {
        section.style.display = "none"
      }
    })
  }

  const joinButtons = document.querySelectorAll(".btn-primary")
  joinButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      const action = btn.textContent.includes("Join") ? "join video interview" : "start technical test"
      alert(`Launching ${action}...`)
    })
  })

  const viewDetailsButtons = document.querySelectorAll(".btn-secondary")
  viewDetailsButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault()
      const interviewTitle = btn.closest(".interview-card").querySelector("h3").textContent
      alert(`Viewing details for: ${interviewTitle}`)
    })
  })

  // Notification button
  const notificationBtn = document.getElementById("notificationBtn")
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      alert("You have 3 new interview notifications!")
    })
  }
})
