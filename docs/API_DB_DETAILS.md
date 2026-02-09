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

## API Endpoints

### Companies (`/api/companies`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/` | Create company |
| GET | `/{id}` | Get company by ID |
| GET | `/` | Get all companies |
| PUT | `/{id}` | Update company |
| DELETE | `/{id}` | Delete company |

### Positions (`/api/positions`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/` | Create position |
| GET | `/{id}` | Get position by ID |
| GET | `/` | Get all positions |
| GET | `/company/{companyId}` | Get positions by company |
| GET | `/open` | Get open positions |
| PUT | `/{id}` | Update position |
| DELETE | `/{id}` | Delete position |

### Applications (`/api/applications`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/` | Create application |
| GET | `/{id}` | Get application by ID |
| GET | `/candidate/{candidateId}` | Get applications by candidate |
| GET | `/position/{positionId}` | Get applications by position |
| PATCH | `/{id}/status` | Update application status |
| DELETE | `/{id}` | Delete application |

### Interviewer Applications (`/api/interviewer-applications`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/` | Create interviewer application |
| GET | `/{id}` | Get application by ID |
| GET | `/interviewer/{interviewerId}` | Get applications by interviewer |
| GET | `/company/{companyId}` | Get applications by company |
| PATCH | `/{id}/status` | Update application status |
| DELETE | `/{id}` | Delete application |

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Request Body |
|:-------|:---------|:------------|:-------------|
| POST | `/signup` | Register new user | `{ "email", "password", "fullName", "role" }` |
| POST | `/login` | Login user | `{ "email", "password" }` |

### Users (`/api/users`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/profile` | Get current user profile |

### Interviews (`/api/interviews`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/schedule` | Schedule an interview |
| GET | `/session/{link}/queue` | Get session queue & status |
| POST | `/{id}/complete` | Mark interview as complete |
| GET | `/{id}/status` | Get interview status |
| GET | `/candidate/upcoming` | Get upcoming interviews for candidate |
| POST | `/{id}/start` | Mark interview as IN_PROGRESS |
| POST | `/{id}/remind` | Send reminder email |

### Test (`/api/test`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/send-email` | Test email functionality |
