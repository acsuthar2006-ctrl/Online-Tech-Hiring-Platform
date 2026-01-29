# SFU and Signaling Documentation

## Overview

This document explains how the Selective Forwarding Unit (SFU) and signaling work in the PeerChat media server. The system uses **Mediasoup** as the SFU and **WebSockets** for signaling.

## Architecture

### Components

1.  **Client (`platform-frontend`)**: The web application running in the browser. Uses `signaling.js` to communicate with the server.
2.  **Signaling Server (`media-server/ws/websocketServer.js`)**: Manages WebSocket connections, rooms, and acts as the bridge between the Client and Mediasoup.
3.  **SFU (`media-server/sfu/mediasoup.js`)**: Handles real-time media routing using Mediasoup (Worker -> Router -> Transports -> Producers/Consumers).
4.  **Recorder (`media-server/sfu/recording.js`)**: Handles recording of sessions using FFmpeg.

## Signaling Flow

The signaling process involves exchanging JSON messages over a WebSocket connection.

### 1. Connection & Initialization

- **Client**: Connects to `ws://server:port/ws`.
- **Server**: Accepts connection, sends strict `serverInfo`.
- **Client**: Sends `join` request with `channel` (room ID) and `from` (user ID).
- **Server**: Adds user to determining room logic in `channels.js`.

### 2. Producing Media (Publishing)

1.  **Get Capabilities**: Client requests `getRouterRtpCapabilities`. Server responds with Mediasoup router capabilities.
2.  **Create Transport**: Client requests `createWebRtcTransport`. Server calls Mediasoup to create a server-side transport and returns transport parameters (ICE candidates, DTLS, etc.) to client.
3.  **Connect Transport**: Client calls `connectWebRtcTransport` with DTLS parameters. Server connects the transport.
4.  **Produce**: Client calls `produce` with RTP parameters and kind (audio/video).
    - Server calls `transport.produce()`.
    - Server stores the `producerId`.
    - Server broadcasts `newProducer` to all other users in the room.

### 3. Consuming Media (Subscribing)

1.  **Receive Notification**: Client receives `newProducer` event (or requests `getProducers` on join).
2.  **Create Transport**: Client creates a receiving transport (if not already created) via `createWebRtcTransport`.
3.  **Consume**: Client requests `consume` with `producerId` and its own `rtpCapabilities`.
    - Server checks if router can consume.
    - Server requests `transport.consume()`.
    - Server returns consumer parameters to client.
4.  **Resume**: Client sets up consumer and requests `resume` to start the stream.

## Module Responsibilities

### `mediasoup.js`

- **Role**: Wrapper around Mediasoup library.
- **Responsibilities**:
  - Initialize Mediasoup Worker.
  - Create Router.
  - Helper functions to create WebRTC and Plain transports.
- **Current State**: (To be Refactored) Contains global maps (`transports`, `producers`) which are redundant.

### `websocketServer.js`

- **Role**: Controller / Signaling Logic.
- **Responsibilities**:
  - Handles all WebSocket events.
  - Manages Rooms (`channels.js`).
  - Maintains state of Producers/Consumers per client.
  - Orchestrates Recording logic.

### `signaling.js`

- **Role**: Client-side Signaling Client.
- **Responsibilities**:
  - Wraps WebSocket `send` in a Promise-based `request` function.
  - Handles correlation of requests/responses using IDs.

## Recording Logic

- Triggered automatically when 2 or more participants are in a room with AV.
- Uses `PlainTransport` to pipe media from Mediasoup to a local FFmpeg process.
- Mixes audio and stacks video for a composite output string.
