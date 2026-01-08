# Architecture Plan: P2P + Client-Side Recording

## The "SFU Recording" Problem
You asked to use **P2P for calling** but **SFU for recording**.
**Issue**: To record on the server (SFU), the participants MUST send video to the server.
- This requires **UDP Ports** and **Public IP**.
- This brings back the exact "Same WiFi" / "Ngrok" problem you are trying to solve.
- **Verdict**: If you can't host SFU for calling, you can't host it for recording either.

## The Solution: P2P with Client-Side Recording

We will move the recording responsibility to the **Interviewer's Browser**.

### How it works
1.  **Calling (P2P)**:
    - Interviewer ↔ Candidate connect directly (Video/Audio).
    - Works on 4G, usually no port forwarding needed.
2.  **Recording (Client-Side)**:
    - The Interviewer clicks "Record".
    - Browser uses `getDisplayMedia` to record the **entire tab** (seeing both videos).
    - When stopped, the browser **uploads** the file to the server (or S3/Cloudinary).

### Benefits
1.  **Hosting Friendly**:
    - Frontend: Vercel / Netlify.
    - Signaling (Socket): Render / Railway / Heroku (Free Tiers).
    - **No VPS needed**.
2.  **No Connectivity Issues**: UDP traffic is direct between users.

## Plan to Migrate
1.  **Remove Mediasoup**: Delete `sfu/` folder and dependencies.
2.  **Update `webrtc.js`**: Implement P2P (Offer/Answer) logic.
3.  **Update `screenRecorder.js`**: Ensure it captures the "Tab" (which includes remote video) + Mic.
    - *Current implementation already does this!*
4.  **Update `server.js`**: Just a simple WebSocket relay (easy to host anywhere).

**Shall I proceed with this P2P + Client Recording plan?**
