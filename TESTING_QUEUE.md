# How to Test the Interview Queue

This guide explains how to add multiple candidates to the same room and verify the queue visibility and presence features.

## Step 1: Schedule Multiple Candidates in the Same Room

You need to create 2 or 3 interviews that share the exact same `meetingLink` (Room ID).

You can do this using your backend API (e.g., via Postman or Swagger) by hitting the schedule endpoint (`POST /api/interviews/schedule`). Make sure you pass the same `meetingLink` for all of them.

**Example Request 1 (Candidate 1):**
```json
{
  "interviewerEmail": "interviewer@example.com",
  "candidateEmail": "candidate1@example.com",
  "candidateName": "Alice Candidate",
  "title": "Frontend Interview",
  "meetingLink": "test-room-123",  <-- Same Room ID
  "scheduledTime": "2026-02-23T10:00:00"
}
```

**Example Request 2 (Candidate 2):**
```json
{
  "interviewerEmail": "interviewer@example.com",
  "candidateEmail": "candidate2@example.com",
  "candidateName": "Bob Candidate",
  "title": "Frontend Interview",
  "meetingLink": "test-room-123",  <-- Same Room ID
  "scheduledTime": "2026-02-23T10:45:00"
}
```

## Step 2: Open the Interviewer View

Open your browser and navigate to the interviewer's view for that room:

`http://localhost:5173/interview_screen/video_interview.html?room=test-room-123&role=interviewer`

1. Open the **Session Queue** modal.
2. Since no candidates have joined yet, you should see both Alice and Bob listed as **Not in lobby**.
3. Next to their names, you should see a **Remind** button instead of "Call In". You can test clicking this to ensure the reminder email is triggered.

## Step 3: Open Candidate 1 View (Joined Lobby)

Open a **New Incognito Window** (or a different browser) and join as Candidate 1:

`http://localhost:5173/interview_screen/video_interview.html?room=test-room-123&role=candidate&email=candidate1@example.com`

1. The "Waiting for Interviewer" overlay will appear.
2. Look at the Queue Sidebar on the right. Because of the new `z-index`, it should now be clearly visible above the dark overlay.
3. Candidate 1 (Alice) will see her own name highlighted as `YOU`.
4. She will see Candidate 2 listed as `Candidate #2` (Masked name).
5. Switch back to your **Interviewer window**. The Session Queue modal should now dynamically update Alice to show **Waiting**, and the button should change to **Call In**.

## Step 4: Open Candidate 2 View (Joined Lobby)

Open another **New Incognito Window** and join as Candidate 2:

`http://localhost:5173/interview_screen/video_interview.html?room=test-room-123&role=candidate&email=candidate2@example.com`

1. Bob will see the Queue Sidebar. He will see `Candidate #1` and his own name `Bob Candidate` marked as `YOU`.
2. Both candidates will see their statuses update in real-time.
3. Switch back to your **Interviewer window**. Bob should now also show as **Waiting** with a **Call In** button.

## Step 5: Test "Call In" logic

1. From the **Interviewer window**, click **Call In** for Candidate 1 (Alice). 
2. Alice's video session will start.
3. Look at Candidate 2's queue sidebar. Alice's status will change from `Waiting` to `Interview in progress`.

## Step 6: Test Auto-Complete / Kicking

1. While Candidate 1 (Alice) is actively in the interview, go to the interviewer's Session Queue.
2. Click **Call In** for Candidate 2 (Bob).
3. The system will automatically mark Alice's interview as `COMPLETED`. Alice's session should end.
4. Bob will be pulled into the active interview. 
5. The queue UI will update for everyone, showing Alice as `Interview done` (crossed out) and Bob as `Interview in progress`.
