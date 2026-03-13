import { api } from './api.js';
import { initNotifications } from './notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
  const isLoggedIn = sessionStorage.getItem('jwt_token');
  if (!isLoggedIn) {
    window.location.href = '/login/login.html';
    return;
  }

  const userInfo = api.getUserInfo();
  const username = userInfo?.fullName || 'User';

  // Update all username displays where present.
  const userNameElements = document.querySelectorAll('#userName, #profileName');
  userNameElements.forEach((element) => {
    element.textContent = username;
  });

  await initNotifications();
});
