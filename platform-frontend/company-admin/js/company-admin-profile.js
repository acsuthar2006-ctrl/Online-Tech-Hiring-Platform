import { api } from '../../common/api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const userInfo = api.getUserInfo();
    if (!userInfo || !userInfo.companyId) {
        console.error("No company ID found for the current user.");
        return;
    }

    try {
        await loadProfile(userInfo.companyId);
    } catch (e) {
        console.error("Error loading profile:", e);
    }

    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
        const data = {
            companyId: userInfo.companyId,
            companyName: document.getElementById('companyNameInput').value,
            industry: document.getElementById('industryInput').value,
            phone: document.getElementById('phoneInput').value,
            location: document.getElementById('locationInput').value,
            website: document.getElementById('websiteInput').value,
            description: document.getElementById('descriptionInput').value,
            adminName: document.getElementById('adminNameInput').value
        };

        try {
            await api.updateCompanyProfile(data);
            alert('Profile updated successfully!');
            await loadProfile(userInfo.companyId); // Reload to reflect updates

            // Update session cache string if needed
            userInfo.companyName = data.companyName;
            api.setUserInfo(userInfo);

            // Update top right header
            const headerRole = document.querySelector('.profile-role');
            if (headerRole) {
                headerRole.textContent = data.companyName;
            }

        } catch (e) {
            alert('Failed to update profile: ' + e.message);
        }
    });
});

async function loadProfile(companyId) {
    const profile = await api.getCompanyProfile(companyId);

    // Header section
    document.getElementById('companyName').textContent = profile.companyName || 'Company Name';
    document.getElementById('companyEmail').textContent = profile.companyEmail || profile.adminEmail || '';

    // Inputs
    document.getElementById('companyNameInput').value = profile.companyName || '';
    document.getElementById('industryInput').value = profile.industry || '';
    document.getElementById('companyEmailInput').value = profile.companyEmail || profile.adminEmail || ''; // usually read-only
    document.getElementById('phoneInput').value = profile.phone || '';
    document.getElementById('locationInput').value = profile.location || '';
    document.getElementById('websiteInput').value = profile.website || '';
    document.getElementById('descriptionInput').value = profile.description || '';
    document.getElementById('adminNameInput').value = profile.adminName || '';
    document.getElementById('adminEmailInput').value = profile.adminEmail || '';
}
