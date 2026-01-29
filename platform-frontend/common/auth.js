// Authentication check for dashboard pages
;(() => {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn")
  const username = localStorage.getItem("username")
  const userRole = localStorage.getItem("userRole")

  // If not logged in, redirect to login page
  if (!isLoggedIn || !username || !userRole) {
    window.location.href = "../login/login.html"
  }
})()

function logout() {
  localStorage.removeItem("isLoggedIn")
  localStorage.removeItem("username")
  localStorage.removeItem("userRole")
  window.location.href = "../login/login.html"
}
