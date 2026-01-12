#!/bin/bash

# 1. Get Public IP
# Using AWS metadata service (IMDSv2) for security, fall back to external service if needed
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null`
if [ -z "$TOKEN" ]; then
    # Fallback to simple IMDSv1 if token fails
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
else
    PUBLIC_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/public-ipv4)
fi

# Fallback to ifconfig.me if AWS metadata fails (e.g. not on AWS)
if [ -z "$PUBLIC_IP" ]; then
    PUBLIC_IP=$(curl -s ifconfig.me)
fi

if [ -z "$PUBLIC_IP" ]; then
    echo "Error: Could not detect Public IP."
    exit 1
fi

echo "Detected Public IP: $PUBLIC_IP"

# 2. Restart App with New IP
echo "Restarting 'Online-Tech-Hiring-Platform' with new IP..."
MEDIASOUP_ANNOUNCED_IP=$PUBLIC_IP pm2 restart Online-Tech-Hiring-Platform --update-env

# 3. Save Config
pm2 save

echo "Done! Application is running on http://$PUBLIC_IP:3000"
