// Schedule Interview Functionality

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadUserInfo();
  loadScheduledInterviews();
  setupFormListeners();
});

// Load user information
function loadUserInfo() {
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    const userData = JSON.parse(currentUser);
    document.getElementById('userName').textContent = userData.username;
    document.getElementById('profileName').textContent = userData.username;
  }
}

// Setup form event listeners
function setupFormListeners() {
  const candidateEmails = document.getElementById('candidateEmails');
  const companyName = document.getElementById('companyName');
  const interviewDate = document.getElementById('interviewDate');
  const interviewTime = document.getElementById('interviewTime');
  const roomId = document.getElementById('roomId');
  const duration = document.getElementById('duration');
  const interviewType = document.getElementById('interviewType');
  const roundNumber = document.getElementById('roundNumber');
  const additionalNotes = document.getElementById('additionalNotes');

  // Update email preview when form changes
  candidateEmails.addEventListener('input', updateEmailPreview);
  companyName.addEventListener('input', updateEmailPreview);
  interviewDate.addEventListener('input', updateEmailPreview);
  interviewTime.addEventListener('input', updateEmailPreview);
  roomId.addEventListener('input', updateEmailPreview);
  duration.addEventListener('input', updateEmailPreview);
  interviewType.addEventListener('input', updateEmailPreview);
  roundNumber.addEventListener('input', updateEmailPreview);
  additionalNotes.addEventListener('input', updateEmailPreview);
}

// Parse and display candidate emails
function parseEmails() {
  const emailText = document.getElementById('candidateEmails').value;
  const emails = emailText
    .split(/[,\n]/)
    .map(email => email.trim())
    .filter(email => email && email.includes('@'));
  
  return [...new Set(emails)]; // Remove duplicates
}

// Display email preview
function updateEmailPreview() {
  const emails = parseEmails();
  const companyName = document.getElementById('companyName').value;
  const positionTitle = document.getElementById('positionTitle').value;
  const interviewDate = document.getElementById('interviewDate').value;
  const interviewTime = document.getElementById('interviewTime').value;
  const roomId = document.getElementById('roomId').value;
  const duration = document.getElementById('duration').value;
  const interviewType = document.getElementById('interviewType').value;
  const roundNumber = document.getElementById('roundNumber').value;
  const additionalNotes = document.getElementById('additionalNotes').value;
  const currentUser = localStorage.getItem('currentUser');
  const interviewerName = currentUser ? JSON.parse(currentUser).username : 'Team';

  let previewHTML = '<div style="white-space: pre-wrap;">';
  previewHTML += `<strong>To:</strong> ${emails.join(', ') || 'No emails added'}\n\n`;
  previewHTML += `<strong>Subject:</strong> Interview Invitation - ${companyName} - ${positionTitle}\n\n`;
  previewHTML += `---\n\n`;
  previewHTML += `Dear Candidate,\n\n`;
  previewHTML += `We are pleased to invite you to an interview with <strong>${companyName}</strong>.\n\n`;
  
  if (positionTitle) {
    previewHTML += `<strong>Position:</strong> ${positionTitle}\n`;
  }
  if (roundNumber) {
    const roundMap = { '1': 'Round 1 (Screening)', '2': 'Round 2 (Technical)', '3': 'Round 3 (Final)' };
    previewHTML += `<strong>Round:</strong> ${roundMap[roundNumber] || 'Interview Round'}\n`;
  }
  if (interviewType) {
    previewHTML += `<strong>Interview Type:</strong> ${interviewType}\n`;
  }
  if (interviewDate && interviewTime) {
    previewHTML += `<strong>Date & Time:</strong> ${new Date(interviewDate).toLocaleDateString()} at ${interviewTime}\n`;
  }
  if (duration) {
    previewHTML += `<strong>Duration:</strong> ${duration} minutes\n`;
  }
  if (roomId) {
    previewHTML += `<strong>Meeting Link/Room ID:</strong> ${roomId}\n`;
  }
  
  previewHTML += `\n<strong>Interview Details:</strong>\n`;
  previewHTML += `Please join the interview using the meeting link or room ID provided above.\n`;
  previewHTML += `Make sure to check your internet connection and test your audio/video before the scheduled time.\n`;
  
  if (additionalNotes) {
    previewHTML += `\n<strong>Additional Information:</strong>\n${additionalNotes}\n`;
  }
  
  previewHTML += `\nBest regards,\n`;
  previewHTML += `${interviewerName}\nInterviewPro Team`;
  previewHTML += '</div>';

  document.getElementById('emailPreview').innerHTML = previewHTML;
}

// Schedule interview and send emails
function scheduleInterview(event) {
  event.preventDefault();

  const emails = parseEmails();
  const companyName = document.getElementById('companyName').value;
  const positionTitle = document.getElementById('positionTitle').value;
  const interviewDate = document.getElementById('interviewDate').value;
  const interviewTime = document.getElementById('interviewTime').value;
  const roomId = document.getElementById('roomId').value;
  const duration = document.getElementById('duration').value;
  const interviewType = document.getElementById('interviewType').value;
  const roundNumber = document.getElementById('roundNumber').value;
  const additionalNotes = document.getElementById('additionalNotes').value;

  // Validation
  if (emails.length === 0) {
    alert('Please add at least one candidate email');
    return;
  }

  if (!companyName || !interviewDate || !interviewTime || !roomId) {
    alert('Please fill in all required fields');
    return;
  }

  // Create scheduled interview object
  const scheduledInterview = {
    id: Date.now(),
    companyName,
    positionTitle,
    interviewDate,
    interviewTime,
    roomId,
    duration,
    interviewType,
    roundNumber,
    additionalNotes,
    candidates: emails,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    emailsSent: true
  };

  // Save to localStorage
  let scheduledInterviews = JSON.parse(localStorage.getItem('scheduledInterviews') || '[]');
  scheduledInterviews.unshift(scheduledInterview);
  localStorage.setItem('scheduledInterviews', JSON.stringify(scheduledInterviews));

  // Simulate sending emails
  console.log('[v0] Sending emails to candidates:', emails);
  console.log('[v0] Interview Details:', {
    company: companyName,
    position: positionTitle,
    date: interviewDate,
    time: interviewTime,
    roomId: roomId,
    type: interviewType
  });

  // Show success message
  alert(`✓ Interview scheduled successfully!\nEmails sent to ${emails.length} candidate(s):\n${emails.join('\n')}`);

  // Reset form
  resetForm();

  // Refresh scheduled list
  loadScheduledInterviews();
}

// Reset form
function resetForm() {
  document.getElementById('scheduleForm').reset();
  document.getElementById('emailPreview').innerHTML = '<p style="color: var(--gray-500);">Email preview will appear here...</p>';
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentRole');
  window.location.href = '../../login/login.html';
}
