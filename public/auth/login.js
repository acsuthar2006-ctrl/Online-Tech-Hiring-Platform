let selectedRole = "";

function selectRole(role) {
  selectedRole = role;
  document.getElementById("roleSelection").style.display = "none";
  document.getElementById("loginFormContainer").style.display = "block";

  const formTitle = document.getElementById("formTitle");
  formTitle.textContent = `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`;
}

function backToRoleSelection() {
  document.getElementById("roleSelection").style.display = "block";
  document.getElementById("loginFormContainer").style.display = "none";
  selectedRole = "";
}

function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const accounts = JSON.parse(localStorage.getItem("accounts") || "[]");
  const account = accounts.find(
    (acc) => acc.username === username && acc.password === password,
  );

  if (!account) {
    alert(
      "Invalid username or password. Please try again or create a new account.",
    );
    return;
  }

  sessionStorage.setItem("isLoggedIn", "true");
  sessionStorage.setItem("username", username);
  sessionStorage.setItem("userRole", account.role);

  // Redirect based on role
  if (account.role === "candidate") {
    window.location.href = "../candidate/candidate-dashboard.html";
  } else if (account.role === "interviewer") {
    window.location.href = "../interviewer/interviewer-dashboard.html";
  }
}

function logout() {
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("userRole");
  window.location.href = "login.html";
}
