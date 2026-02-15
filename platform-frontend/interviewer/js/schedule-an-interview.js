import { api } from '../../common/api.js';

document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  setupFormListeners();
});

async function loadUserInfo() {
  try {
    const profile = await api.getUserProfile();
    if (profile) {
      document.getElementById('profileName').textContent = profile.fullName;
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

function setupFormListeners() {
  const form = document.getElementById('scheduleForm');
  const inputs = form.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    input.addEventListener('input', () => {
        updateEmailPreview();
        clearError(input);
    });
  });

  form.onsubmit = scheduleInterview;
}

function updateEmailPreview() {
  const candidateEmails = document.getElementById('candidateEmails').value;
  const companyName = document.getElementById('companyName').value;
  const positionTitle = document.getElementById('positionTitle').value;
  const interviewDate = document.getElementById('interviewDate').value;
  const interviewTime = document.getElementById('interviewTime').value;
  const roomId = document.getElementById('roomId').value;

  const preview = document.getElementById('emailPreview');
  const emails = candidateEmails.split(',').map(e => e.trim()).filter(e => e);

  if (emails.length === 0 && !companyName) {
    preview.innerHTML = '<p style="color: var(--gray-500);">Email preview will appear here...</p>';
    return;
  }

  preview.innerHTML = `
        <div style="font-family: sans-serif; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
            <p><strong>To:</strong> ${emails.join(', ')}</p>
            <p><strong>Subject:</strong> Interview Invitation: ${positionTitle} at ${companyName}</p>
            <hr>
            <p>Hi there,</p>
            <p>You have been invited for an interview for the <strong>${positionTitle}</strong> position at <strong>${companyName}</strong>.</p>
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${interviewTime}</p>
            <p><strong>Meeting Link:</strong> <a href="#">${roomId}</a></p>
            <p>Best regards,<br>Technical Recruitment Team</p>
        </div>
    `;
}

async function scheduleInterview(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const candidateEmails = document.getElementById('candidateEmails').value;
  const companyName = document.getElementById('companyName').value;
  const positionTitle = document.getElementById('positionTitle').value;
  const interviewDate = document.getElementById('interviewDate').value;
  const interviewTime = document.getElementById('interviewTime').value;
  const roomId = document.getElementById('roomId').value;
  const interviewType = document.getElementById('interviewType').value;
  const additionalNotes = document.getElementById('additionalNotes').value;

  const emails = candidateEmails.split(',').map(e => e.trim()).filter(e => e);
  const submitBtn = document.getElementById('scheduleBtn');
  const originalText = submitBtn.textContent;

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Scheduling...';

    const profile = await api.getUserProfile();

    // The backend expects a single candidate per request based on ScheduleRequest DTO
    // We'll loop if multiple are provided, or just take the first for simplicity in this MVP
    const email = emails[0];

    const payload = {
      interviewerEmail: profile.email,
      candidateEmail: email,
      candidateName: email.split('@')[0], // Mock name from email
      scheduledTime: `${interviewDate}T${interviewTime}:00`,
      title: `${positionTitle} - ${interviewType}`,
      meetingLink: roomId,
      description: additionalNotes || `Interview at ${companyName}`,
      interviewType: interviewType.toUpperCase()
    };

    await api.scheduleInterview(payload);
    
    // Success feedback
    alert('Interview scheduled successfully!'); 
    document.getElementById('scheduleForm').reset();
    updateEmailPreview();
    
    // Clear any lingering errors
    document.querySelectorAll('.input-error').forEach(el => clearError(el));

  } catch (error) {
    console.error('Failed to schedule interview:', error);
    alert('Failed to schedule interview: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function validateForm() {
    let isValid = true;
    const inputs = document.getElementById('scheduleForm').querySelectorAll('input, select, textarea');
    
    // Clear previous errors first? Or just let them update.
    // Let's clear specific fields we are re-validating if we want, but checking all is safer.
    
    // 1. Required Fields
    inputs.forEach(input => {
        if (input.required && !input.value.trim()) {
            showError(input, 'This field is required');
            isValid = false;
        } else {
            clearError(input);
        }
    });

    // 2. Email Validation
    const emailInput = document.getElementById('candidateEmails');
    const emails = emailInput.value.split(',').map(e => e.trim()).filter(e => e);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emails.length === 0) {
        showError(emailInput, 'At least one email is required');
        isValid = false;
    } else {
        const invalidEmails = emails.filter(e => !emailRegex.test(e));
        if (invalidEmails.length > 0) {
            showError(emailInput, `Invalid email(s): ${invalidEmails.join(', ')}`);
            isValid = false;
        }
    }

    // 3. Date/Time Validation
    const dateInput = document.getElementById('interviewDate');
    const timeInput = document.getElementById('interviewTime');
    
    if (dateInput.value && timeInput.value) {
        const scheduledDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
        const now = new Date();
        if (scheduledDateTime < now) {
            showError(dateInput, 'Date cannot be in the past');
            showError(timeInput, 'Time cannot be in the past');
            isValid = false;
        }
    }

    return isValid;
}

function showError(input, message) {
    input.classList.add('input-error');
    
    // Check if error text already exists
    let errorDisplay = input.parentNode.querySelector('.error-text');
    if (!errorDisplay) {
        errorDisplay = document.createElement('span');
        errorDisplay.className = 'error-text';
        input.parentNode.appendChild(errorDisplay);
    }
    errorDisplay.textContent = message;
}

function clearError(input) {
    input.classList.remove('input-error');
    const errorDisplay = input.parentNode.querySelector('.error-text');
    if (errorDisplay) {
        errorDisplay.remove();
    }
}

window.resetForm = () => {
  document.getElementById('scheduleForm').reset();
  updateEmailPreview();
};

window.scheduleInterview = scheduleInterview;
