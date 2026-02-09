# Backend API & Database Details

## Visualizations

### Database ER Diagram

```mermaid
erDiagram
    USERS {
        bigint id PK
        string email
        string full_name
        string role
        string username
        timestamp created_at
        timestamp updated_at
    }
    CANDIDATES {
        bigint id FK
        text skills
        string resume_url
        string phone
        string profile_photo_url
        text bio
        int total_interviews_attended
        double average_rating
    }
    INTERVIEWERS {
        bigint id FK
        string phone
        string profile_photo_url
        text bio
        double hourly_rate
        int total_interviews_conducted
        double average_rating
        double total_earnings
        string availability_status
    }
    COMPANIES {
        bigint id PK
        string company_name
        string industry
        string email
        string phone
        string location
        string website
        text description
        string logo_url
        timestamp created_at
    }
    POSITIONS {
        bigint id PK
        bigint company_id FK
        string position_title
        text job_description
        string salary_range
        text required_expertise
        string status
        timestamp created_at
    }
    APPLICATIONS {
        bigint id PK
        bigint candidate_id FK
        bigint position_id FK
        string status
        timestamp application_date
        timestamp created_at
    }
    INTERVIEWER_APPLICATIONS {
        bigint id PK
        bigint interviewer_id FK
        bigint company_id FK
        string status
        text expertise_required
        timestamp application_date
        timestamp created_at
    }
    INTERVIEWS {
        bigint id PK
        string interview_id
        string title
        bigint candidate_id FK
        bigint interviewer_id FK
        bigint company_id FK
        bigint position_id FK
        date scheduled_date
        time scheduled_time
        string meeting_link
        string interview_round
        string status
        string interview_type
        text description
        text feedback
        double score
        int duration_minutes
        string recording_url
        timestamp created_at
        timestamp updated_at
    }
    INTERVIEW_SCHEDULES {
        bigint id PK
        bigint interview_id FK
        string candidate_email
        date scheduled_date
        time scheduled_time
        string room_id
        string meeting_link
        text notes
        timestamp email_sent_at
        timestamp created_at
    }

    USERS ||--|| CANDIDATES : "is a"
    USERS ||--|| INTERVIEWERS : "is a"
    COMPANIES ||--o{ POSITIONS : "has"
    COMPANIES ||--o{ INTERVIEWER_APPLICATIONS : "receives"
    CANDIDATES ||--o{ APPLICATIONS : "submits"
    CANDIDATES ||--o{ INTERVIEWS : "participates in"
    INTERVIEWERS ||--o{ INTERVIEWS : "conducts"
    INTERVIEWERS ||--o{ INTERVIEWER_APPLICATIONS : "submits"
    POSITIONS ||--o{ APPLICATIONS : "receives"
    POSITIONS ||--o{ INTERVIEWS : "for"
    COMPANIES ||--o{ INTERVIEWS : "hosts"
    INTERVIEWS ||--o| INTERVIEW_SCHEDULES : "has"
```

## Database Schema (PostgreSQL)

### `users` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (PK) | Auto-increment ID |
| `email` | VARCHAR | Unique email |
| `password` | VARCHAR | Encrypted password |
| `full_name` | VARCHAR | User's full name |
| `role` | VARCHAR | CANDIDATE, INTERVIEWER |
| `username` | VARCHAR | Unique username |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `candidates` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (FK) | References `users.id` |
| `skills` | TEXT | JSON/CSV of skills |
| `resume_url` | VARCHAR | Link to resume |
| `phone` | VARCHAR | Phone number |
| `profile_photo_url` | VARCHAR | Profile photo URL |
| `bio` | TEXT | Biography |
| `total_interviews_attended` | INT | Interview count |
| `average_rating` | DOUBLE | Average rating |

### `interviewers` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (FK) | References `users.id` |
| `phone` | VARCHAR | Phone number |
| `profile_photo_url` | VARCHAR | Profile photo URL |
| `bio` | TEXT | Biography |
| `hourly_rate` | DOUBLE | Hourly rate |
| `total_interviews_conducted` | INT | Interview count |
| `average_rating` | DOUBLE | Average rating |
| `total_earnings` | DOUBLE | Total earnings |
| `availability_status` | VARCHAR | AVAILABLE, BUSY, OFFLINE |

