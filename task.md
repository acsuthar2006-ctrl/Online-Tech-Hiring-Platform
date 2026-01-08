# Task: Migrate to P2P Architecture

- [ ] Create Implementation Plan <!-- id: 0 -->
- [ ] **Cleanup**: Remove Mediasoup dependencies and `sfu/` directory <!-- id: 1 -->
- [ ] **Server**: Refactor `server.js` to be a lightweight Signaling Server (Socket Relay) <!-- id: 2 -->
- [ ] **Server**: Ensure `http/staticServer.js` handles file uploads correctly <!-- id: 3 -->
- [ ] **Client**: Update `public/js/socket.js` to handle Signal messages (Offer/Answer/ICE) <!-- id: 4 -->
- [ ] **Client**: Rewrite `public/js/webrtc.js` to use `RTCPeerConnection` (P2P Mesh) <!-- id: 5 -->
- [ ] **Recording**: Update `public/js/screenRecorder.js` for Auto-Upload on Exit (Non-blocking) <!-- id: 6 -->
- [ ] **Cleanup**: Remove `mediasoup` from `package.json` <!-- id: 7 -->
- [ ] **Verification**: Test P2P connection and Recording Upload <!-- id: 8 -->
