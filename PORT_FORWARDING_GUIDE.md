# How to Enable External Access (Port Forwarding + Ngrok)

Since you are running the Media Server (SFU) locally on your computer, you need to "punch a hole" in your home/office network so that external devices (like a phone on 4G) can send video to you.

## Step 3: Forwarding UDP Ports (The Hard Part)

You need to tell your Router: *"Any UDP traffic coming to ports 40000-40050 should be sent to my computer's IP."*

### 1. Find your Router's Address
- Typically: `http://192.168.0.1` or `http://192.168.1.1` or `http

://10.0.0.1`.
- Check the sticker on your router for the IP, Username, and Password.

### 2. Login to Admin Panel
- Enter the username/password (common defaults: `admin`/`admin` or `admin`/`password`).

### 3. Find "Port Forwarding"
- Look for **Advanced**, **NAT**, **Gaming**, or **Virtual Server** settings.
- Find a section called **Port Forwarding**.

### 4. Create a New Rule
Add a rule with these settings:
- **Service Name**: PeerChat (or any name)
- **Protocol**: **UDP** (Crucial! Do not select TCP or Both if possible, or select Both if unsure, but UDP is required)
- **External Port Range**: `40000-40050`
- **Internal Port Range**: `40000-40050`
- **Internal IP**: Your computer's IP (detected as **`10.30.219.133`** in your logs).

*Save the settings.*

## Step 4: Run Ngrok (The Easy Part)

Ngrok provides the HTTPS URL that your phone needs to load the website.

1. **Open a New Terminal** (Keep `./start_local.sh` running in the first one).
2. Run this command:
   ```bash
   ngrok http 3000
   ```
3. Copy the **Forwarding URL** (looks like `https://xxxx-xxxx.ngrok-free.app`).
4. Send this URL to your phone.

## Summary
- **Terminal 1**: Running `./start_local.sh` (Server)
- **Terminal 2**: Running `ngrok http 3000` (Tunnel)
- **Router**: Configured to forward UDP 40000-40050 to `10.30.219.133`.

Now your phone (on 4G) can load the site via Ngrok, and the video stream will flow directly to your router -> forwarded to your laptop.
