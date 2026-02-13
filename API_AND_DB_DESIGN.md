# API & Database Design Documentation

 ## 1. Database Schema
 
 The database uses a relational model with **PostgreSQL**, leveraging **Hibernate Inheritance (JOINED strategy)** for User roles.
 
 ### Entity Relationship Diagram (ERD)
 
 ```mermaid
 erDiagram
     USERS ||--|{ CANDIDATES : "extends"
     USERS ||--|{ INTERVIEWERS : "extends"
     
     CANDIDATES ||--|{ CANDIDATE_SKILLS : "has"
     CANDIDATES ||--|{ CANDIDATE_EXPERIENCE : "has"
     CANDIDATES ||--|{ CANDIDATE_EDUCATION : "has"
     CANDIDATES ||--|| CANDIDATE_SETTINGS : "has"
     
     INTERVIEWERS ||--|{ INTERVIEWER_EXPERTISE : "has"
     INTERVIEWERS ||--|| INTERVIEWER_SETTINGS : "has"
     
     INTERVIEWERS ||--|{ INTERVIEWS : "conducts"
     CANDIDATES ||--|{ INTERVIEWS : "attends"
     INTERVIEWS ||--|{ RECORDINGS : "has"
 
     INTERVIEWER_JOBS {
         Long id PK
         String companyName
         String title
         Double hourlyRate
         String status
     }
 ```
 
 ---
 
 ## 2. REST API Endpoints
 
 ### Authentication (`/api/auth`)
 
 | Method | Endpoint | Description |
 | :--- | :--- | :--- |
 | `POST` | `/signup` | Register user (Candidate/Interviewer) |
 | `POST` | `/login` | Authenticate and get JWT |
 
 ### Candidate Profile (`/api/candidates`)
 
 | Method | Endpoint | Description |
 | :--- | :--- | :--- |
 | `GET` | `/{id}/profile` | Get full profile (Skills, Exp, Edu) |
 | `POST` | `/{id}/skills` | Add Skill |
 | `POST` | `/{id}/experience` | Add Experience |
 | `POST` | `/{id}/education` | Add Education |
 
 ### Interviewer Profile (`/api/interviewers`)
 
 | Method | Endpoint | Description |
 | :--- | :--- | :--- |
 | `GET` | `/{id}/profile` | Get full profile (Expertise) |
 | `POST` | `/{id}/expertise` | Add Expertise |
 
 ### Settings (`/api/settings`)
 
 | Method | Endpoint | Description |
 | :--- | :--- | :--- |
 | `GET/PUT` | `/candidate/{id}` | Manage Candidate Settings |
 | `GET/PUT` | `/interviewer/{id}` | Manage Interviewer Settings |
 
 ### Features
 
 | Method | Endpoint | Description |
 | :--- | :--- | :--- |
 | `GET` | `/api/interviewer-jobs` | List open jobs for interviewers |
 | `GET` | `/api/recordings/{interviewId}` | Get interview recordings |
 
 ---
 
 ## 3. Key Implementation Details
 
 ### Security
 *   **JWT Authentication**: Used for securing endpoints (currently configured directly in `SecurityConfig`).
 *   **Role-Based Access**: `CANDIDATE` and `INTERVIEWER` roles are distinguished at the Entity and DTO level.
 *   **Public Access for Testing**: Temporarily, `/api/interviews/**` is open to facilitate testing without complex auth flows.
 
 ### Queue Management Logic
 *   **Session-Based**: Interviews are grouped by `meetingLink`.
 *   **Manual Control**: The interviewer manually transitions candidates from `SCHEDULED` -> `IN_PROGRESS` (Call In) -> `COMPLETED`.
 *   **Persistence**: Interviewer session persists through candidate switches using WebSocket updates and specific UI logic.
