# Full Integration Guide: Comprehensive Hiring Platform

## 1. Overview
This platform is a **complete hiring ecosystem** that connects companies, candidates, and interviewers through a streamlined workflow.

### Key Features
- **Company Management**: Companies create profiles and post job positions
- **Position Management**: Detailed job postings with requirements and salary ranges
- **Candidate Applications**: Candidates apply to positions and track application status
- **Interviewer Hiring**: Companies hire interviewers with specific expertise
- **Interview Scheduling**: Schedule interviews linked to positions and companies
- **Real-time Video Interviews**: WebRTC-based video interviews with recording

### Database Schema (9 Tables)
- `users` - Base authentication
- `candidates` - Extended candidate profiles (skills, resume, ratings)
- `interviewers` - Extended interviewer profiles (expertise, hourly rate, earnings)
- `companies` - Company profiles
- `positions` - Job positions
- `applications` - Candidate job applications
- `interviewer_applications` - Interviewer hiring applications
- `interviews` - Interview sessions
- `interview_schedules` - Interview scheduling details

## 2. Backend Setup (Branch: `simplification-branch`)

### A. Database Configuration
1.  **PostgreSQL Setup**: Ensure PostgreSQL 18+ is running
2.  **Configure `application.properties`**:
    ```properties
    spring.datasource.url=jdbc:postgresql://localhost:5432/hiring_platform
    spring.datasource.username=your_username
    spring.datasource.password=your_password
    spring.jpa.hibernate.ddl-auto=update
    ```
3.  **First Run**: Use `ddl-auto=create` for initial table creation, then switch to `update`

### B. Authentication with JWT

All API endpoints (except signup/login) require JWT Bearer token authentication.

#### Frontend Implementation

**1. Store Token After Login:**
```javascript
// After successful login
const response = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
// Store token securely
localStorage.setItem('authToken', data.token);
localStorage.setItem('userId', data.userId);
localStorage.setItem('userRole', data.role);
```

