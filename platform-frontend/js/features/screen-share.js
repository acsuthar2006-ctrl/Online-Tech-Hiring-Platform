import { state } from "../core/state.js";
import { getDevice, getProducerTransport } from "./mediasoup-client.js";

let screenProducer;

export async function startScreenShare(stream) {
  const device = getDevice();
  const producerTransport = getProducerTransport();

  if (!device || !producerTransport) {
    console.warn("Cannot share screen: Mediasoup not initialized");
    return;
  }

  const track = stream.getVideoTracks()[0];
  if (!track) return;

  console.log("[ScreenShare] Starting...");

  try {
    screenProducer = await producerTransport.produce({
      track,
      appData: { source: "screen" },
      encodings: [
        {
          maxBitrate: 3000000, // 3 Mbps
          scaleResolutionDownBy: 1,
          maxFramerate: 30,
        },
      ],
    });

    console.log("[ScreenShare] Producer created:", screenProducer.id);

    screenProducer.on("trackended", () => {
      console.log("[ScreenShare] Track ended");
      stopScreenShare();
    });

    return screenProducer;
  } catch (err) {
    console.error("[ScreenShare] Error:", err);
  }
}

export function stopScreenShare() {
  if (screenProducer) {
    const id = screenProducer.id;
    screenProducer.close();
    screenProducer = null;
    console.log("[ScreenShare] Stopped");

    if (state.socket && state.socket.readyState === WebSocket.OPEN) {
      state.socket.send(
        JSON.stringify({
          type: "closeProducer",
          producerId: id,
          channel: state.roomId,
        }),
      );
    }
  }
}
