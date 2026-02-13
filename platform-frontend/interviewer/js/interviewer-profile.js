import { api } from '../../common/api.js';

document.addEventListener("DOMContentLoaded", async () => {
  const userInfo = api.getUserInfo();
  if (userInfo) {
       // Update header name
       const profileNameEl = document.getElementById("profileName");
       if(profileNameEl) profileNameEl.textContent = userInfo.fullName;
  }

  try {
      const profile = await api.getUserProfile();
      populateForm(profile);
  } catch (error) {
      console.error("Failed to load profile", error);
  }
});

function populateForm(profile) {
   if (profile.fullName) {
       const el = document.getElementById("fullName");
       if(el) el.value = profile.fullName;
   }
   if (profile.email) {
       const el = document.getElementById("email");
       if(el) el.value = profile.email;
   }
   if (profile.phone) {
       const el = document.getElementById("phone");
       if(el) el.value = profile.phone;
   }
}

// Save profile data
const saveBtn = document.querySelector('.btn-primary'); 
if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
        // e.preventDefault(); // If it's in a form
        const data = {
            fullName: document.getElementById("fullName").value,
            phone: document.getElementById("phone") ? document.getElementById("phone").value : null,
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