**2. Include Token in All Requests:**
```javascript
// Example: Fetch companies
const token = localStorage.getItem('authToken');
const response = await fetch('http://localhost:8080/api/companies', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**3. Handle Token Expiration:**
```javascript
// Check for 401 Unauthorized
if (response.status === 401) {
  // Token expired, redirect to login
  localStorage.clear();
  window.location.href = '/login.html';
}
```

**4. Logout:**
```javascript
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  window.location.href = '/login.html';
}
```

### C. Key API Endpoints

#### Authentication
- `POST /api/auth/signup`
    - Interviewer: `{ "email", "password", "fullName", "role": "INTERVIEWER" }`
    - Candidate: `{ "email", "password", "fullName", "role": "CANDIDATE" }`
- `POST /api/auth/login` → Returns JWT Token

#### Companies
- `POST /api/companies` - Create company profile
- `GET /api/companies` - List all companies
- `GET /api/companies/{id}` - Get company details
- `PUT /api/companies/{id}` - Update company
- `DELETE /api/companies/{id}` - Delete company

#### Positions
- `POST /api/positions` - Create job position
    ```json
    {
      "company": {"id": 1},
      "positionTitle": "Senior Backend Engineer",
      "jobDescription": "...",
      "salaryRange": "$120k-$180k",
      "requiredExpertise": "Java, Spring Boot, PostgreSQL",
      "status": "OPEN"
    }
    ```
- `GET /api/positions` - List all positions
- `GET /api/positions/open` - List open positions
- `GET /api/positions/company/{companyId}` - Get company's positions

#### Applications (Candidate → Position)
- `POST /api/applications` - Submit application
    ```json
    {
      "candidate": {"id": 1},
      "position": {"id": 1},
      "status": "APPLIED"
    }
    ```
- `GET /api/applications/candidate/{candidateId}` - Get candidate's applications
- `GET /api/applications/position/{positionId}` - Get position's applications
- `PATCH /api/applications/{id}/status?status=SHORTLISTED` - Update status

#### Interviewer Applications (Interviewer → Company)
- `POST /api/interviewer-applications` - Apply to company
    ```json
    {
      "interviewer": {"id": 2},
      "company": {"id": 1},
      "status": "APPLIED",
      "expertiseRequired": "Java, System Design"
    }
    ```
- `GET /api/interviewer-applications/interviewer/{id}` - Get interviewer's applications
- `GET /api/interviewer-applications/company/{id}` - Get company's applications
- `PATCH /api/interviewer-applications/{id}/status?status=APPROVED` - Update status

#### Interviews
- `POST /api/interviews/schedule` - Schedule interview
    ```json
    {
      "candidateName": "John Doe",
      "candidateEmail": "john@example.com",
      "interviewerId": 2,
      "scheduledTime": "2026-02-15T14:00:00",
      "title": "Backend Engineer Interview",
      "description": "Technical interview",
      "type": "TECHNICAL"
    }
    ```
- `GET /api/interviews/candidate/upcoming` - Get upcoming interviews
- `POST /api/interviews/{id}/start` - Mark interview as IN_PROGRESS
- `POST /api/interviews/{id}/complete` - Complete interview with feedback

## 3. Frontend Integration Tasks

### Step 1: Company Management Pages
**Create New Pages:**
- `company/dashboard.html` - Company dashboard
- `company/positions.html` - Manage job positions
- `company/applications.html` - View candidate applications
- `company/interviewers.html` - Manage hired interviewers

**Features:**
- Create/edit company profile
- Post new positions
- Review candidate applications
- Hire interviewers
- Schedule interviews for shortlisted candidates

### Step 2: Enhanced Candidate Dashboard
**Update `candidate-dashboard.html`:**
1.  **Browse Positions**: Display open positions from `GET /api/positions/open`
2.  **Apply to Positions**: Submit applications via `POST /api/applications`
3.  **Track Applications**: Show application status (APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, etc.)
4.  **My Interviews**: Display scheduled interviews from `GET /api/interviews/candidate/upcoming`
5.  **Profile Management**: Edit skills, resume, bio

### Step 3: Enhanced Interviewer Dashboard
**Update `interviewer-dashboard.html`:**
1.  **Browse Companies**: Display companies looking for interviewers
2.  **Apply to Companies**: Submit applications via `POST /api/interviewer-applications`
3.  **My Companies**: Show approved companies
4.  **Interview Schedule**: Display assigned interviews
5.  **Earnings Tracker**: Show total earnings and hourly rate
6.  **Profile Management**: Edit expertise, hourly rate, availability

### Step 4: Interview Workflow
**Enhanced Interview Flow:**
1.  **Company** posts position → **Candidate** applies
2.  **Company** reviews applications → Shortlists candidate
3.  **Company** schedules interview (assigns interviewer from hired pool)
4.  **System** sends email notifications to candidate and interviewer
5.  **Both** join video room at scheduled time
6.  **Interviewer** completes interview with feedback and score
7.  **Company** reviews feedback and makes hiring decision

## 4. End-to-End User Flows

### Flow 1: Company Hiring a Candidate
1.  **Company** signs up and creates profile
2.  **Company** posts job position (Backend Engineer)
3.  **Candidate** browses positions and applies
4.  **Company** reviews applications and shortlists candidate
5.  **Company** schedules interview (selects interviewer from hired pool)
6.  **System** sends email to candidate and interviewer
7.  **Interview** happens via video call
8.  **Interviewer** submits feedback and score
9.  **Company** reviews and makes offer

### Flow 2: Company Hiring an Interviewer
1.  **Interviewer** signs up with expertise (Java, System Design)
2.  **Interviewer** browses companies and applies
3.  **Company** reviews interviewer applications
4.  **Company** approves interviewer
5.  **Interviewer** now available for company's interview assignments

### Flow 3: Candidate Journey
1.  **Sign Up** → Create profile with skills and resume
2.  **Browse** → View open positions
3.  **Apply** → Submit applications to interesting positions
4.  **Track** → Monitor application status
5.  **Interview** → Join scheduled interviews
6.  **Feedback** → Receive interview results

## 5. Email Notifications

The platform sends automated emails for:
- **Interview Invitations**: Sent when interview is scheduled
- **Interview Reminders**: Sent 20 minutes before interview
- **Application Status Updates**: When application status changes
- **Interviewer Approval**: When interviewer application is approved

Configure in `application.properties`:
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

## 6. WebRTC Video Integration

The video interview system remains unchanged:
- **Media Server**: Mediasoup SFU on port 3000
- **Room URLs**: `/room/{meetingLink}`
- **Features**: Video, audio, screen sharing, recording

## 7. Testing the Complete Flow

### Test Scenario
1.  **Create Company**: POST `/api/companies`
2.  **Create Position**: POST `/api/positions` (link to company)
3.  **Register Candidate**: POST `/api/auth/signup` (role: CANDIDATE)
4.  **Apply**: POST `/api/applications` (candidate → position)
5.  **Register Interviewer**: POST `/api/auth/signup` (role: INTERVIEWER)
6.  **Hire Interviewer**: POST `/api/interviewer-applications` (interviewer → company)
7.  **Approve Interviewer**: PATCH `/api/interviewer-applications/{id}/status?status=APPROVED`
8.  **Schedule Interview**: POST `/api/interviews/schedule`
9.  **Join Interview**: Both users navigate to video room
10. **Complete**: POST `/api/interviews/{id}/complete` with feedback

## 8. Migration from Simplified Version

If migrating from the simplified version:
1.  **Database**: Run with `ddl-auto=create` to recreate schema
2.  **Frontend**: Add company management pages
3.  **Workflows**: Update to include application workflows
4.  **APIs**: Replace direct interview scheduling with application-based flow

## 9. Security Considerations

- **JWT Authentication**: All endpoints require valid JWT token
- **Role-Based Access**: 
  - Companies can only manage their own positions/applications
  - Candidates can only view/apply to open positions
  - Interviewers can only view assigned interviews
- **Data Validation**: All inputs validated on backend
- **Password Encryption**: BCrypt hashing for all passwords

## 10. Next Steps

1.  **Frontend Development**: Build company, enhanced candidate, and interviewer dashboards
2.  **Testing**: Comprehensive end-to-end testing
3.  **Deployment**: Deploy to AWS with PostgreSQL
4.  **Monitoring**: Set up logging and error tracking
5.  **Optimization**: Add pagination, search, and filters
