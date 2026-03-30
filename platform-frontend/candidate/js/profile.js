import { api } from '../../common/api.js';
import { initNotifications } from '../../common/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeProfile();
  setupActions();
});

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMonthYear(dateStr) {
  try {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatDateRange(startDate, endDate) {
  const start = startDate ? formatMonthYear(startDate) : '';
  const end = endDate ? formatMonthYear(endDate) : '';
  if (start && end) return `${start} - ${end}`;
  if (start && !end) return `${start} - Present`;
  return '';
}

async function initializeProfile() {
  try {
    const profile = await api.getUserProfile();
    if (!profile) return;

    const headerName = document.getElementById('profileName');
    if (headerName) headerName.textContent = profile.fullName || 'User';

    const profileUsername = document.getElementById('profileUsername');
    if (profileUsername) profileUsername.textContent = profile.fullName || 'User';

    const memberSince = document.getElementById('memberSince');
    if (memberSince) {
      const when = formatMonthYear(profile.createdAt);
      memberSince.textContent = when ? `Member since ${when}` : '';
    }

    populatePersonalInfo(profile);

    await loadCandidateSections(profile);
    await loadInterviewStats(profile);
  } catch (error) {
    console.error('Failed to load profile', error);
  }
}

function populatePersonalInfo(profile) {
  if (profile.fullName) document.getElementById('fullName').value = profile.fullName;
  if (profile.email) document.getElementById('email').value = profile.email;
  if (profile.phone) document.getElementById('phone').value = profile.phone;
  if (profile.bio) document.getElementById('bio').value = profile.bio;
  if (profile.location) document.getElementById('location').value = profile.location;

  const viewResumeBtn = document.getElementById('viewResumeBtn');
  if (viewResumeBtn) {
    if (profile.hasResume) {
      viewResumeBtn.style.display = 'block';
      viewResumeBtn.onclick = () => window.open(`/api/users/${profile.id}/resume`, '_blank');
    } else {
      viewResumeBtn.style.display = 'none';
    }
  }
}

async function loadCandidateSections(profile) {
  const skillsContainer = document.getElementById('skillsContainer');
  const experienceList = document.getElementById('experienceList');
  const educationList = document.getElementById('educationList');

  if (skillsContainer) skillsContainer.innerHTML = '<p class="text-muted">Loading...</p>';
  if (experienceList) experienceList.innerHTML = '<p class="text-muted">Loading...</p>';
  if (educationList) educationList.innerHTML = '<p class="text-muted">Loading...</p>';

  const full = await api.getCandidateFullProfile(profile.id);

  if (skillsContainer) {
    const skills = full?.skills || [];
    if (skills.length === 0) {
      skillsContainer.innerHTML = '<p class="text-muted">No skills added yet.</p>';
    } else {
      skillsContainer.innerHTML = skills
        .map((s) => `<span class="skill-tag" data-skill-id="${s.id}">${escapeHtml(s.skillName)}</span>`)
        .join('');
    }
  }

  if (experienceList) {
    const exp = full?.experience || [];
    if (exp.length === 0) {
      experienceList.innerHTML = '<p class="text-muted">No experience added yet.</p>';
    } else {
      experienceList.innerHTML = exp
        .map(
          (e) => `
          <div class="experience-item">
            <div class="experience-logo"></div>
            <div class="experience-content">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
                <div>
                  <h4>${escapeHtml(e.jobTitle)}</h4>
                  <p class="company-name">${escapeHtml(e.companyName)}</p>
                  <p class="date-range">${escapeHtml(formatDateRange(e.startDate, e.endDate))}</p>
                </div>
                <button class="btn-text" data-exp-id="${e.id}">Remove</button>
              </div>
              ${e.description ? `<p class="experience-description">${escapeHtml(e.description)}</p>` : ''}
            </div>
          </div>
        `
        )
        .join('');
    }
  }

  if (educationList) {
    const edus = full?.education || [];
    if (edus.length === 0) {
      educationList.innerHTML = '<p class="text-muted">No education added yet.</p>';
    } else {
      educationList.innerHTML = edus
        .map(
          (ed) => `
          <div class="education-item">
            <div class="education-icon"></div>
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;width:100%;">
              <div>
                <h4>${escapeHtml(ed.degree)}${ed.fieldOfStudy ? ` in ${escapeHtml(ed.fieldOfStudy)}` : ''}</h4>
                <p class="text-muted">${escapeHtml(ed.schoolName)}${ed.graduationDate ? ` · ${escapeHtml(formatMonthYear(ed.graduationDate))}` : ''}</p>
              </div>
              <button class="btn-text" data-edu-id="${ed.id}">Remove</button>
            </div>
          </div>
        `
        )
        .join('');
    }
  }
}

async function loadInterviewStats(profile) {
  const totalEl = document.getElementById('statTotalInterviews');
  const completedEl = document.getElementById('statCompletedInterviews');
  const pendingEl = document.getElementById('statPendingInterviews');

  if (totalEl) totalEl.textContent = '--';
  if (completedEl) completedEl.textContent = '--';
  if (pendingEl) pendingEl.textContent = '--';

  if (!profile?.email) return;

  try {
    const interviews = await api.getUpcomingInterviews(profile.email);
    const total = interviews?.length || 0;
    const completed = (interviews || []).filter((i) => i.status === 'COMPLETED').length;
    const pending = total - completed;

    if (totalEl) totalEl.textContent = String(total);
    if (completedEl) completedEl.textContent = String(completed);
    if (pendingEl) pendingEl.textContent = String(pending);
  } catch (e) {
    console.warn('Failed to load interview stats', e);
  }
}

function setupActions() {
  const savePersonalInfoBtn = document.getElementById('savePersonalInfoBtn');
  if (savePersonalInfoBtn) {
    savePersonalInfoBtn.addEventListener('click', async () => {
      const data = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        bio: document.getElementById('bio').value,
        location: document.getElementById('location').value,
      };

      try {
        await api.updateUserProfile(data);
        alert('Profile updated successfully');

        await initNotifications();

        const currentUser = api.getUserInfo();
        if (currentUser) {
          currentUser.fullName = data.fullName;
          api.setUserInfo(currentUser);
        }

        const profileUsername = document.getElementById('profileUsername');
        if (profileUsername) profileUsername.textContent = data.fullName;

        const headerName = document.getElementById('profileName');
        if (headerName) headerName.textContent = data.fullName;
      } catch (error) {
        alert('Failed to update profile: ' + error.message);
      }
    });
  }

  const resumeUpload = document.getElementById('resumeUpload');
  if (resumeUpload) {
    resumeUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed');
        resumeUpload.value = '';
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const token = sessionStorage.getItem('jwt_token');
        const res = await fetch('/api/users/resume', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }, // Do NOT set Content-Type header so the browser sets the multipart boundary automatically
          body: formData
        });
        
        if (!res.ok) throw new Error(await res.text());
        alert('Resume uploaded successfully!');
        
        const profile = await api.getUserProfile();
        populatePersonalInfo(profile);
      } catch (err) {
        alert('Upload failed: ' + err.message);
      } finally {
        resumeUpload.value = '';
      }
    });
  }

  const manageSkillsBtn = document.getElementById('manageSkillsBtn');
  if (manageSkillsBtn) {
    manageSkillsBtn.addEventListener('click', async () => {
      const profile = await api.getUserProfile();
      const skillName = prompt('Enter a skill (e.g., React, Java):');
      if (!skillName || !skillName.trim()) return;
      const proficiencyLevel = prompt('Proficiency (optional): beginner / intermediate / advanced / expert') || null;

      try {
        await api.addCandidateSkill(profile.id, { skillName: skillName.trim(), proficiencyLevel });
        await loadCandidateSections(profile);
        await initNotifications();
      } catch (e) {
        alert('Failed to add skill: ' + e.message);
      }
    });
  }

  const addExperienceBtn = document.getElementById('addExperienceBtn');
  if (addExperienceBtn) {
    addExperienceBtn.addEventListener('click', async () => {
      const profile = await api.getUserProfile();
      const jobTitle = prompt('Job title:');
      if (!jobTitle || !jobTitle.trim()) return;
      const companyName = prompt('Company name:');
      if (!companyName || !companyName.trim()) return;

      const startDate = prompt('Start date (YYYY-MM-DD, optional):') || null;
      const endDate = prompt('End date (YYYY-MM-DD, optional, leave blank if current):') || null;
      const description = prompt('Description (optional):') || null;

      try {
        await api.addCandidateExperience(profile.id, {
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          startDate: startDate || null,
          endDate: endDate || null,
          description: description || null,
        });
        await loadCandidateSections(profile);
        await initNotifications();
      } catch (e) {
        alert('Failed to add experience: ' + e.message);
      }
    });
  }

  const addEducationBtn = document.getElementById('addEducationBtn');
  if (addEducationBtn) {
    addEducationBtn.addEventListener('click', async () => {
      const profile = await api.getUserProfile();
      const schoolName = prompt('School / University name:');
      if (!schoolName || !schoolName.trim()) return;
      const degree = prompt('Degree (e.g., BSc, BE, MSc):');
      if (!degree || !degree.trim()) return;

      const fieldOfStudy = prompt('Field of study (optional):') || null;
      const graduationDate = prompt('Graduation date (YYYY-MM-DD, optional):') || null;

      try {
        await api.addCandidateEducation(profile.id, {
          schoolName: schoolName.trim(),
          degree: degree.trim(),
          fieldOfStudy: fieldOfStudy || null,
          graduationDate: graduationDate || null,
        });
        await loadCandidateSections(profile);
        await initNotifications();
      } catch (e) {
        alert('Failed to add education: ' + e.message);
      }
    });
  }

  const experienceList = document.getElementById('experienceList');
  if (experienceList) {
    experienceList.addEventListener('click', async (e) => {
      const btn = e.target?.closest?.('button[data-exp-id]');
      if (!btn) return;
      const expId = btn.getAttribute('data-exp-id');
      if (!expId) return;
      if (!confirm('Remove this experience?')) return;

      try {
        await api.deleteCandidateExperience(expId);
        const profile = await api.getUserProfile();
        await loadCandidateSections(profile);
        await initNotifications();
      } catch (err) {
        alert('Failed to remove experience: ' + err.message);
      }
    });
  }

  const educationList = document.getElementById('educationList');
  if (educationList) {
    educationList.addEventListener('click', async (e) => {
      const btn = e.target?.closest?.('button[data-edu-id]');
      if (!btn) return;
      const eduId = btn.getAttribute('data-edu-id');
      if (!eduId) return;
      if (!confirm('Remove this education entry?')) return;

      try {
        await api.deleteCandidateEducation(eduId);
        const profile = await api.getUserProfile();
        await loadCandidateSections(profile);
        await initNotifications();
      } catch (err) {
        alert('Failed to remove education: ' + err.message);
      }
    });
  }
}

