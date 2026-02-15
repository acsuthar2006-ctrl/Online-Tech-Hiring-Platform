import { api } from '../../common/api.js';

document.addEventListener("DOMContentLoaded", async () => {
  const userInfo = api.getUserInfo();
  if (userInfo) {
       const profileName = document.getElementById("profileUsername");
       if(profileName) profileName.textContent = userInfo.fullName;
  }
    // Update headers
    const userNameElements = document.querySelectorAll("#userName, #profileName");
    userNameElements.forEach((element) => {
      element.textContent = userInfo.fullName;
    });

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
   if (profile.bio) document.getElementById("bio").value = profile.bio;
   // Location might not be in basic profile yet
}

// Save profile data
const saveBtn = document.querySelector('.btn-text'); // The "Edit" button in Personal Info card acting as save for now? 
// Actually the "Edit Profile" button is likely the one users expect to work, or the logic needs to be better defined.
// The existing code selected '.btn-primary' which is "Edit Profile" in the header.
// Let's assume the "Edit" button in the card turns into "Save" or we just use a save button.
// For now, I will use the "Edit" button in the card to trigger save if the user changes values, or just add a global save button.
// The previous code attached to .btn-primary. Let's stick to that or better, add a specific ID to the save button if possible, but I cannot easily change the button structure without more context.
// I will target the "Edit" button in the Personal Info card to be a "Save" button for now, or just generic save.

// Re-reading profile.html: There is a "Edit Profile" button in header (.btn-primary) and "Edit" button in card (.btn-text).
// I'll make the "Edit" button in the card a "Save Changes" button for the form.
const personalInfoSaveBtn = document.querySelector('.card-header .btn-text'); 

if (personalInfoSaveBtn) {
    personalInfoSaveBtn.textContent = "Save Changes"; // Change text to indicate action
    personalInfoSaveBtn.addEventListener('click', async (e) => {
        const data = {
            fullName: document.getElementById("fullName").value,
            phone: document.getElementById("phone").value,
            bio: document.getElementById("bio").value,
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
             // Update header name
            const profileName = document.getElementById("profileUsername");
            if(profileName) profileName.textContent = data.fullName;

        } catch (error) {
            alert("Failed to update profile: " + error.message);
        }
    });
}
