import { api } from '../../common/api.js';

// Load initial data
document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const profile = await api.getUserProfile();
    if (profile) {
      // Update email input
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) emailInput.value = profile.email || '';

      // Update username input
      const usernameInput = document.getElementById("usernameInput");
      if (usernameInput) usernameInput.value = profile.fullName || '';
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

function setupEventListeners() {
  // Tab switching
  const menuItems = document.querySelectorAll(".settings-menu-item");
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const tabName = item.getAttribute('href').substring(1);
      switchTab(e, tabName);
    });
  });

  // Toggle switches (Mock)
  const toggles = document.querySelectorAll(".toggle-switch input");
  toggles.forEach((toggle) => {
    toggle.addEventListener("change", () => {
      console.log("Setting changed:", toggle.checked, "(Update API missing)");
    });
  });
}

function switchTab(event, tabName) {
  event.preventDefault();

  // Hide all tabs
  const tabs = document.querySelectorAll(".settings-tab");
  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remove active class from all menu items
  const menuItems = document.querySelectorAll(".settings-menu-item");
  menuItems.forEach((item) => {
    item.classList.remove("active");
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  // Add active class to clicked menu item
  event.target.closest(".settings-menu-item").classList.add("active");
}

// Global functions for inline onclick handlers (if still used)
window.switchTab = switchTab;

window.updateUsername = async () => {
  const input = document.getElementById("usernameInput");
  alert(`Update request for "${input.value}" sent. Note: Backend update API is missing.`);
};
