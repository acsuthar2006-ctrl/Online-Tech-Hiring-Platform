import { api } from '../../common/api.js';
import { createErrorState } from '../../common/dashboard-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    initializeProfile();
});

async function initializeProfile() {
    const container = document.querySelector('.profile-container');
    const profileName = document.getElementById('profileName');

    try {
        const profile = await api.getUserProfile();
        if (profile) {
            profileName.textContent = profile.fullName;
            populateProfileFields(profile);

            // Fetch expertise separately since it's a separate endpoint
            const expertise = await api.getInterviewerExpertise(profile.id);
            renderExpertise(expertise);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        // Don't replace the whole container as it has a form, just show an error toast or message
        alert('Failed to load profile data. Some information might be missing.');
    }
}

function populateProfileFields(profile) {
    // Basic Info
    document.getElementById('profileUsername').textContent = profile.fullName;

    // Split full name into first and last for the form
    const nameParts = profile.fullName.split(' ');
    document.getElementById('firstName').value = nameParts[0] || '';
    document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';

    // Other fields (might be missing in DTO, so use placeholders/existing values)
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) emailInput.value = profile.email;

    const phoneInput = document.querySelector('input[type="tel"]');
    if (phoneInput && profile.phone) phoneInput.value = profile.phone;

    const bioTextarea = document.querySelector('textarea');
    if (bioTextarea && profile.bio) bioTextarea.value = profile.bio;

    // Stats (Mocking/Calculating where possible)
    // In a real app, these would come from the profile object
    const statsNumbers = document.querySelectorAll('.profile-stat-number');
    if (statsNumbers.length >= 3) {
        // statsNumbers[0].textContent = profile.totalInterviewsConducted || '0';
        // statsNumbers[1].textContent = profile.averageRating ? profile.averageRating.toFixed(1) : '0.0';
        // statsNumbers[2].textContent = `$${profile.totalEarnings ? profile.totalEarnings.toLocaleString() : '0'}`;
    }
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
        tag.textContent = item.name; // Assuming InterviewerExpertise has a 'name' field
        focusList.appendChild(tag);
    });
}
