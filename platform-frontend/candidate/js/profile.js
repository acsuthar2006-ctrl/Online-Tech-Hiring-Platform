import { api } from '../../common/api.js';

document.addEventListener("DOMContentLoaded", async () => {
  const userInfo = api.getUserInfo();
  if (userInfo) {
       const profileName = document.getElementById("profileUsername");
       if(profileName) profileName.textContent = userInfo.fullName;
  }

  try {
      const profile = await api.getUserProfile();
      populateForm(profile);
  } catch (error) {
      console.error("Failed to load profile", error);
  }
});

function populateForm(profile) {
   if (profile.fullName) document.getElementById("fullName").value = profile.fullName;
   if (profile.email) document.getElementById("email").value = profile.email;
   if (profile.phone) document.getElementById("phone").value = profile.phone;
   // Location might not be in basic profile yet, need to check backend Entity
}

// Save profile data
const saveBtn = document.querySelector('.btn-primary'); // Assuming there is a save button
if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
        // e.preventDefault(); // If it's a form submit
        const data = {
            fullName: document.getElementById("fullName").value,
            phone: document.getElementById("phone").value,
            // email might be read-only
        };
        
        try {
            await api.updateUserProfile(data);
            alert("Profile updated successfully");
            // Update session cache
            const currentUser = api.getUserInfo();
            if (currentUser) {
                currentUser.fullName = data.fullName;
                api.setUserInfo(currentUser);
            }
        } catch (error) {
            alert("Failed to update profile: " + error.message);
        }
    });
}
