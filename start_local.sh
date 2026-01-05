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

echo "🚀 Starting Server..."
echo "📱 On Mobile (Same WiFi): Open the Ngrok URL (for HTTPS) or http://$MEDIASOUP_ANNOUNCED_IP:3000"
echo "ℹ️  If using Ngrok, keep this running and start 'ngrok http 3000' in another tab."

node server.js
