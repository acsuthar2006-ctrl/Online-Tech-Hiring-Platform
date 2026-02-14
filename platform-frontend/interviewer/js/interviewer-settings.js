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
  
  // Bind save button if exists
  const saveBtn = document.querySelector('.btn-primary');
  if(saveBtn) {
      saveBtn.addEventListener('click', updateProfile);
  }
});

window.switchTab = switchTab;
window.toggleSwitch = toggleSwitch;
window.logout = function() {
    api.clearToken();
    window.location.href = '/login/login.html';

};