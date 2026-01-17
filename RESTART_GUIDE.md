# 🔄 Server Restart & IP Update Guide

If you stop your AWS instance and start it again later, **Amazon will give you a NEW Public IP address** (unless you bought an Elastic IP).

When this happens, your old link (e.g., `https://15.207.xxx.xxx`) will stop working. You must follow these steps to update the server.

---

## Step 1: Get Your New IP

1.  Go to **AWS Console** -> **EC2** -> **Instances**.
2.  Click your `PeerChat-Server` instance.
3.  Copy the **Public IPv4 address** (e.g., `13.123.45.67`).

---

## Step 2: Connect to Server

Open your terminal on your computer and run (replacing `NEW_IP` with the actual number):

```bash
# Example: ssh -i peerchat-key.pem ubuntu@13.123.45.67
ssh -i peerchat-key.pem ubuntu@<NEW_IP_HERE>
```

---

## Step 3: Run This Update Command

Once inside the server, copy and paste this **entire block** of code at once. It will:

1. Update Nginx to use the new IP.
2. Generate a new SSL certificate.
3. Restart everything.

**Replace `YOUR_NEW_IP` with the actual IP (e.g. 13.123.45.67) manually before pasting!**

```bash
# === COPY FROM HERE ===
export NEW_IP="YOUR_NEW_IP_HERE"

# 1. Update Nginx Config
sudo bash -c "cat > /etc/nginx/sites-available/peerchat <<EOF
server {
    listen 80;
    server_name _;
    return 301 https://\\\$host\\\$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/ssl/certs/selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/selfsigned.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
    }
}
EOF"

# 2. Generate New SSL Cert for this IP
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=PeerChat/CN=\$NEW_IP"

# 3. Restart Services
sudo systemctl reload nginx
pm2 restart peerchat

echo "✅ SUCCESS! New Link: https://\$NEW_IP"
# === END COPY ===
```
