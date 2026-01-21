import { state } from "../core/state.js";

// Map to store pending requests
const pendingRequests = new Map();

/**
 * Initialize the response handler for WebSocket messages.
 * This listens for responses to requests sent via `request()`.
 */
function setupResponseHandler() {
  state.socket.addEventListener("message", (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve, reject, timer } = pendingRequests.get(msg.id);
        clearTimeout(timer);
        pendingRequests.delete(msg.id);

        if (msg.error) {
          reject(msg.error);
        } else {
          resolve(msg.routerRtpCapabilities || msg.params || msg);
        }
      }
    } catch (e) {
      console.error("[Signaling] Error handling message:", e);
    }
  });
}

/**
 * Send a request via WebSocket and wait for a response.
 * @param {string} type - The request type (e.g., 'getRouterRtpCapabilities')
 * @param {object} data - Additional data to send
 * @returns {Promise} Resolves with the response data
 */
export function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    // Initialize handler once
    if (pendingRequests.size === 0 && !state.socket._hasResponseHandler) {
      setupResponseHandler();
      state.socket._hasResponseHandler = true;
    }

    const id = Math.random().toString(36).substring(7);

    const timer = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject("Timeout");
      }
    }, 10000); // 10s timeout

    pendingRequests.set(id, { resolve, reject, timer });

    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(
        JSON.stringify({
          type,
          id,
          channel: state.roomId,
          ...data,
        }),
      );
    } else {
      clearTimeout(timer);
      pendingRequests.delete(id);
      reject("Socket not open");
    }
  });
}
