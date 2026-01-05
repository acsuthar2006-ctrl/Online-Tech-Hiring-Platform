// socket.js
import { state } from "./state.js";
import { setStatus } from "./ui.js";
import { acceptCall, endCall, startCall } from "./call.js";

export function initSocket() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${protocol}://${location.host}`;

  console.log(`[Socket] Connecting to ${wsUrl}`);

  state.socket = new WebSocket(wsUrl);

  state.socket.onopen = () => {
    console.log("[Socket] Connected");
    setStatus("Connected to server");
    sendSignal("join");
  };

  state.socket.onmessage = async evt => {
    try {
      const data = JSON.parse(evt.data);
      console.log("[Socket] Received:", data.type);

      // Ignore messages from self
      if (data.from === state.uid) return;

      switch (data.type) {
        case "serverInfo":
          const savedInstance = localStorage.getItem('serverInstance');
          if (savedInstance && savedInstance !== data.instanceId) {
            console.log('[Socket] Server instance changed. Clearing localStorage.');
            localStorage.clear();
            localStorage.setItem('serverInstance', data.instanceId);
            // Optional: Notify user
            // setStatus("Session reset (Server restarted)");
          } else {
            localStorage.setItem('serverInstance', data.instanceId);
          }
          break;

        case "newProducer":
          console.log("[Socket] New Producer available:", data.kind);
          // Import loop workaround or use window global? 
          // Ideally: import { consumeProducer } from "./webrtc.js"; (circular dependency risk)
          // We can attach consumeProducer to state or window.
          if (window.consumeProducer) {
            window.consumeProducer(data.producerId, data.kind);
          }
          break;

        case "joined":
          console.log("[Socket] Joined room successfully");
          break;

        case "routerRtpCapabilities":
        case "createWebRtcTransportResponse":
        case "connectWebRtcTransportResponse":
        case "produceResponse":
        case "consumeResponse":
        case "getProducersResponse":
        case "ack":
          // These are handled by request() logic in webrtc.js via event listener
          break;

        case "leave":
          console.log("[Socket] Peer left");
          setStatus("Peer left");
          // Handle cleanup if needed
          break;

        default:
          console.warn("[Socket] Unknown message type:", data.type);
      }
    } catch (err) {
      console.error("[Socket] Error handling message:", err);
    }
  };

  state.socket.onerror = err => {
    console.error("[Socket] Error:", err);
    setStatus("Connection error");
  };

  state.socket.onclose = evt => {
    console.log("[Socket] Disconnected:", evt.code, evt.reason);
    setStatus("Disconnected from server");

    if (!state.isLeaving) {
      alert("Lost connection to server");
      window.location.href = "/lobby.html";
    }
  };
}

export function sendSignal(type, payload = {}) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    console.error("[Socket] Cannot send - socket not open");
    return;
  }

  const message = {
    type,
    from: state.uid,
    channel: state.roomId,
    ...payload
  };

  console.log("[Socket] Sending:", type);
  state.socket.send(JSON.stringify(message));
}