### `companies` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (PK) | Auto-increment ID |
| `company_name` | VARCHAR | Company name |
| `industry` | VARCHAR | Industry sector |
| `email` | VARCHAR | Unique email |
| `phone` | VARCHAR | Phone number |
| `location` | VARCHAR | Location |
| `website` | VARCHAR | Website URL |
| `description` | TEXT | Company description |
| `logo_url` | VARCHAR | Logo URL |
| `created_at` | TIMESTAMP | Creation timestamp |

### `positions` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (PK) | Auto-increment ID |
| `company_id` | BIGINT (FK) | References `companies.id` |
| `position_title` | VARCHAR | Job title |
| `job_description` | TEXT | Job description |
| `salary_range` | VARCHAR | Salary range |
| `required_expertise` | TEXT | Required skills |
| `status` | VARCHAR | OPEN, CLOSED, FILLED |
| `created_at` | TIMESTAMP | Creation timestamp |

### `applications` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (PK) | Auto-increment ID |
| `candidate_id` | BIGINT (FK) | References `candidates.id` |
| `position_id` | BIGINT (FK) | References `positions.id` |
| `status` | VARCHAR | APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, REJECTED, OFFERED |
| `application_date` | TIMESTAMP | Application date |
| `created_at` | TIMESTAMP | Creation timestamp |

### `interviewer_applications` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (PK) | Auto-increment ID |
| `interviewer_id` | BIGINT (FK) | References `interviewers.id` |
| `company_id` | BIGINT (FK) | References `companies.id` |
| `status` | VARCHAR | APPLIED, APPROVED, REJECTED |
| `expertise_required` | TEXT | Required expertise |
| `application_date` | TIMESTAMP | Application date |
| `created_at` | TIMESTAMP | Creation timestamp |

### `interviews` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (PK) | Auto-increment ID |
| `interview_id` | VARCHAR | Unique room ID |
| `title` | VARCHAR | Interview title |
| `candidate_id` | BIGINT (FK) | References `candidates.id` |
| `interviewer_id` | BIGINT (FK) | References `interviewers.id` |
| `company_id` | BIGINT (FK) | References `companies.id` |
| `position_id` | BIGINT (FK) | References `positions.id` |
| `scheduled_date` | DATE | Scheduled date |
| `scheduled_time` | TIME | Scheduled time |
| `meeting_link` | VARCHAR | Meeting room link |
| `interview_round` | VARCHAR | ROUND_1, ROUND_2, ROUND_3 |
| `status` | VARCHAR | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| `interview_type` | VARCHAR | TECHNICAL, BEHAVIORAL, etc. |
| `description` | TEXT | Interview description |
| `feedback` | TEXT | Interviewer feedback |
| `score` | DOUBLE | Score (e.g. 1-5) |
| `duration_minutes` | INT | Duration in minutes |
| `recording_url` | VARCHAR | Recording URL |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### `interview_schedules` Table
| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | BIGINT (PK) | Auto-increment ID |
| `interview_id` | BIGINT (FK) | References `interviews.id` |
| `candidate_email` | VARCHAR | Candidate email |
| `scheduled_date` | DATE | Scheduled date |
| `scheduled_time` | TIME | Scheduled time |
| `room_id` | VARCHAR | Unique room ID |
| `meeting_link` | VARCHAR | Meeting link |
| `notes` | TEXT | Additional notes |
| `email_sent_at` | TIMESTAMP | Email sent timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |

## Authentication

### JWT Bearer Token Authentication

All API endpoints (except `/api/auth/signup` and `/api/auth/login`) require authentication using JWT Bearer tokens.

#### How to Authenticate

1. **Sign Up or Login** to get a JWT token
2. **Include the token** in the `Authorization` header of all subsequent requests
3. **Token format**: `Bearer <your-jwt-token>`

#### Example Authentication Flow

