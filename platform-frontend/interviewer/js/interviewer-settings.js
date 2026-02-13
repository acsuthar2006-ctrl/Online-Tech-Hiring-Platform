import { api } from '../../common/api.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeSettings();
});

async function initializeSettings() {
  const profileName = document.getElementById('profileName');

  try {
    const profile = await api.getUserProfile();
    if (profile) {
      profileName.textContent = profile.fullName;
      populateSettings(profile);
    }
  } catch (error) {
    console.error('Failed to load setttings:', error);
    alert('Failed to load account settings.');
  }
}

function populateSettings(profile) {
  // Payment section
  const rateInput = document.querySelector('input[type="number"]');
  if (rateInput && profile.hourlyRate) {
    rateInput.value = profile.hourlyRate;
  }

  // Security section (Current values)
  const emailFields = document.querySelectorAll('input[type="email"]');
  // Note: interviewer-settings.html doesn't actually have an email field in the static HTML, 
  // it's mostly password fields.
}

window.switchTab = (event, tabName) => {
  const tabs = document.querySelectorAll('.settings-tab');
  const sections = document.querySelectorAll('.settings-section');

  tabs.forEach(tab => tab.classList.remove('active'));
  sections.forEach(section => section.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById(tabName).classList.add('active');
};

window.toggleSwitch = (button) => {
  button.classList.toggle('on');
};

window.updatePassword = () => {
  alert('Password update functionality is in progress.');
};

window.savePaymentDetails = () => {
  alert('Payment details saved successfully! (Mock)');
};