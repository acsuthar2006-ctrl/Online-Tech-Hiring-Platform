// Sample job postings and applicants data
let jobPostings = [
  {
    id: 1,
    title: "Senior Software Engineer",
    description: "We are looking for an experienced software engineer with 5+ years of experience in full-stack development.",
    salaryMin: 100000,
    salaryMax: 150000,
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    status: "open",
    postedDate: "2024-02-10",
    candidates: [
      {
        name: "John Doe",
        email: "john.doe@email.com",
        status: "Applied",
        appliedDate: "2024-02-15"
      },
      {
        name: "Alice Johnson",
        email: "alice.j@email.com",
        status: "Interview Scheduled",
        appliedDate: "2024-02-12"
      },
      {
        name: "Bob Smith",
        email: "bob.smith@email.com",
        status: "Applied",
        appliedDate: "2024-02-18"
      }
    ],
    interviewers: [
      {
        name: "Sarah Wilson",
        email: "sarah.w@interviewpro.com",
        expertise: "Full-Stack Development",
        status: "Approved",
        appliedDate: "2024-02-11"
      },
      {
        name: "Mike Chen",
        email: "mike.c@interviewpro.com",
        expertise: "JavaScript/React",
        status: "Applied",
        appliedDate: "2024-02-16"
      }
    ]
  },
  {
    id: 2,
    title: "Product Manager",
    description: "Looking for a Product Manager to lead our product strategy and roadmap.",
    salaryMin: 90000,
    salaryMax: 130000,
    skills: ["Product Strategy", "Analytics", "User Research"],
    status: "open",
    postedDate: "2024-02-14",
    candidates: [
      {
        name: "Emily Chen",
        email: "emily.chen@email.com",
        status: "Passed",
        appliedDate: "2024-02-17"
      }
    ],
    interviewers: [
      {
        name: "Lisa Anderson",
        email: "lisa.a@interviewpro.com",
        expertise: "Product Management",
        status: "Approved",
        appliedDate: "2024-02-15"
      }
    ]
  }
];

// Load jobs on page load
document.addEventListener("DOMContentLoaded", function () {
  loadJobs();
});

function loadJobs() {
  const container = document.getElementById("jobsContainer");
  const emptyState = document.getElementById("emptyState");

  if (jobPostings.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "block";
  } else {
    container.style.display = "grid";
    emptyState.style.display = "none";
    container.innerHTML = jobPostings
      .map(
        (job) => `
      <div class="job-card" onclick="openJobDetails(${job.id})">
        <div class="job-card-header">
          <h3 class="job-card-title">${job.title}</h3>
          <span class="job-status-badge ${job.status === "closed" ? "closed" : ""}">${job.status === "open" ? "Open" : "Closed"}</span>
        </div>
        <div class="job-card-meta">
          <div class="job-meta-item">
            <strong>${job.candidates.length}</strong> Candidates
          </div>
          <div class="job-meta-item">
            <strong>${job.interviewers.length}</strong> Interviewers
          </div>
          <div class="job-meta-item">
            $${job.salaryMin.toLocaleString()}-$${job.salaryMax.toLocaleString()}
          </div>
        </div>
        <p class="job-card-description">${job.description}</p>
        <div class="job-card-skills">
          ${job.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join("")}
        </div>
        <div class="job-card-stats">
          <div class="stat-box">
            <span class="stat-number">${job.candidates.length}</span>
            <span class="stat-label">Applications</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${job.interviewers.length}</span>
            <span class="stat-label">Interviewers</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">${job.candidates.filter((c) => c.status === "Passed").length}</span>
            <span class="stat-label">Passed</span>
          </div>
        </div>
        <div class="job-card-actions">
          <button class="btn-small btn-view">View Details</button>
          <button class="btn-small btn-close" onclick="event.stopPropagation(); toggleJobStatus(${job.id})">${job.status === "open" ? "Close" : "Reopen"}</button>
        </div>
      </div>
    `
      )
      .join("");
  }
}

function openPostJobModal() {
  document.getElementById("postJobModal").style.display = "flex";
}

