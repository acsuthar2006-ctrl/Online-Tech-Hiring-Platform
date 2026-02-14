import { api } from '../common/api.js';

// State
let selectedRole = "";

// Function to handle role selection
function selectRole(role) {
  console.log("Role selected:", role);
  selectedRole = role;
  
  // Update UI
  const roleSection = document.getElementById("roleSelection");
  const formContainer = document.getElementById("loginFormContainer");
  
  if (roleSection) roleSection.style.display = "none";
  if (formContainer) formContainer.style.display = "block";
  
  // Update form title
  const title = role === 'interviewer' ? 'Login as Interviewer' : 'Login as Candidate';
  const titleEl = document.getElementById("formTitle");
  if(titleEl) titleEl.textContent = title;
}

// Function to handle login submission
async function handleLogin(e) {
  e.preventDefault();
  console.log("Handle Login Called");

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  if (!emailInput || !passwordInput) {
      console.error("Email or Password input not found");
      return;
  }

  const email = emailInput.value;
  const password = passwordInput.value;
  const errorMessage = document.getElementById('error-message') || createErrorElement();
  const loginBtn = document.querySelector('button[type="submit"]');
  const originalBtnText = loginBtn ? loginBtn.textContent : 'Login';

  try {
    // Disable button and show loading state
    if(loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
    }
    
    if(errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        errorMessage.classList.remove('api-error');
    }

    // Call API
    console.log("Attempting login with:", email);
    const response = await api.login(email, password);
    console.log("Login success, response:", response);

    // Redirect based on role received from backend
    if (response.role === 'INTERVIEWER') {
       sessionStorage.setItem('userRole', 'INTERVIEWER');
       window.location.href = '/interviewer/interviewer-dashboard.html';
    } else {
       sessionStorage.setItem('userRole', 'CANDIDATE');
       window.location.href = '/candidate/candidate-dashboard.html';
    }

  } catch (error) {
    console.error('Login error:', error);
    if(errorMessage) {
        errorMessage.textContent = error.message || 'Invalid email or password';
        errorMessage.style.display = 'block';
        errorMessage.style.color = 'red';
        errorMessage.style.marginTop = '10px';
    } else {
        alert(error.message || 'Login failed');
    }
  } finally {
    if(loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = originalBtnText;
    }
  }
}

function createErrorElement() {
    const form = document.getElementById('loginForm');
    const div = document.createElement('div');
    div.id = 'error-message';
    div.style.color = 'red';
    div.style.display = 'none';
    form.appendChild(div);
    return div;
}

// Attach event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Login module loaded");

    const candidateBtn = document.getElementById('btn-role-candidate');
    if (candidateBtn) {
        candidateBtn.addEventListener('click', () => selectRole('candidate'));
    }

    const interviewerBtn = document.getElementById('btn-role-interviewer');
    if (interviewerBtn) {
        interviewerBtn.addEventListener('click', () => selectRole('interviewer'));
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