**Step 1: Login**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA2NjQxNDcyLCJleHAiOjE3MDY3Mjc4NzJ9.8-aKumGgerUOjSNJy0xK_xuTEfyurwhb-75Bl1xJ2j4",
  "message": "Login successful",
  "userId": 1,
  "role": "CANDIDATE",
  "fullName": "John Doe"
}
```

**Step 2: Use Token in Requests**
```bash
curl -X GET http://localhost:8080/api/companies \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNzA2NjQxNDcyLCJleHAiOjE3MDY3Mjc4NzJ9.8-aKumGgerUOjSNJy0xK_xuTEfyurwhb-75Bl1xJ2j4"
```

#### Token Details

- **Expiration**: 24 hours from issue time
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Storage**: Store securely in browser (localStorage or sessionStorage)
- **Refresh**: Login again when token expires

#### Error Responses

**401 Unauthorized** - Missing or invalid token
```json
{
  "timestamp": "2026-02-09T18:44:27.123456",
  "message": "Unauthorized",
  "details": "uri=/api/companies"
}
```

**403 Forbidden** - Valid token but insufficient permissions
```json
{
  "timestamp": "2026-02-09T18:44:27.123456",
  "message": "Access Denied",
  "details": "uri=/api/companies"
}
```

---

## API Endpoints

### Authentication (`/api/auth`) - **No Token Required**

| Method | Endpoint | Description | Request Body |
|:-------|:---------|:------------|:-------------|
| POST | `/signup` | Register new user | `{ "email", "password", "fullName", "role" }` |
| POST | `/login` | Login user | `{ "email", "password" }` |

**Example Signup:**
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePassword123",
    "fullName": "Jane Smith",
    "role": "CANDIDATE"
  }'
```

---

### Companies (`/api/companies`) - **Token Required**
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| POST | `/` | Create company | ✅ Bearer Token |
| GET | `/{id}` | Get company by ID | ✅ Bearer Token |
| GET | `/` | Get all companies | ✅ Bearer Token |
| PUT | `/{id}` | Update company | ✅ Bearer Token |
| DELETE | `/{id}` | Delete company | ✅ Bearer Token |

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "companyName": "Tech Corp",
    "industry": "Software",
    "email": "contact@techcorp.com",
    "phone": "+1234567890",
    "location": "San Francisco",
    "website": "https://techcorp.com",
    "description": "Leading tech company",
    "logoUrl": "https://example.com/logo.png"
  }'
```

---

### Positions (`/api/positions`) - **Token Required**
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| POST | `/` | Create position | ✅ Bearer Token |
| GET | `/{id}` | Get position by ID | ✅ Bearer Token |
| GET | `/` | Get all positions | ✅ Bearer Token |
| GET | `/company/{companyId}` | Get positions by company | ✅ Bearer Token |
| GET | `/open` | Get open positions | ✅ Bearer Token |
| PUT | `/{id}` | Update position | ✅ Bearer Token |
| DELETE | `/{id}` | Delete position | ✅ Bearer Token |

---

### Applications (`/api/applications`) - **Token Required**
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| POST | `/` | Create application | ✅ Bearer Token |
| GET | `/{id}` | Get application by ID | ✅ Bearer Token |
| GET | `/candidate/{candidateId}` | Get applications by candidate | ✅ Bearer Token |
| GET | `/position/{positionId}` | Get applications by position | ✅ Bearer Token |
| PATCH | `/{id}/status` | Update application status | ✅ Bearer Token |
| DELETE | `/{id}` | Delete application | ✅ Bearer Token |

---

### Interviewer Applications (`/api/interviewer-applications`) - **Token Required**
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| POST | `/` | Create interviewer application | ✅ Bearer Token |
| GET | `/{id}` | Get application by ID | ✅ Bearer Token |
| GET | `/interviewer/{interviewerId}` | Get applications by interviewer | ✅ Bearer Token |
| GET | `/company/{companyId}` | Get applications by company | ✅ Bearer Token |
| PATCH | `/{id}/status` | Update application status | ✅ Bearer Token |
| DELETE | `/{id}` | Delete application | ✅ Bearer Token |

---

### Users (`/api/users`) - **Token Required**
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/profile` | Get current user profile |

---

### Interviews (`/api/interviews`) - **Token Required**
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| POST | `/schedule` | Schedule an interview | ✅ Bearer Token |
| GET | `/session/{link}/queue` | Get session queue & status | ✅ Bearer Token |
| POST | `/{id}/complete` | Mark interview as complete | ✅ Bearer Token |
| GET | `/{id}/status` | Get interview status | ✅ Bearer Token |
| GET | `/candidate/upcoming` | Get upcoming interviews for candidate | ✅ Bearer Token |
| POST | `/{id}/start` | Mark interview as IN_PROGRESS | ✅ Bearer Token |
| POST | `/{id}/remind` | Send reminder email | ✅ Bearer Token |

---

### Test (`/api/test`) - **Token Required**
| Method | Endpoint | Description | Auth Required |
|:-------|:---------|:------------|:--------------|
| POST | `/send-email` | Test email functionality | ✅ Bearer Token |
