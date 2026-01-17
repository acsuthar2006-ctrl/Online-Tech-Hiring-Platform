// Tab switching functionality
function switchTab(event, tabName) {
  event.preventDefault();

  // Hide all tabs
  const tabs = document.querySelectorAll(".settings-tab");
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remove active class from all menu items
  const menuItems = document.querySelectorAll(".settings-menu-item");
  menuItems.forEach((item) => {
    item.classList.remove("active");
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  // Add active class to clicked menu item
  event.target.closest(".settings-menu-item").classList.add("active");
}

// Update username functionality
function updateUsername() {
  const usernameInput = document.getElementById("usernameInput");
  const newUsername = usernameInput.value.trim();

  if (!newUsername) {
    alert("Please enter a username");
    return;
  }

  // Save to localStorage
  localStorage.setItem("username", newUsername);

  // Update display
  document.querySelectorAll("#userName, #profileName").forEach((element) => {
    element.textContent = newUsername;
  });

  alert("Username updated successfully!");
}

// Load current username on page load
document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "User";
  const usernameInput = document.getElementById("usernameInput");
  if (usernameInput) {
    usernameInput.value = username;
  }

  // Notification button
  const notificationBtn = document.getElementById("notificationBtn");
  if (notificationBtn) {
    notificationBtn.addEventListener("click", () => {
      alert("You have 3 new notifications!");
    });
  }

  // Toggle switches functionality
  const toggles = document.querySelectorAll(".toggle-switch input");
  toggles.forEach((toggle) => {
    toggle.addEventListener("change", () => {
      console.log("[v0] Toggle changed:", toggle.checked);
    });
  });

  // Form submission handling
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    if (button.textContent.includes("Change Email")) {
      button.addEventListener("click", () => {
        alert("Email change request sent. Please verify your new email.");
      });
    }
    if (button.textContent.includes("Update")) {
      button.addEventListener("click", () => {
        alert("Information updated successfully!");
      });
    }
    if (button.textContent.includes("Change Password")) {
      button.addEventListener("click", () => {
        alert("Password changed successfully!");
      });
    }
    if (button.textContent.includes("Enable Two-Factor")) {
      button.addEventListener("click", () => {
        alert("Two-factor authentication setup started.");
      });
    }
    if (button.textContent.includes("Download My Data")) {
      button.addEventListener("click", () => {
        alert("Your data export will be sent to your email shortly.");
      });
    }
    if (button.textContent.includes("Delete Account")) {
      button.addEventListener("click", () => {
        if (
          confirm(
            "Are you sure you want to delete your account? This action cannot be undone.",
          )
        ) {
          alert("Account deletion request submitted.");
        }
      });
    }
  });
});
