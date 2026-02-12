#!/bin/bash

# API Testing Script for Tech Hiring Platform
# Backend URL
BASE_URL="http://localhost:8080/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function for printing test results
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS - $2 (HTTP $3)${NC}"
    if [ ! -z "$4" ]; then
      echo "  Response: $4"
    fi
  else
    echo -e "${RED}✗ FAIL - $2 (HTTP $3)${NC}"
    echo "  Response: $4"
  fi
  echo ""
}

echo "========================================"
echo "  API Testing - Tech Hiring Platform"
echo "========================================"

# [1] Testing Authentication
echo "[1] Testing Authentication APIs"
echo "-----------------------------------"

# Login as Candidate (from TestEmailRunner)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sutharaarya793@gmail.com", "password":"pass"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
CANDIDATE_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [[ $HTTP_CODE -eq 200 && ! -z "$CANDIDATE_TOKEN" ]]; then
  print_result 0 "Login as Candidate" $HTTP_CODE "$BODY"
else
  print_result 1 "Login as Candidate" $HTTP_CODE "$BODY"
fi

# Login as Interviewer (from TestEmailRunner)
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"interviewer@test.com", "password":"pass"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
INTERVIEWER_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [[ $HTTP_CODE -eq 200 && ! -z "$INTERVIEWER_TOKEN" ]]; then
  print_result 0 "Login as Interviewer" $HTTP_CODE "$BODY"
else
  print_result 1 "Login as Interviewer" $HTTP_CODE "$BODY"
fi

# [2] Test Public GET Endpoints
echo "[2] Testing Public GET Endpoints"
echo "-----------------------------------"

# Get All Companies
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/companies)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [[ $HTTP_CODE -eq 200 ]]; then
  print_result 0 "Get All Companies" $HTTP_CODE "$BODY"
else
  print_result 1 "Get All Companies" $HTTP_CODE "$BODY"
fi

# Get Open Positions
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/positions/open)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [[ $HTTP_CODE -eq 200 ]]; then
  print_result 0 "Get Open Positions" $HTTP_CODE "$BODY"
else
  print_result 1 "Get Open Positions" $HTTP_CODE "$BODY"
fi


# [3] Test Protected Endpoints (Candidate)
echo "[3] Testing Protected Endpoints (Candidate)"
echo "-----------------------------------"

# Get Candidate Profile
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [[ $HTTP_CODE -eq 200 ]]; then
  print_result 0 "Get Candidate Profile" $HTTP_CODE "$BODY"
else
  print_result 1 "Get Candidate Profile" $HTTP_CODE "$BODY"
fi

# Get Upcoming Interviews (Candidate)
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/interviews/candidate/upcoming?email=sutharaarya793@gmail.com" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [[ $HTTP_CODE -eq 200 ]]; then
  print_result 0 "Get Upcoming Interviews (Candidate)" $HTTP_CODE "$BODY"
else
  print_result 1 "Get Upcoming Interviews (Candidate)" $HTTP_CODE "$BODY"
fi

# [4] Test Protected Endpoints (Interviewer)
echo "[4] Testing Protected Endpoints (Interviewer)"
echo "-----------------------------------"

# Get Interviewer Profile
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [[ $HTTP_CODE -eq 200 ]]; then
  print_result 0 "Get Interviewer Profile" $HTTP_CODE "$BODY"
else
  print_result 1 "Get Interviewer Profile" $HTTP_CODE "$BODY"
fi

# Get Upcoming Interviews (Interviewer)
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/interviews/interviewer/upcoming?email=interviewer@test.com" \
  -H "Authorization: Bearer $INTERVIEWER_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [[ $HTTP_CODE -eq 200 ]]; then
  print_result 0 "Get Upcoming Interviews (Interviewer)" $HTTP_CODE "$BODY"
else
  print_result 1 "Get Upcoming Interviews (Interviewer)" $HTTP_CODE "$BODY"
fi

# [5] Test Email Functionality (Dev Profile)
echo "[5] Testing Email API (Dev Profile)"
echo "-----------------------------------"

# Send Test Email
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/test/send-email?email=test@example.com")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [[ $HTTP_CODE -eq 200 ]]; then
  print_result 0 "Send Test Email" $HTTP_CODE "$BODY"
else
  print_result 1 "Send Test Email" $HTTP_CODE "$BODY"
fi

echo "========================================"
echo "  Test Complete"
echo "========================================"
