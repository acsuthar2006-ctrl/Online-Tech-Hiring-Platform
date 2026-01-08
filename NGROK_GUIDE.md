# Ngrok & WebRTC Troubleshooting

## The Issue: "It works locally but not on Ngrok"

You are likely experiencing an issue where the **website loads** (HTML/CSS appears), but **video/audio fails to connect** or stays on "Connecting...".

### Why this happens
1. **Signaling (HTTP/WebSocket)**: Ngrok tunnels port `3000` (HTTP). This allows your phone to load the page and connect to the WebSocket. This part works!
2. **Media (Audio/Video)**: WebRTC sends audio/video over **UDP ports 40000-49999**.
   - Ngrok (Free/Standard) **does NOT tunnel these ports**.
   - Your server tells the client: "Send video to my IP: `192.168.x.x`".
   - **If you are on the same WiFi**: Your phone *can* reach `192.168.x.x`, so it works.
   - **If you are on Mobile Data (4G/5G)**: Your phone cannot reach your private `192.168.x.x` IP. The video connection fails.

## How to Test Properly

### Scenario A: Testing with a Friend / Different Network (4G)
**You cannot do this with just the standard `ngrok http 3000` command.**
To make this work, the server must have a **Public IP** reachable from the internet for the media ports.
- **Solution**: Deploy to a cloud server (AWS, DigitalOcean, Heroku with limited port support).
- **Alternative**: Use a TURN server (Advanced).

### Scenario B: Testing with Mobile Device (Same WiFi) - RECOMMENDED
You can test with your mobile phone if it is connected to the **same WiFi network** as your computer.

1. **Find your Local IP**:
   - Run `ifconfig` or `ipchk` (Mac) or check your Network settings.
   - Example: `10.140.100.77`

2. **Run the Server**:
   ```bash
   # Automatically detects IP and hints usage
   ./start_local.sh
   # OR
   export MEDIASOUP_ANNOUNCED_IP=10.140.100.77
   npm start
   ```

3. **Connect with Ngrok (for HTTPS)**:
   - WebRTC requires **HTTPS** to access the camera/microphone.
   - Run `ngrok http 3000`.
   - Open the Ngrok URL (e.g., `https://abcd.ngrok.io`) on your mobile.
   - **Crucial**: Since your phone is on the same WiFi, the "Announced IP" (`10.140.100.77`) sent by the server *is* reachable by your phone. The video should works.

### Summary Checklist
- [ ] Connect computer and phone to the **Same WiFi**.
- [ ] Run `./start_local.sh` (confirms the detected IP).
- [ ] Run `ngrok http 3000` in a separate terminal.
- [ ] Open Ngrok URL on phone.
- [ ] Join room.

If it still fails on the same WiFi:
- Check if your computer's **Firewall** is blocking UDP ports 40000-49999.
- Ensure `./start_local.sh` detected the *correct* IP (the WiFi one, not a Docker/VM one).