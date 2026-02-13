#!/bin/bash

BASE_URL="http://localhost:8080/api"
CANDIDATE_EMAIL="test.candidate@example.com"
INTERVIEWER_EMAIL="test.interviewer@example.com"
PASSWORD="password123"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "============================================"
echo "      Testing Backend APIs"
echo "============================================"

# 1. Register Candidate
echo -e "\n[1] Registering Candidate..."
curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CANDIDATE_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"fullName\": \"Test Candidate\",
    \"role\": \"CANDIDATE\"
  }" | grep "registered" && echo -e "${GREEN}Candidate Registered${NC}" || echo -e "${RED}Candidate Registration Failed (might exist)${NC}"

# 2. Login Candidate
echo -e "\n[2] Logging in Candidate..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CANDIDATE_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

CANDIDATE_TOKEN=$(echo $LOGIN_RES | jq -r '.token')
CANDIDATE_ID=$(echo $LOGIN_RES | jq -r '.userId')

if [ "$CANDIDATE_TOKEN" != "null" ]; then
    echo -e "${GREEN}Candidate Logged In (ID: $CANDIDATE_ID)${NC}"
else
    echo -e "${RED}Candidate Login Failed${NC}"
    exit 1
fi

# 3. Test Candidate Skills
echo -e "\n[3] Testing Candidate Skills..."
echo "Adding Skill (Java)..."
SKILL_RES=$(curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/skills" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skillName": "Java",
    "proficiencyLevel": "expert"
  }')
echo $SKILL_RES
echo "Adding Skill (Spring Boot)..."
curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/skills" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skillName": "Spring Boot",
    "proficiencyLevel": "advanced"
  }' > /dev/null

echo "Fetching Skills..."
curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID/skills" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN"

# 4. Test Candidate Experience
echo -e "\n[4] Testing Candidate Experience..."
echo "Adding Experience..."
curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/experience" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Senior Developer",
    "companyName": "Tech Corp",
    "durationMonths": 24,
    "description": "Built backend systems"
  }'
echo -e "\nFetching Experience..."
curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID/experience" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN"

# 5. Test Candidate Settings
echo -e "\n[5] Testing Candidate Settings..."
echo "Updating Settings..."
curl -s -X PUT "$BASE_URL/settings/candidate/$CANDIDATE_ID" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotificationsEnabled": false,
    "themePreference": "dark"
  }'
echo -e "\nFetching Settings..."
curl -s -X GET "$BASE_URL/settings/candidate/$CANDIDATE_ID" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN"


# 6. Register Interviewer
echo -e "\n\n[6] Registering Interviewer..."
curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$INTERVIEWER_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"fullName\": \"Test Interviewer\",
    \"role\": \"INTERVIEWER\"
  }" | grep "registered" && echo -e "${GREEN}Interviewer Registered${NC}" || echo -e "${RED}Interviewer Registration Failed (might exist)${NC}"

# 7. Login Interviewer
echo -e "\n[7] Logging in Interviewer..."
INT_LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$INTERVIEWER_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

INTERVIEWER_TOKEN=$(echo $INT_LOGIN_RES | jq -r '.token')
INTERVIEWER_ID=$(echo $INT_LOGIN_RES | jq -r '.userId')

if [ "$INTERVIEWER_TOKEN" != "null" ]; then
    echo -e "${GREEN}Interviewer Logged In (ID: $INTERVIEWER_ID)${NC}"
else
    echo -e "${RED}Interviewer Login Failed${NC}"
    exit 1
fi

# 8. Test Interviewer Expertise
echo -e "\n[8] Testing Interviewer Expertise..."
echo "Adding Expertise..."
curl -s -X POST "$BASE_URL/interviewers/$INTERVIEWER_ID/expertise" \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expertiseArea": "System Design",
    "yearsOfExperience": 10
  }'
echo -e "\nFetching Expertise..."
curl -s -X GET "$BASE_URL/interviewers/$INTERVIEWER_ID/expertise" \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN"

# 9. Test Interviewer Jobs
echo -e "\n[9] Testing Interviewer Jobs..."
echo "Creating Job..."
curl -s -X POST "$BASE_URL/interviewer-jobs" \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Hiring Co",
    "title": "Senior Technical Interviewer",
    "description": "Conduct system design interviews",
    "hourlyRate": 85.0
  }'
echo -e "\nListing Jobs..."
curl -s -X GET "$BASE_URL/interviewer-jobs" \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN"

# 10. Test Recordings
echo -e "\n[10] Testing Recordings..."
echo "Saving Recording..."
curl -s -X POST "$BASE_URL/recordings" \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interviewId": "room-123",
    "filename": "rec_001.mp4",
    "url": "http://s3.bucket/rec_001.mp4",
    "durationSeconds": 3600
  }'
echo -e "\nFetching Recordings..."
curl -s -X GET "$BASE_URL/recordings/room-123" \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN"

echo -e "\n\n${GREEN}Test Completed!${NC}"
