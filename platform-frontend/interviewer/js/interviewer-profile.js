import { api } from '../../common/api.js';
import { createErrorState } from '../../common/dashboard-utils.js';

document.addEventListener("DOMContentLoaded", () => {
    initializeProfile();
    setupEventListeners();
});

async function initializeProfile() {
    const profileNameEl = document.getElementById("profileName");
    const profileUsernameEl = document.getElementById('profileUsername');

    try {
        const profile = await api.getUserProfile();
        if (profile) {
            // Update header and profile name
            if (profileNameEl) profileNameEl.textContent = profile.fullName;
            if (profileUsernameEl) profileUsernameEl.textContent = profile.fullName;

            populateProfileFields(profile);

            // Fetch expertise separately
            try {
                const expertise = await api.getInterviewerExpertise(profile.id);
                renderExpertise(expertise);
            } catch (expError) {
                console.error('Failed to load expertise:', expError);
            }
        }
    } catch (error) {
        console.error("Failed to load profile", error);
        alert('Failed to load profile data. Some information might be missing.');
    }
}

function populateProfileFields(profile) {
    // Fill form fields
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.querySelector('input[type="email"]');
    const phoneInput = document.querySelector('input[type="tel"]');
    const bioTextarea = document.querySelector('textarea');

    if (profile.fullName) {
        const nameParts = profile.fullName.split(' ');
        if (firstNameInput) firstNameInput.value = nameParts[0] || '';
        if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';

        // Backward compatibility for old fullName ID if it exists
        const oldFullNameEl = document.getElementById("fullName");
        if (oldFullNameEl) oldFullNameEl.value = profile.fullName;
    }

    if (emailInput && profile.email) emailInput.value = profile.email;
    if (phoneInput && profile.phone) phoneInput.value = profile.phone;
    if (bioTextarea && profile.bio) bioTextarea.value = profile.bio;
}

function renderExpertise(expertise) {
    const expertiseLists = document.querySelectorAll('.expertise-list');
    if (expertiseLists.length === 0) return;

    // Primary focus areas
    const focusList = expertiseLists[0];
    focusList.innerHTML = '';

    if (!expertise || expertise.length === 0) {
        focusList.innerHTML = '<span class="text-muted">No expertise tags added yet.</span>';
        return;
    }

    expertise.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'expertise-tag';
        tag.textContent = item.name;
        focusList.appendChild(tag);
    });
}

function setupEventListeners() {
    const saveBtn = document.querySelector('.btn-primary');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const data = {
                fullName: `${firstName} ${lastName}`.trim(),
                phone: document.querySelector('input[type="tel"]')?.value || null,
                bio: document.querySelector('textarea')?.value || null
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

                // Refresh header name
                const profileNameEl = document.getElementById("profileName");
                if (profileNameEl) profileNameEl.textContent = data.fullName;

            } catch (error) {
                alert("Failed to update profile: " + error.message);
            }
        });
    }
}