function closePostJobModal() {
  document.getElementById("postJobModal").style.display = "none";
  document.getElementById("positionTitle").value = "";
  document.getElementById("jobDescription").value = "";
  document.getElementById("salaryMin").value = "";
  document.getElementById("salaryMax").value = "";
  document.getElementById("requiredSkills").value = "";
}

function postJob() {
  const title = document.getElementById("positionTitle").value.trim();
  const description = document.getElementById("jobDescription").value.trim();
  const salaryMin = parseInt(document.getElementById("salaryMin").value) || 0;
  const salaryMax = parseInt(document.getElementById("salaryMax").value) || 0;
  const skillsInput = document.getElementById("requiredSkills").value.trim();
  const skills = skillsInput ? skillsInput.split(",").map((s) => s.trim()) : [];

  if (!title || !description || salaryMin <= 0 || salaryMax <= 0) {
    alert("Please fill in all required fields");
    return;
  }

  const newJob = {
    id: Math.max(...jobPostings.map((j) => j.id), 0) + 1,
    title: title,
    description: description,
    salaryMin: salaryMin,
    salaryMax: salaryMax,
    skills: skills,
    status: "open",
    postedDate: new Date().toISOString().split("T")[0],
    candidates: [],
    interviewers: []
  };

  jobPostings.push(newJob);
  loadJobs();
  closePostJobModal();
}

function openJobDetails(jobId) {
  const job = jobPostings.find((j) => j.id === jobId);
  if (!job) return;

  document.getElementById("jobTitle").textContent = job.title;
  document.getElementById("detailTitle").textContent = job.title;
  document.getElementById("detailStatus").textContent = job.status === "open" ? "Open" : "Closed";
  document.getElementById("detailStatus").className = `detail-value detail-status ${job.status === "closed" ? "closed" : ""}`;
  document.getElementById("detailSalary").textContent = `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
  document.getElementById("detailSkills").innerHTML = job.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join("");
  document.getElementById("detailDescription").textContent = job.description;

  // Load candidates
  const candidatesList = document.getElementById("candidatesList");
  if (job.candidates.length === 0) {
    candidatesList.innerHTML = '<div class="no-applicants"><p>No candidate applications yet</p></div>';
  } else {
    candidatesList.innerHTML = job.candidates
      .map(
        (candidate) => `
      <div class="applicant-item">
        <div class="applicant-info">
          <div class="applicant-name">${candidate.name}</div>
          <div class="applicant-email">${candidate.email}</div>
        </div>
        <span class="applicant-status">${candidate.status}</span>
      </div>
    `
      )
      .join("");
  }

  // Load interviewers
  const interviewersList = document.getElementById("interviewersList");
  if (job.interviewers.length === 0) {
    interviewersList.innerHTML = '<div class="no-applicants"><p>No interviewer applications yet</p></div>';
  } else {
    interviewersList.innerHTML = job.interviewers
      .map(
        (interviewer) => `
      <div class="applicant-item">
        <div class="applicant-info">
          <div class="applicant-name">${interviewer.name}</div>
          <div class="applicant-email">${interviewer.email}</div>
          <div style="font-size: 12px; color: var(--gray-600); margin-top: 4px;">Expertise: ${interviewer.expertise}</div>
        </div>
        <span class="applicant-status">${interviewer.status}</span>
      </div>
    `
      )
      .join("");
  }

  // Reset tabs
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
  document.getElementById("overviewTab").classList.add("active");
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".tab-btn")[0].classList.add("active");

  document.getElementById("jobDetailsModal").style.display = "flex";
}

function closeJobDetailsModal() {
  document.getElementById("jobDetailsModal").style.display = "none";
}

function switchJobTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabName + "Tab").classList.add("active");
  event.target.classList.add("active");
}

function toggleJobStatus(jobId) {
  const job = jobPostings.find((j) => j.id === jobId);
  if (job) {
    job.status = job.status === "open" ? "closed" : "open";
    loadJobs();
  }
}

// Logout function
function logout() {
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  window.location.href = "login.html";
}
