#!/bin/bash

# Initialize test data for Online Tech Hiring Platform
# This script creates test users and schedules sample interviews

BASE_URL="http://localhost:8080/api"
MEETING_ID="ba594a64-a731-4cbe-b7dd-e1b6386aecc9"

echo "🚀 Initializing test data..."

# 1. Register Interviewer
echo "📝 Registering interviewer..."
curl -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "interviewer@example.com",
    "password": "password123",
    "fullName": "John Interviewer",
    "role": "INTERVIEWER",
    "companyName": "Tech Corp"
  }'
echo ""

# 2. Register First Candidate
echo "📝 Registering first candidate..."
curl -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "password": "password123",
    "fullName": "Test Candidate",
    "role": "CANDIDATE",
    "skills": "JavaScript, React, Node.js",
    "resumeUrl": "https://example.com/resume1.pdf"
  }'
echo ""

# 3. Register Second Candidate
echo "📝 Registering second candidate..."
curl -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate2@example.com",
    "password": "password123",
    "fullName": "Second Candidate",
    "role": "CANDIDATE",
    "skills": "Python, Django, PostgreSQL",
    "resumeUrl": "https://example.com/resume2.pdf"
  }'
echo ""

# 4. Schedule First Interview
echo "📅 Scheduling first interview..."
curl -X POST "$BASE_URL/interviews/schedule" \
  -H "Content-Type: application/json" \
  -d "{
    \"interviewerEmail\": \"interviewer@example.com\",
    \"candidateEmail\": \"candidate@example.com\",
    \"candidateName\": \"Test Candidate\",
    \"scheduledTime\": \"$(date -u -v+1H +"%Y-%m-%dT%H:%M:%S")\",
    \"title\": \"Frontend Developer Interview\",
    \"meetingLink\": \"$MEETING_ID\"
  }"
echo ""

# 5. Schedule Second Interview
echo "📅 Scheduling second interview..."
curl -X POST "$BASE_URL/interviews/schedule" \
  -H "Content-Type: application/json" \
  -d "{
    \"interviewerEmail\": \"interviewer@example.com\",
    \"candidateEmail\": \"candidate2@example.com\",
    \"candidateName\": \"Second Candidate\",
    \"scheduledTime\": \"$(date -u -v+2H +"%Y-%m-%dT%H:%M:%S")\",
    \"title\": \"Backend Developer Interview\",
    \"meetingLink\": \"$MEETING_ID\"
  }"
echo ""

echo "✅ Test data initialization complete!"
echo ""
echo "📋 Test URLs:"
echo "Interviewer: http://localhost:5173/index.html?room=$MEETING_ID&role=interviewer"
echo "Candidate 1: http://localhost:5173/index.html?room=$MEETING_ID&role=candidate&email=candidate@example.com"
echo "Candidate 2: http://localhost:5173/index.html?room=$MEETING_ID&role=candidate&email=candidate2@example.com"
echo ""
echo "🔑 Login credentials:"
echo "Interviewer: interviewer@example.com / password123"
echo "Candidate 1: candidate@example.com / password123"
echo "Candidate 2: candidate2@example.com / password123"
