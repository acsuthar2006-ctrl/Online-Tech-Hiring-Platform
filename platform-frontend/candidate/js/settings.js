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

  // Bind Update Buttons
  const updateUsernameBtn = document.querySelector("#account .form-group:nth-child(2) button");
  if(updateUsernameBtn) {
      updateUsernameBtn.addEventListener('click', () => updateProfile('fullName'));
  }
  
  const updatePhoneBtn = document.querySelector("#account .form-group:nth-child(3) button");
  if(updatePhoneBtn) {
      updatePhoneBtn.addEventListener('click', () => updateProfile('phone'));
  }

  // Load current settings
  loadSettings();
});

async function loadSettings() {
    const user = api.getUserInfo();
    if(!user) return;

    try {
        const settings = await api.getCandidateSettings(user.id);
        if(settings) {
            // Map settings to toggles
            // This requires mapping specific toggles to setting fields.
            // For now, let's assume the first toggle is email notifications and second is reminders based on HTML structure
            // Notifications Tab
            const notificationToggles = document.querySelectorAll("#notifications .toggle-switch input");
            if(notificationToggles.length > 0) notificationToggles[0].checked = settings.emailNotificationsEnabled;
            if(notificationToggles.length > 1) notificationToggles[1].checked = settings.interviewRemindersEnabled;
            
            // Preferences Tab
            const langSelect = document.querySelector("#preferences select");
            if(langSelect) langSelect.value = settings.language || "English";
        }
    } catch(e) {
        console.error("Failed to load settings", e);
    }
}

async function updateProfile(field) {
  const user = api.getUserInfo();
  let data = {};
  
  if (field === 'fullName') {
      const val = document.getElementById("usernameInput").value.trim();
      if(!val) return alert("Value cannot be empty");
      data.fullName = val;
  } else if (field === 'phone') {
      // Assuming the input is the one in the 3rd form group
      const val = document.querySelector("#account .form-group:nth-child(3) input").value.trim();
      if(!val) return alert("Value cannot be empty");
      data.phone = val;
  }

  try {
      await api.updateUserProfile(data);
      
      if(data.fullName) {
          document.querySelectorAll("#userName, #profileName").forEach((element) => {
            element.textContent = data.fullName;
          });
          
          const cached = api.getUserInfo();
          if(cached) {
              cached.fullName = data.fullName;
              api.setUserInfo(cached);
          }
      }

      alert("Updated successfully!");
  } catch (e) {
      console.error(e);
      alert("Failed to update: " + e.message);
  }
}

async function saveSettings() {
    const user = api.getUserInfo();
    if(!user) return;
    
    const notificationToggles = document.querySelectorAll("#notifications .toggle-switch input");
    const langSelect = document.querySelector("#preferences select");

    const settings = {
        emailNotificationsEnabled: notificationToggles.length > 0 ? notificationToggles[0].checked : true,
        interviewRemindersEnabled: notificationToggles.length > 1 ? notificationToggles[1].checked : true,
        language: langSelect ? langSelect.value : "English"
    };

    try {
        await api.updateCandidateSettings(user.id, settings);
        console.log("Settings saved"); // Silent save or show toast
    } catch(e) {
        console.error("Failed to save settings", e);
    }
}

// Add event listeners to toggles to auto-save
document.addEventListener("DOMContentLoaded", () => {
    const inputs = document.querySelectorAll(".toggle-switch input, #preferences select");
    inputs.forEach(input => {
        input.addEventListener('change', saveSettings);
    });
});

// Export for HTML onclick
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
  const menuItem = event.target.closest(".settings-menu-item");
  if(menuItem) menuItem.classList.add("active");
}

window.switchTab = switchTab;
