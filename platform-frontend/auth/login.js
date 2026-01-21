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

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const errorElement = document.getElementById("login-error");
  if (errorElement) {
    errorElement.style.display = "none";
    errorElement.textContent = "";
  }

  fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(text || "Invalid credentials");
        });
      }
      return response.json();
    })
    .then((data) => {
      // Validate role match (optional but good UI experience)
      if (data.role !== selectedRole.toUpperCase()) {
        throw new Error(`This account is for ${data.role.toLowerCase()}. Please switch role tab.`);
      }

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userRole", data.role.toLowerCase());
      sessionStorage.setItem("userId", data.userId);
      sessionStorage.setItem("username", data.fullName);

      // Redirect based on role
      if (data.role === "CANDIDATE") {
        window.location.href = "../candidate/candidate-dashboard.html";
      } else if (data.role === "INTERVIEWER") {
        window.location.href = "../interviewer/interviewer-dashboard.html";
      }
    })
    .catch((error) => {
      console.error("Login Error:", error);
      if (errorElement) {
        errorElement.textContent = error.message;
        errorElement.style.display = "block";
      } else {
        alert("Error: " + error.message);
      }
    });
}

function logout() {
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("username");
  sessionStorage.removeItem("userRole");
  window.location.href = "login.html";
}
