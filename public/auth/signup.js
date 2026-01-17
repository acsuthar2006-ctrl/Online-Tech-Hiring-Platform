let selectedRole = "";

function selectRole(role) {
  selectedRole = role;
  document.getElementById("roleSelection").style.display = "none";
  document.getElementById("loginFormContainer").style.display = "block";

  const formTitle = document.getElementById("formTitle");
  formTitle.textContent = `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`;
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

  const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");

  // Check if username already exists
  if (accounts.some((acc) => acc.username === username)) {
    alert("Username already exists. Please choose a different one.");
    return;
  }

  // Create new account
  const newAccount = {
    fullname,
    email,
    username,
    password, // Note: In production, passwords should be hashed on the server
    role: selectedRole,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  localStorage.setItem("accounts", JSON.stringify(accounts));

  // Log the user in
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("username", username);
  localStorage.setItem("userRole", selectedRole);

  alert("Account created successfully!");

  // Redirect based on role
  if (selectedRole === "candidate") {
    window.location.href = "../candidate/candidate-dashboard.html";
  } else if (selectedRole === "interviewer") {
    window.location.href = "../interviewer/interviewer-dashboard.html";
  }
}
