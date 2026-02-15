import { api } from '../../common/api.js';
function switchTab(event, tabName) {
      const tabs = document.querySelectorAll('.settings-tab');
      const sections = document.querySelectorAll('.settings-section');
      
      tabs.forEach(tab => tab.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));
      
      event.target.classList.add('active');
      const target = document.getElementById(tabName);
      if(target) target.classList.add('active');
}

function toggleSwitch(button) {
  button.classList.toggle('on');
}

async function updateProfile() {
    const fullNameElement = document.getElementById('profileNameInput'); // Assuming input exist
    const fullName = fullNameElement ? fullNameElement.value.trim() : null;
    
    if(!fullName) return;

    try {
        await api.updateUserProfile({ fullName });
        alert("Profile updated successfully");
        
        // Update display and cache
         const userInfo = api.getUserInfo();
         if (userInfo) {
            userInfo.fullName = fullName;
            api.setUserInfo(userInfo);
            const el = document.getElementById('profileName');
            if(el) el.textContent = userInfo.fullName;
         }
    } catch(e) {
        console.error(e);
        alert("Failed to update profile");
    }
}

document.addEventListener('DOMContentLoaded', function() {
  const userInfo = api.getUserInfo();
  if (userInfo) {
    const el = document.getElementById('profileName');
    if(el) el.textContent = userInfo.fullName;
    
    // If there's an input for name, populate it
    const input = document.getElementById('profileNameInput');
    if(input) input.value = userInfo.fullName;
  }
  
  // Load settings
  loadSettings();

  // Bind save buttons
  // General Settings
  const generalSaveBtn = document.querySelector("#general .btn-primary");
  if(generalSaveBtn) {
      generalSaveBtn.addEventListener('click', () => saveSettings('general'));
  }
  
  // Notification Settings
  const notifSaveBtn = document.querySelector("#notifications .btn-primary");
  if(notifSaveBtn) {
      notifSaveBtn.addEventListener('click', () => saveSettings('notifications'));
  }
  
  // Payment/Rate Update
  const rateUpdateBtn = document.querySelector("#payment .btn-primary:last-of-type"); // The update rate button
  if(rateUpdateBtn) {
      rateUpdateBtn.addEventListener('click', updateHourlyRate);
  }
});

async function loadSettings() {
    const user = api.getUserInfo();
    if(!user) return;

    try {
        const settings = await api.getInterviewerSettings(user.id);
        if(settings) {
            // General
            const selects = document.querySelectorAll("#general select");
            if(selects[0]) selects[0].value = settings.language || "English";
            // theme is selects[1]
            if(selects[2]) selects[2].value = settings.timezone || "UTC";

            // Notifications
            const notifToggles = document.querySelectorAll("#notifications .toggle-switch");
            // Assuming order: Email, Reminders, Opportunities, Payment, SMS
            updateToggleState(notifToggles[0], settings.emailNotificationsEnabled);
            updateToggleState(notifToggles[1], settings.interviewRemindersEnabled);
            // others not yet in backend entity
            
            // Payment method logic can be added here
        }
        
        // Load rate from profile
        const profile = await api.getUserProfile();
        if(profile && profile.hourlyRate) {
            const rateInput = document.querySelector("#payment input[type='number']");
            if(rateInput) rateInput.value = profile.hourlyRate;
        }

    } catch(e) {
        console.error("Failed to load settings", e);
    }
}

function updateToggleState(button, state) {
    if(!button) return;
    if(state) button.classList.add('on');
    else button.classList.remove('on');
}

async function saveSettings(section) {
    const user = api.getUserInfo();
    if(!user) return;

    let settings = {};
    // Fetch current settings to merge
    try {
        const current = await api.getInterviewerSettings(user.id);
        Object.assign(settings, current);
    } catch(e) {}

    if(section === 'general') {
        const selects = document.querySelectorAll("#general select");
        if(selects[0]) settings.language = selects[0].value;
        if(selects[2]) settings.timezone = selects[2].value;
    } else if (section === 'notifications') {
        const notifToggles = document.querySelectorAll("#notifications .toggle-switch");
        settings.emailNotificationsEnabled = notifToggles[0].classList.contains('on');
        settings.interviewRemindersEnabled = notifToggles[1].classList.contains('on');
    }

    try {
        await api.updateInterviewerSettings(user.id, settings);
        alert("Settings saved successfully");
    } catch(e) {
        alert("Failed to save settings: " + e.message);
    }
}

async function updateHourlyRate() {
    const rateInput = document.querySelector("#payment input[type='number']");
    if(!rateInput) return;
    
    const rate = parseFloat(rateInput.value);
    
    try {
        await api.updateUserProfile({ hourlyRate: rate });
        alert("Hourly rate updated successfully");
    } catch(e) {
         alert("Failed to update rate: " + e.message);
    }
}
window.logout = function() {
    api.clearToken();
    window.location.href = '/login/login.html';

};