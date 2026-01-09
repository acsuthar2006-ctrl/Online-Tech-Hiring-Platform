# Deploying PeerChat to AWS EC2

This guide explains how to deploy the application to an AWS EC2 instance. Deploying to public cloud server solves "Not in same WiFi" connectivity issues by providing a public IP address reachable from any network (4G/5G, different WiFi).

## Prerequisites

- AWS Account
- Basic familiarity with terminal/SSH

## Step 1: Launch EC2 Instance

1.  **Go to AWS Console** > **EC2** > **Launch Instance**.
2.  **Name**: `PeerChat-Server`
3.  **OS Image**: `Ubuntu Server 24.04 LTS` (or 22.04 LTS).
4.  **Instance Type**: `t3.small` or `t3.medium` (t2.micro is likely too weak for video encoding/transcoding).
5.  **Storage (IMPORTANT)**: The default is 8GB. Since you are recording video, **increase this to 50GB or 100GB**.
    - In the "Configure Storage" section, change `8 GiB` to `50 GiB` (or more).
6.  **Key Pair**: Create a new key pair (e.g., `peerchat-key.pem`) and download it.

## Step 2: Configure Security Group (Firewall)

> [!IMPORTANT]
> This is the most critical step. If you do not open these ports, video will fail.

Create a new Security Group with the following **Inbound Rules**:

| Type | Protocol | Port Range | Source | Description |
| :--- | :--- | :--- | :--- | :--- |
| SSH | TCP | 22 | My IP | For you to manage the server |
| HTTP | TCP | 80 | 0.0.0.0/0 | Optional (if using standard web port) |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | The Node.js Web/WebSocket Server |
| **Custom UDP** | **UDP** | **40000 - 40050** | **0.0.0.0/0** | **WebRTC Media Traffic** |

## Step 3: Elastic IP (Static IP)

1.  In EC2 Dashboard, go to **Network & Security** > **Elastic IPs**.
2.  Click **Allocate Elastic IP address**.
3.  Select the new IP and click **Actions** > **Associate Elastic IP address**.
4.  Select your running instance (`PeerChat-Server`).
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

Clone your repository (or copy files via SCP):
*(Replace with your actual repo URL)*

```bash
git clone https://github.com/Start-Up-POC/Online-Tech-Hiring-Platform.git

cd Online-Tech-Hiring-Platform
```

Install NPM dependencies:

```bash
npm install
```

## Step 6: Configure and Run

You must tell the server its own Public IP so it can announce it to clients.

### Option A: Quick Test

```bash
export MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP
npm start
```
*Note: Replace `YOUR_PUBLIC_IP` with the actual Elastic IP (e.g., `54.2.10.12`).*

### Option B: Production (Using PM2)

Use `pm2` to keep the app running even if you close the terminal.

```bash
sudo npm install -g pm2

# Start the app with the environment variable
MEDIASOUP_ANNOUNCED_IP=YOUR_PUBLIC_IP pm2 start server.js --name peerchat

# Save the process list to restart on reboot
pm2 save
pm2 startup
```

## Troubleshooting

### "Video is connecting..." forever?
1.  Check **Security Groups**: Are UDP ports 40000-40050 open to `0.0.0.0/0`?
2.  Check **Announced IP**: Did you set `MEDIASOUP_ANNOUNCED_IP` correctly?
    - Check logs: `pm2 logs peerchat`
    - It should say: `Announced IP: 54.x.x.x`

### "Socket connection failed"?
- Ensure port 3000 is open in Security Groups.
- Ensure you are connecting to `http://YOUR_PUBLIC_IP:3000`.

> [!TIP]
> **SSL/HTTPS**: For real-world usage, browsers require HTTPS for camera access. You typically need a domain name (e.g., `chat.example.com`) pointing to your IP, and use Nginx + Certbot (Let's Encrypt) to handle SSL, proxying traffic to localhost:3000.
