#!/bin/bash

echo "🔍 Detecting Local LAN IP..."
# Robustly detect the interface used for the default route
DEFAULT_IFACE=$(route get default 2>/dev/null | grep interface | awk '{print $2}')

if [ -z "$DEFAULT_IFACE" ]; then
    # Fallback to common interfaces if route detection fails
    export MEDIASOUP_ANNOUNCED_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
else
    export MEDIASOUP_ANNOUNCED_IP=$(ipconfig getifaddr "$DEFAULT_IFACE")
    echo "ℹ️  Using interface: $DEFAULT_IFACE"
fi

if [ -z "$MEDIASOUP_ANNOUNCED_IP" ]; then
    echo "❌ Failed to detect Local IP. Using localhost."
    export MEDIASOUP_ANNOUNCED_IP="127.0.0.1"
else
    echo "✅ Local IP Detected: $MEDIASOUP_ANNOUNCED_IP"
fi


# Disable Public IP Detection for true local LAN testing
# Uncomment the line below if you specifically need to test with Public IP (e.g. for external mobile access without VPN)
# export DETECT_PUBLIC_IP=true

echo "🚀 Starting Server..."
echo "📱 On Mobile (Same WiFi): Access via http://$MEDIASOUP_ANNOUNCED_IP:3000"
echo "ℹ️  Ensure ports 40000-40050/udp are allowed in your firewall if connection fails."

node server.js
