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
    input.addEventListener('input', updateEmailPreview);
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

  const candidateEmails = document.getElementById('candidateEmails').value;
  const companyName = document.getElementById('companyName').value;
  const positionTitle = document.getElementById('positionTitle').value;
  const interviewDate = document.getElementById('interviewDate').value;
  const interviewTime = document.getElementById('interviewTime').value;
  const roomId = document.getElementById('roomId').value;
  const duration = document.getElementById('duration').value;
  const interviewType = document.getElementById('interviewType').value;
  const additionalNotes = document.getElementById('additionalNotes').value;

  const emails = candidateEmails.split(',').map(e => e.trim()).filter(e => e);
  if (emails.length === 0) {
    alert('Please enter at least one candidate email.');
    return;
  }

  try {
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
    alert('Interview scheduled successfully and invitation sent!');
    document.getElementById('scheduleForm').reset();
    updateEmailPreview();
  } catch (error) {
    console.error('Failed to schedule interview:', error);
    alert('Failed to schedule interview: ' + error.message);
  }
}

window.resetForm = () => {
  document.getElementById('scheduleForm').reset();
  updateEmailPreview();
};
