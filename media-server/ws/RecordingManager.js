import { Recorder } from "../sfu/recording.js";

export class RecordingManager {
  constructor(mediasoupService) {
    this.mediasoupService = mediasoupService;
    this.recorders = new Map(); // roomId -> Recorder
  }

  handleRoomJoin(socket) {
    // Start recording wrapper initialization if not exists
    if (!this.recorders.has(socket.channel)) {
      const recorder = new Recorder(this.mediasoupService, socket.channel);
      this.recorders.set(socket.channel, recorder);
    }
  }

  checkToStartRecording(socket, activeParticipants) {
    if (activeParticipants.length >= 2) {
      const enableRecording = process.env.ENABLE_RECORDING === "true";

      if (enableRecording) {
        let recorder = this.recorders.get(socket.channel);
        if (!recorder) {
          recorder = new Recorder(this.mediasoupService, socket.channel);
          this.recorders.set(socket.channel, recorder);
        }

        // Build list
        const producersList = [];
        // Add AV for first 2 participants
        activeParticipants.slice(0, 2).forEach((s) => {
          producersList.push({
            producerId: s.producers.audio,
            kind: "audio",
          });
          producersList.push({
            producerId: s.producers.video,
            kind: "video",
          });
        });

        // Add Screen Share if any
        // Note: we need access to access socket.producers.screen which is set in SfuHandler logic
        // We assume 'activeParticipants' are the socket objects containing 'producers' map.
        const screenSharer = activeParticipants.find(
          (s) => s.producers && s.producers.screen
        );
        if (screenSharer) {
          producersList.push({
            producerId: screenSharer.producers.screen,
            kind: "video",
          });
        }

        // Start or Restart
        if (recorder.process) {
          // specific check: if number of inputs changed, restart
          if (recorder.consumers.length !== producersList.length) {
            console.log(
              `[Recorder] Restarting recording for room ${socket.channel} (Streams: ${recorder.consumers.length} -> ${producersList.length})`
            );
            recorder.stop();
            setTimeout(() => {
              if (this.recorders.has(socket.channel))
                recorder.start(producersList).catch((e) => console.error(e));
            }, 500);
          }
        } else if (recorder.consumers.length === 0) {
          recorder.start(producersList).catch((e) => console.error(e));
        }
      }
    }
  }

  handleRoomLeave(socket, activeParticipants) {
    // Stop recorder when a user leaves if it drops below threshold?
    // Current logic was: "messages.type === 'leave' -> stop recorder ?"
    // No, logic was: If socket leaves, and room is empty? Or simple logic:
    // "if (recorders.has(socket.channel)) { recorder.stop(); delete ... }" -> This stopped it IMMEDIATELY on leave?
    // Wait, the original code had:
    /*
      if (recorders.has(socket.channel)) {
        ...
        const recorder = recorders.get(socket.channel);
        recorder.stop();
        recorders.delete(socket.channel);
      }
    */
    // That means if ANY one person leaves, the recording stops? That seems buggy or intentional for MVP.
    // I will preserve that behavior for now but put it in a method.

    if (this.recorders.has(socket.channel)) {
      console.log(
        `[WebSocket] Stopping recorder for room ${socket.channel} due to user leave`
      );
      const recorder = this.recorders.get(socket.channel);
      recorder.stop();
      this.recorders.delete(socket.channel);
    }
  }

  // Similar logic for when a producer closes, we might need to restart recording
  checkToRestartRecording(socket, activeParticipants) {
      if (activeParticipants.length >= 2 && this.recorders.has(socket.channel)) {
        const recorder = this.recorders.get(socket.channel);

        // Rebuild target list
        const producersList = [];
        activeParticipants.slice(0, 2).forEach((s) => {
          producersList.push({
            producerId: s.producers.audio,
            kind: "audio",
          });
          producersList.push({
            producerId: s.producers.video,
            kind: "video",
          });
        });
        const screenSharer = activeParticipants.find(
          (s) => s.producers && s.producers.screen
        );
        if (screenSharer) {
          producersList.push({
            producerId: screenSharer.producers.screen,
            kind: "video",
          });
        }

        // Restart check
        if (
          recorder.process &&
          recorder.consumers.length !== producersList.length
        ) {
          console.log(`[Recorder] Restarting recording (Stream removed)`);
          recorder.stop();
          setTimeout(() => {
            if (this.recorders.has(socket.channel))
              recorder.start(producersList).catch((e) => console.error(e));
          }, 500);
        }
      }
  }
}
