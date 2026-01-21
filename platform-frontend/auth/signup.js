let selectedRole = "";

function selectRole(role) {
  selectedRole = role;
  document.getElementById("roleSelection").style.display = "none";
  document.getElementById("loginFormContainer").style.display = "block";

  formTitle.textContent = `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`;

  // Toggle Fields
  document.getElementById("candidateFields").style.display = role === "candidate" ? "block" : "none";
  document.getElementById("interviewerFields").style.display = role === "interviewer" ? "block" : "none";
}

function backToRoleSelection() {
  document.getElementById("roleSelection").style.display = "block";
  document.getElementById("loginFormContainer").style.display = "none";
  selectedRole = "";
  document.getElementById("signupForm").reset();
}

function handleSignup(event) {
  event.preventDefault();

  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match. Please try again.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  // Call Backend API
  fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fullName: fullname,
      email: email,
      password: password,
      role: selectedRole.toUpperCase(),
      // Optional fields based on role
      resumeUrl: document.getElementById("resumeUrl").value || null,
      skills: document.getElementById("skills").value || null,
      companyName: document.getElementById("companyName").value || null,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text || "Signup failed");
        });
      }
      return response.json();
    })
    .then((data) => {
      alert(data.message || "Account created successfully!");

      // Log the user in (client-side session)
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("userId", data.userId);
      sessionStorage.setItem("userRole", selectedRole);

      // Redirect based on role
      if (selectedRole === "candidate") {
        window.location.href = "../candidate/candidate-dashboard.html";
      } else if (selectedRole === "interviewer") {
        window.location.href = "../interviewer/interviewer-dashboard.html";
      }
    })
    .catch((error) => {
      console.error("Signup Error:", error);
      alert("Error: " + error.message);
    });
}
