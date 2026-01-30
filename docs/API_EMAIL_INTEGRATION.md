# Frontend Integration: Automated Interview Links

## 1. Overview

The backend system now includes an **Automated Email Scheduler** that sends interview reminders to candidates 20 minutes before their scheduled interview.

These emails contain a "Magic Link" that directs the user to the specific interview room with their role pre-assigned. The frontend application must handle these links gracefully, ensuring users are authenticated before placing them in the video room.

## 2. Magic Link Format

The email contains a link in the following format:

```
http://localhost:5173/?room={meetingLink}&role={role}
```

### Parameters

| Parameter | Type     | Description                                       | Example                      |
| :-------- | :------- | :------------------------------------------------ | :--------------------------- |
| `room`    | `string` | The unique identifier for the video meeting room. | `tech-round-john-doe-12345`  |
| `role`    | `string` | The role of the user entering the room.           | `candidate` or `interviewer` |

---

## 3. Implementation Logic

### A. Landing Page Handler (`index.js` or `App.jsx`)

When the application loads, verify if the current URL contains the query parameters `room` and `role`.

**Flow:**

1.  **Parse URL**: Extract `room` and `role` from the query string.
2.  **Check Auth**: Verify if a valid JWT token exists in `sessionStorage` or `localStorage`.

#### Scenario 1: User IS Authenticated

- **Action**: Redirect the user **immediately** to the video call interface.
- **Destination**: `/call.html?room={room}&role={role}` (or your React route equivalent).

#### Scenario 2: User is NOT Authenticated

- **Action**: Redirect the user to the **Login Page**, but **preserve their destination**.
- **Method**: Store the intended destination in `sessionStorage` or pass it as a URL parameter to the login page.
  - _Storage Strategy_: `sessionStorage.setItem('pending_redirect_room', room)`
  - _URL Strategy_: `/login.html?redirect_room={room}&redirect_role={role}`

### B. Login Page Handler (`login.js`)

After a specific user successfully logs in (receives a 200 OK from `/api/auth/login`):

1.  **Check Intent**: Look for the saved redirection parameters (`pending_redirect_room`).
2.  **Route**:
    - **If found**: Redirect to the video call page: `/call.html?room={...}`.
    - **If NOT found**: Redirect to the default dashboard (`/dashboard.html`).

---

## 4. Code Examples

### A. Landing Logic (Vanilla JS)

Place this in your main entry point (e.g., `index.js`):

```javascript
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");
  const role = params.get("role");

  // Only intervene if we have a deep link
  if (room && role) {
    console.log("[DeepLink] Detected Room Access:", room);

    const token = sessionStorage.getItem("jwt_token");

    if (token) {
      // User is already logged in, go to room
      window.location.href = `/call.html?room=${room}&role=${role}`;
    } else {
      // User needs to login first
      sessionStorage.setItem("pending_room", room);
      sessionStorage.setItem("pending_role", role);
      window.location.href = "/login.html";
    }
  }
});
```

### B. Post-Login Redirect (Vanilla JS)

Inside your `login()` function's success callback:

```javascript
async function handleLogin(e) {
  // ... fetch api/auth/login ...

  if (response.ok) {
    const data = await response.json();
    sessionStorage.setItem("jwt_token", data.token);

    // CHECK FOR PENDING REDIRECT
    const pendingRoom = sessionStorage.getItem("pending_room");
    const pendingRole = sessionStorage.getItem("pending_role");

    if (pendingRoom) {
      // Clean up storage
      sessionStorage.removeItem("pending_room");
      sessionStorage.removeItem("pending_role");

      // Redirect to the interview
      window.location.href = `/call.html?room=${pendingRoom}&role=${pendingRole}`;
      return;
    }

    // Default: Go to Dashboard
    window.location.href = "/dashboard.html";
  }
}
```

## 5. Security & Edge Cases

- **Expired Tokens**: If the "Already Logged In" check passes but the token is actually expired, the `/call.html` page should handle the 401/403 error from the backend APIs and redirect the user back to `/login.html`.
- **Wrong Account**: If a user clicks a link meant for someone else (e.g., assumes they are "candidate"), the backend will validate if the logged-in user matches the interview record. If there is a mismatch, the frontend should display a clear "Access Denied" or "Wrong Account" error message.
