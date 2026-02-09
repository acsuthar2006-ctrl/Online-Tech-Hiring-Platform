# Full Integration Guide: Simplified Interview Platform

## 1. Overview
We have simplified the platform to focus **exclusively** on the interview experience.
- **Removed**: Companies, Job Postings, Job Applications, Company Admins.
- **Retained**: Interviewers, Candidates, Interview Scheduling, Video/WebRTC.

**Goal**: An Interviewer can sign up, login, schedule an interview with a Candidate, and both can join the video room.

## 2. Backend Setup (Branch: `simplification-branch`)
The backend code is currently on the `simplification-branch`.

### A. Database
The schema has changed significantly.
1.  **Reset DB**: When running for the first time, ensure `application.properties` has:
    ```properties
    spring.jpa.hibernate.ddl-auto=create
    ```
    *(Run once to create tables, then switch back to `update`)*.

### B. Key API Endpoints
All existing Job/Company APIs are **GONE**.

#### Auth
- `POST /api/auth/signup`
    - Interviewer: `{ email, password, fullName, role: "INTERVIEWER" }` (**No companyName**)
    - Candidate: `{ email, password, fullName, role: "CANDIDATE" }`
- `POST /api/auth/login` -> Returns JWT Token.

#### Interview Management
- `POST /api/interviews/schedule` (Interviewer Only)
    ```json
    {
      "interviewerEmail": "...",
      "candidateEmail": "...",
      "scheduledTime": "2026-12-31T10:00:00",
      "interviewType": "TECHNICAL"
    }
    ```
- `GET /api/interviews/candidate/upcoming?email=...` (Candidate)

## 3. Frontend Integration Tasks (For Teammate)
The frontend currently references "Companies" and "Jobs". These need to be removed.

### Step 1: Remove Legacy Pages
Delete or Hide:
- `interviewer/hiring-companies.html`
- `interviewer/css/hiring-companies.css`
- `candidate/companies.html`

### Step 2: Update Interviewer Dashboard (`interviewer-dashboard.html`)
1.  **Remove** the "Hiring Companies" section.
2.  **Fetch Real Schedule**:
    - The backend has a new endpoint (to be implemented/verified): `GET /api/interviews/interviewer/schedule`.
    - Updates `interview-schedule.js` to fetch from this API instead of `mockSchedules`.

### Step 3: Update Schedule Page (`interview-schedule.js`)
1.  **Load Data**: Call the API to list interviews.
2.  **Render**: ensure the `renderScheduleItems` function maps API fields (`candidate.fullName`, `scheduledTime`) correctly to the UI.
3.  **Start Interview**: Ensure the "Start" button redirects to the video room URL returned by the backend (`/room/{meetingLink}`).

### Step 4: Candidate Dashboard
1.  **My Schedule**: Ensure this page calls `GET /api/interviews/candidate/upcoming` and renders the list.

## 4. End-to-End Flow (A to Z)
1.  **Sign Up**: Interviewer registers at `/signup.html`.
2.  **Dashboard**: Interviewer sees empty schedule (initially).
3.  **Schedule**:
    - Interviewer clicks "Unique Interview" / "Schedule New".
    - Enters Candidate Email + Name + Time.
    - System verifies/creates Candidate user auto-magically.
    - Backend sends Email Notification to Candidate.
4.  **Join (Interviewer)**:
    - On Dashboard, Interviewer clicks "Start" on the scheduled card.
    - Redirects to Video Room.
5.  **Join (Candidate)**:
    - Candidate clicks link in Email OR logs in to Dashboard and clicks "Join".
    - Redirects to Video Room.
6.  **Interview**:
    - WebRTC Video/Audio exchange.
    - Code Editor / Whiteboard interaction.
7.  **End**:
    - Interviewer clicks "Complete".
    - Enters Feedback/Score.
    - Interview marked as `COMPLETED`.
