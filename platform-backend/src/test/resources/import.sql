-- Companies
INSERT INTO companies (id, name, subscription_status, created_at) VALUES (1, 'TechCorp', 'PREMIUM', CURRENT_TIMESTAMP);
INSERT INTO companies (id, name, subscription_status, created_at) VALUES (2, 'StartupInc', 'FREE', CURRENT_TIMESTAMP);

-- Users
-- Candidate 1
INSERT INTO users (id, email, password, full_name, role) VALUES (1, 'candidate@test.com', '$2a$10$NotRealHashButPlaceholder', 'John Candidate', 'CANDIDATE');
INSERT INTO candidates (id, skills, resume_url) VALUES (1, 'Java, Spring', 'http://resume.url');

-- Interviewer 2
INSERT INTO users (id, email, password, full_name, role) VALUES (2, 'interviewer@techcorp.com', '$2a$10$NotRealHashButPlaceholder', 'Alice Interviewer', 'INTERVIEWER');
INSERT INTO interviewers (id, company_id) VALUES (2, 1);

-- Admin 3
INSERT INTO users (id, email, password, full_name, role) VALUES (3, 'admin@techcorp.com', '$2a$10$NotRealHashButPlaceholder', 'Bob Admin', 'COMPANY_ADMIN');
INSERT INTO company_admins (id, company_id) VALUES (3, 1);

-- Interviews
INSERT INTO interviews (id, title, candidate_id, interviewer_id, scheduled_time, meeting_link, status, interview_type) VALUES (1, 'Java Developer Interview', 1, 2, '2025-02-01 10:00:00', 'room-123', 'SCHEDULED', 'TECHNICAL');
INSERT INTO interviews (id, title, candidate_id, interviewer_id, scheduled_time, meeting_link, status, interview_type) VALUES (2, 'Completed Interview', 1, 2, '2025-01-01 10:00:00', 'room-456', 'COMPLETED', 'BEHAVIORAL');

-- Reset sequences
ALTER TABLE companies ALTER COLUMN id RESTART WITH 10;
ALTER TABLE users ALTER COLUMN id RESTART WITH 10;
ALTER TABLE interviews ALTER COLUMN id RESTART WITH 10;
