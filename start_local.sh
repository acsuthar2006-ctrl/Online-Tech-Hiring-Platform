#!/bin/bash

echo "🔍 Detecting Local LAN IP..."
# Detect Local IP (works on Mac/Linux)
export MEDIASOUP_ANNOUNCED_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)

if [ -z "$MEDIASOUP_ANNOUNCED_IP" ]; then
    echo "❌ Failed to detect Local IP. Using localhost."
    export MEDIASOUP_ANNOUNCED_IP="127.0.0.1"
else
    echo "✅ Local IP Detected: $MEDIASOUP_ANNOUNCED_IP"
fi


# Enable Public IP Detection for Ngrok/External Support
export DETECT_PUBLIC_IP=true

echo "🚀 Starting Server..."
echo "📱 On Mobile (4G/External): Ensure UDP Ports 40000-40050 are forwarded on your router!"
echo "ℹ️  If using Ngrok, keep this running and start 'ngrok http 3000' in another tab."

node server.js
