import { api } from '../../common/api.js';
import { initNotifications } from '../../common/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeProfile();
  setupEventListeners();
});

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function initializeProfile() {
  const profileNameEl = document.getElementById('profileName');
  const profileUsernameEl = document.getElementById('profileUsername');

  try {
    const profile = await api.getUserProfile();
    if (!profile) return;

    if (profileNameEl) profileNameEl.textContent = profile.fullName || 'Interviewer';
    if (profileUsernameEl) profileUsernameEl.textContent = profile.fullName || 'Interviewer';

    populateProfileFields(profile);
    populateStats(profile);

    try {
      const expertise = await api.getInterviewerExpertise(profile.id);
      renderExpertise(expertise);
        await initNotifications();
      } catch (expError) {
      console.error('Failed to load expertise:', expError);
      renderExpertise([]);
    }
  } catch (error) {
    console.error('Failed to load profile', error);
    alert('Failed to load profile data. Some information might be missing.');
  }
}

function populateProfileFields(profile) {
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const bioTextarea = document.getElementById('bio');

  const availabilitySelect = document.getElementById('availabilityStatus');

  if (profile.fullName) {
    const nameParts = profile.fullName.split(' ');
    if (firstNameInput) firstNameInput.value = nameParts[0] || '';
    if (lastNameInput) lastNameInput.value = nameParts.slice(1).join(' ') || '';

    const oldFullNameEl = document.getElementById('fullName');
    if (oldFullNameEl) oldFullNameEl.value = profile.fullName;
  }

  if (emailInput) emailInput.value = profile.email || '';
  if (phoneInput) phoneInput.value = profile.phone || '';
    if (bioTextarea) bioTextarea.value = profile.bio || '';

    if (availabilitySelect) availabilitySelect.value = profile.availabilityStatus || 'AVAILABLE';
}

function populateStats(profile) {
  const interviews = profile.totalInterviewsConducted != null ? profile.totalInterviewsConducted : null;

  const topInterviews = document.getElementById('statInterviews');

  if (topInterviews) topInterviews.textContent = interviews != null ? String(interviews) : '--';

  const statTotalInterviews = document.getElementById('statTotalInterviews');

  if (statTotalInterviews) statTotalInterviews.textContent = interviews != null ? String(interviews) : '--';
}

function renderExpertise(expertise) {
  const list = document.getElementById('expertiseList');
  if (!list) return;

  if (!expertise || expertise.length === 0) {
    list.innerHTML = '<span class="text-muted" style="font-size:13px;">No expertise added yet.</span>';
    return;
  }

  list.innerHTML = expertise
    .map((e) => {
      const years = e.yearsOfExperience != null ? ` (${e.yearsOfExperience}y)` : '';
      return `
        <span class="expertise-tag" style="display:inline-flex;align-items:center;gap:8px;">
          ${escapeHtml(e.expertiseArea)}${escapeHtml(years)}
          <button class="btn-text" data-expertise-id="${e.id}" style="padding:0;">Remove</button>
        </span>
      `;
    })
    .join('');
}

function setupEventListeners() {
  const savePersonalInfoBtn = document.getElementById('savePersonalBtn');
  if (savePersonalInfoBtn) {
    savePersonalInfoBtn.addEventListener('click', async () => {
      const firstName = document.getElementById('firstName')?.value || '';
      const lastName = document.getElementById('lastName')?.value || '';

      const data = {
        fullName: `${firstName} ${lastName}`.trim(),
        phone: document.getElementById('phone')?.value || null,
        bio: document.getElementById('bio')?.value || null,
      };

      await updateInterviewerProfile(data);
    });
  }

  const saveProfessionalBtn = document.getElementById('saveProfessionalBtn');
  if (saveProfessionalBtn) {
    saveProfessionalBtn.addEventListener('click', async () => {
      const availabilitySelect = document.getElementById('availabilityStatus');

      const data = {
        availabilityStatus: availabilitySelect ? availabilitySelect.value : null,
      };

      await updateInterviewerProfile(data);
    });
  }

  const editExpertiseBtn = document.getElementById('editExpertiseBtn');
  if (editExpertiseBtn) {
    editExpertiseBtn.addEventListener('click', async () => {
      const profile = await api.getUserProfile();
      const expertiseArea = prompt('Expertise area (e.g., System Design, React):');
      if (!expertiseArea || !expertiseArea.trim()) return;
      const yearsStr = prompt('Years of experience (optional):');
      const yearsOfExperience = yearsStr && yearsStr.trim() ? Number(yearsStr) : null;

      try {
        await api.addInterviewerExpertise(profile.id, {
          expertiseArea: expertiseArea.trim(),
          yearsOfExperience: Number.isFinite(yearsOfExperience) ? yearsOfExperience : null,
        });

        const expertise = await api.getInterviewerExpertise(profile.id);
        renderExpertise(expertise);
        await initNotifications();
      } catch (err) {
        alert('Failed to add expertise: ' + err.message);
      }
    });
  }

  const expertiseList = document.getElementById('expertiseList');
  if (expertiseList) {
    expertiseList.addEventListener('click', async (e) => {
      const btn = e.target?.closest?.('button[data-expertise-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-expertise-id');
      if (!id) return;
      if (!confirm('Remove this expertise?')) return;

      try {
        await api.deleteInterviewerExpertise(id);
        const profile = await api.getUserProfile();
        const expertise = await api.getInterviewerExpertise(profile.id);
        renderExpertise(expertise);
        await initNotifications();
      } catch (err) {
        alert('Failed to remove expertise: ' + err.message);
      }
    });
  }
}

async function updateInterviewerProfile(data) {
  try {
    const updated = await api.updateUserProfile(data);
    alert('Profile updated successfully');

    await initNotifications();

    if (data.fullName) {
      const currentUser = api.getUserInfo();
      if (currentUser) {
        currentUser.fullName = data.fullName;
        api.setUserInfo(currentUser);
      }

      const profileNameEl = document.getElementById('profileName');
      if (profileNameEl) profileNameEl.textContent = data.fullName;
      const profileUsernameEl = document.getElementById('profileUsername');
      if (profileUsernameEl) profileUsernameEl.textContent = data.fullName;
    }

    // Refresh stats if backend returned them.
    if (updated) populateStats(updated);
  } catch (error) {
    alert('Failed to update profile: ' + error.message);
  }
}

