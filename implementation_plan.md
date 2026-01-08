# P2P Migration Implementation Plan

## Goal
Switch from Mediasoup SFU to WebRTC Peer-to-Peer (Mesh) architecture. This enables external connectivity without complex router configuration and simplifies hosting. Recording will be moved to the client-side.

## Key Changes

### 1. Cleanup
- **Directory**: Remove `sfu/` folder.
- **Dependencies**: Uninstall `mediasoup`, `mediasoup-client`, `ffmpeg-static`.

### 2. Server (Signaling Relay)
- **Refactor `server.js`**: 
  - Remove all Mediasoup initialization.
  - Keep `http/staticServer.js` (it already handles Serving + Uploads).
  - Simplify `ws/websocketServer.js` to blindly relay messages between peers in a room.
- **Signals to Relay**: `offer`, `answer`, `candidate`, `join`, `leave`.

### 3. Client (P2P WebRTC)
- **Refactor `public/js/webrtc.js`**:
  - Remove `MediasoupClient`.
  - Implement `RTCPeerConnection`:
    - `const pc = new RTCPeerConnection({ iceServers: [...] })`
    - `pc.onicecandidate` -> send to socket.
    - `pc.ontrack` -> attach to `remoteVideo`.
    - `pc.addTrack` -> add local stream.
  - Implement Negotiation Logic:
    - **Polite Peer** pattern or simple "Caller creates Offer" (Joiner = Offer-er).

### 4. Client (Recording)
- **Refactor `public/js/screenRecorder.js`**:
  - Ensure `mediaRecorder` captures the tab (video+audio).
  - **Upload on Exit**:
    - Trigger `stop()` on "End Call".
    - Use `navigator.sendBeacon()` for reliable/non-blocking upload if possible.
    - Fallback to `fetch()` with `keepalive: true`.

## Verification Steps
1.  **Localhost**: Open 2 tabs -> Video should work.
2.  **Ngrok**: Open 1 tab on laptop, 1 on 4G Phone -> Video should work (via STUN).
3.  **Recording**: Record a session -> End Call -> Verify `.webm` file appears in `recordings/` folder on server.
