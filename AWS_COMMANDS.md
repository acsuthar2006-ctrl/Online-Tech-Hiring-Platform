# AWS Server Commands Cheat Sheet

This document contains a list of useful commands for managing the **Online Tech Hiring Platform** on the AWS EC2 server.

## 🔑 1. Connecting to the Server

Replace `YOUR_SERVER_IP` with the current public IP of your instance (e.g., `13.203.105.240`).

```bash
# Connect via SSH
ssh -i peerchat-key.pem ubuntu@YOUR_SERVER_IP

# If you get a "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED" error
ssh -o StrictHostKeyChecking=no -i peerchat-key.pem ubuntu@YOUR_SERVER_IP
```

---

## 🚀 2. Updating the Application

Use these commands whenever you push new changes to GitHub and want them live on the server.

```bash
# 1. Navigate to the project directory
cd Online-Tech-Hiring-Platform

# 2. Pull the latest code (Press Enter if asked)
git pull

# 3. Rebuild Frontend (Critical for UI changes)
cd platform-frontend
npm install
npm run build
cd ..

# 4. Restart the Media Server
cd media-server
npm install
pm2 restart Online-Tech-Hiring-Platform
```

**One-liner command (from media-server folder if you only updated backend code):**

```bash
git pull && npm install && pm2 restart Online-Tech-Hiring-Platform
```

---

## 📊 3. Viewing Logs

Check logs to debug issues, see who is joining, or verify recordings.

```bash
# View live logs (Stream) - Press Ctrl+C to exit
pm2 logs Online-Tech-Hiring-Platform

# View last 100 lines (No stream)
pm2 logs Online-Tech-Hiring-Platform --lines 100 --nostream

# View specific error logs
cat ~/.pm2/logs/Online-Tech-Hiring-Platform-error.log
```

---

## 🛠️ 4. Managing the Application Process (PM2)

```bash
# Check status (See valid uptime, restart count)
pm2 status

# Stop the application
pm2 stop Online-Tech-Hiring-Platform

# Start the application (if stopped)
# Ensure you serve from media-server directory!
cd ~/Online-Tech-Hiring-Platform/media-server
pm2 start server.js --name Online-Tech-Hiring-Platform
```

---

## 📹 5. Managing Recordings

Recordings are stored in `media-server/recordings/`.

```bash
# List all recordings (show sizes to verify they aren't empty)
ls -lh ~/Online-Tech-Hiring-Platform/media-server/recordings
```

---

## ⚙️ 6. Configuration (.env)

If you need to change ports or settings manually.

```bash
# Edit .env file
nano ~/Online-Tech-Hiring-Platform/media-server/.env

# Save: Ctrl+O, Enter
# Exit: Ctrl+X
```

**Key Variables:**

- `DETECT_PUBLIC_IP=true` (Ensures auto-IP works)
- `ENABLE_RECORDING=true`
- `MEDIASOUP_ANNOUNCED_IP` (Auto-updated on restart if configured in env)

---

## 🛑 7. Server Maintenance

```bash
# Check Disk Usage (Make sure disk isn't full)
df -h

# Check Memory/CPU usage
top
```
