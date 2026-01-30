# Frontend Integration Guide: JWT Authentication

## Overview

The backend has been updated to use **Stateless JWT (JSON Web Token) Authentication**.
Legacy Session/Basic Auth is **disabled**. You must now obtain a token on login and send it with every request.

---

## 1. Authentication Flow

### Sign Up

**Endpoint:** `POST /api/auth/signup`
**Payload:**

```json
{
  "email": "candidate@example.com",
  "password": "securePassword123",
  "fullName": "Jane Doe",
  "role": "CANDIDATE", // or "INTERVIEWER"
  "skills": "React, Node.js", // Required for Candidate
  "resumeUrl": "https://..." // Required for Candidate
}
```

### Login (Get Token)

**Endpoint:** `POST /api/auth/login`
**Payload:**

```json
{
  "email": "candidate@example.com",
  "password": "securePassword123"
}
```

**Response (Success 200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOi...", // <--- THIS IS THE KEY
  "message": "Login successful",
  "userId": 1,
  "role": "CANDIDATE",
  "fullName": "Jane Doe"
}
```

---

## 2. Integration Implementation

### Step A: Store the Token

On successful login, save the `token` to `localStorage`.

```javascript
// Example: Login Function
const login = async (email, password) => {
  const response = await fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (response.ok) {
    // CRITICAL: Save the token
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("userRole", data.role); // Optional: for UI logic
  } else {
    console.error("Login failed:", data.message);
  }
};
```

### Step B: Send Token in Requests

For **ALL** other API calls (e.g., getting interviews, profile), you **MUST** include the `Authorization` header.

**Format:** `Authorization: Bearer <your_token>`

#### Option 1: Using `axios` (Recommended)

Create a centralized `api.js` file.

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

// Request Interceptor: Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Token expired or invalid -> Logout user
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
```

#### Option 2: Using `fetch`

Manually attach the header every time.

```javascript
const getInterviews = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch(
    "http://localhost:8080/api/interviews/candidate/upcoming?email=...",
    {
      headers: {
        Authorization: `Bearer ${token}`, // <--- Attach here
        "Content-Type": "application/json",
      },
    },
  );

  if (response.status === 403) {
    // Handle Forbidden (Logout)
  }
};
```

---

## 3. Common Errors

| HTTP Code            | Meaning         | Cause                                                                     | Fix                                                                              |
| :------------------- | :-------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------- |
| **401 Unauthorized** | Bad Credentials | Wrong password during login.                                              | Check user input.                                                                |
| **403 Forbidden**    | Access Denied   | 1. Token missing.<br>2. Token invalid/expired.<br>3. Wrong header format. | Ensure header is `Bearer <token>` (note the space). Re-login to get fresh token. |
| **200 OK**           | Success         | Request worked.                                                           | N/A                                                                              |
