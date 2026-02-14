import { api } from '../../common/api.js';

// Load initial data
document.addEventListener("DOMContentLoaded", () => {
    const userInfo = api.getUserInfo();
    if(userInfo) {
       document.querySelectorAll("#userName, #profileName").forEach((element) => {
         element.textContent = userInfo.fullName;
       });
       
       const usernameInput = document.getElementById("usernameInput");
       if (usernameInput) {
         usernameInput.value = userInfo.fullName;
       }
    }

  // Toggle switches functionality
  const toggles = document.querySelectorAll(".toggle-switch input")
  toggles.forEach((toggle) => {
    toggle.addEventListener("change", () => {
      // Placeholder for backend setting update
      console.log("Setting toggled:", toggle.checked);
    })
  })

  // Bind Update Button
  const updateBtn = document.querySelector("#account button.btn-primary");
  if(updateBtn) {
      updateBtn.addEventListener('click', updateProfile);
  }
});

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

async function updateProfile() {
  const fullName = document.getElementById("usernameInput").value.trim();
  // We can add more fields as the API supports them

  if (!fullName) {
    alert("Please enter a name")
    return
  }

  try {
      await api.updateUserProfile({ fullName });
      
      // Update display
      document.querySelectorAll("#userName, #profileName").forEach((element) => {
        element.textContent = fullName;
      });
      
      // Update session cache
      const cached = api.getUserInfo();
      if(cached) {
          cached.fullName = fullName;
          api.setUserInfo(cached);
      }

      alert("Profile updated successfully!")
  } catch (e) {
      console.error(e);
      alert("Failed to update profile: " + e.message);
  }
}

// Export for HTML onclick
window.switchTab = switchTab;
