// Load username from sessionStorage and display it
document.addEventListener("DOMContentLoaded", () => {
  const username = sessionStorage.getItem("username") || "User";
  const userRole = sessionStorage.getItem("userRole") || "Candidate";

  // Update all username displays
  const userNameElements = document.querySelectorAll("#userName, #profileName");
  userNameElements.forEach((element) => {
    element.textContent = username;
  });

  // Notification button
  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      alert("You have new interview notifications!");
    });
  }
});
