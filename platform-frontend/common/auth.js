import { api } from './api.js'
import { Router } from './router.js' // AuthGuard runs on import

// Logout function
function logout() {
  api.clearToken();
  sessionStorage.clear();
  window.location.href = "/login/login.html";
}

// Expose logout to global scope
window.logout = logout;

