// Authentication check for dashboard pages
; (() => {
  // Check if user is logged in
  const isLoggedIn = sessionStorage.getItem("isLoggedIn")
  const username = sessionStorage.getItem("username")
  const userRole = sessionStorage.getItem("userRole")

  // If not logged in, redirect to login page
  if (!isLoggedIn || !username || !userRole) {
    window.location.href = "../auth/login.html"
  }
})()

function logout() {
  sessionStorage.removeItem("isLoggedIn")
  sessionStorage.removeItem("username")
  sessionStorage.removeItem("userRole")
  window.location.href = "../auth/login.html"
}
