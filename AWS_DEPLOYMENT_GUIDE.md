# Deploying Online-Tech-Hiring-Platform to AWS EC2

This guide explains how to deploy the application to an AWS EC2 instance. The project is split into a frontend (React/Vite) and a media server (Node.js/Mediasoup), but we will serve them from a single entry point for simplicity.

## Prerequisites

- AWS Account
- Basic familiarity with terminal/SSH
- **Important**: Your local machine must have the project code ready.

## Step 1: Launch EC2 Instance

1.  **Go to AWS Console** > **EC2** > **Launch Instance**.
2.  **Name**: `Online-Tech-Hiring-Platform-Server`
3.  **OS Image**: `Ubuntu Server 24.04 LTS` (or 22.04 LTS).
4.  **Instance Type**: `t3.small` or `t3.medium` (t2.micro is likely too weak for video encoding/transcoding).
5.  **Storage (IMPORTANT)**: The default is 8GB. Since you are recording video, **increase this to 50GB or 100GB**.
    - In the "Configure Storage" section, change `8 GiB` to `50 GiB` (or more).
6.  **Key Pair**: Create a new key pair (e.g., `peerchat-key.pem`) and download it.

## Step 2: Configure Security Group (Firewall)

> [!IMPORTANT]
> This is the most critical step. If you do not open these ports, video will fail.

Create a new Security Group with the following **Inbound Rules**:

| Type           | Protocol | Port Range        | Source        | Description                           |
| :------------- | :------- | :---------------- | :------------ | :------------------------------------ |
| SSH            | TCP      | 22                | My IP         | For you to manage the server          |
| HTTP           | TCP      | 80                | 0.0.0.0/0     | Optional (if using standard web port) |
| Custom TCP     | TCP      | 3000              | 0.0.0.0/0     | The Main Server (API + Frontend)      |
| **Custom UDP** | **UDP**  | **40000 - 40050** | **0.0.0.0/0** | **WebRTC Media Traffic**              |

## Step 3: Elastic IP (Static IP)

1.  In EC2 Dashboard, go to **Network & Security** > **Elastic IPs**.
2.  Click **Allocate Elastic IP address**.
3.  Select the new IP and click **Actions** > **Associate Elastic IP address**.
4.  Select your running instance (`Online-Tech-Hiring-Platform-Server`).
5.  **Copy this IP address**. We will refer to it as `YOUR_PUBLIC_IP`.

## Step 4: Server Setup

Open your terminal and SSH into the server:

```bash
chmod 400 path/to/peerchat-key.pem
ssh -i path/to/peerchat-key.pem ubuntu@YOUR_PUBLIC_IP
```

Now, inside the server, install dependencies:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Build Tools (needed for Mediasoup)
sudo apt install -y build-essential python3-pip net-tools

# Install FFmpeg (for recording)
sudo apt install -y ffmpeg
```

## Step 5: Deploy Code

Clone your repository:
_(Replace with your actual repo URL)_

```bash
git clone https://github.com/Start-Up-POC/Online-Tech-Hiring-Platform.git
cd Online-Tech-Hiring-Platform
```

### 5.1 Build the Frontend

We need to build the React frontend so the server can serve it as static files.

```bash
cd platform-frontend
npm install
npm run build
cd ..
```
*This creates a `dist` folder inside `platform-frontend`.*

### 5.2 Install Server Dependencies

Now set up the media server.

```bash
cd media-server
npm install
```

## Step 6: Configure and Run

You must tell the server its own Public IP so it can announce it to clients.

### Option A: Quick Test

```bash
# Inside media-server directory
export MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP
npm start
```
*You should now be able to visit `http://YOUR_PUBLIC_IP:3000` to see the app.*

### Option B: Production (Using PM2)

Use `pm2` to keep the app running in the background.

```bash
sudo npm install -g pm2

# Start the app with the environment variable
MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP pm2 start server.js --name Online-Tech-Hiring-Platform

# Save the process list to restart on reboot
pm2 save
pm2 startup
```

## Troubleshooting

### "Video is connecting..." forever?

1.  Check **Security Groups**: Are UDP ports 40000-40050 open to `0.0.0.0/0`?
2.  Check **Announced IP**: Did you set `MEDIASOUP_ANNOUNCED_IP` correctly?
    - Check logs: `pm2 logs Online-Tech-Hiring-Platform`
    - It should say: `Announced IP: 54.x.x.x`

### "Socket connection failed"?
- Ensure port 3000 is open in Security Groups.
- Ensure you are connecting to `http://YOUR_PUBLIC_IP:3000`.

> [!TIP]
> **SSL/HTTPS**: For real-world usage, browsers require HTTPS for camera access. You typically need a domain name and Nginx.
