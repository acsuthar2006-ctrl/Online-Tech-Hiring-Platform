import WebSocket from "ws";
import { MAX_USERS_PER_ROOM } from "../config/constants.js";
const channels = new Map();

function joinChannel(socket, channel) {
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }

  const room = channels.get(channel);

  if (room.size >= MAX_USERS_PER_ROOM) {
    socket.send(JSON.stringify({ type: "room-full" }));
    socket.close();
    return;
  }

  socket.channel = channel;
  room.add(socket);

  console.log(`User ${socket.uid} joined room ${channel}`);
  return true;
}

function leaveChannel(socket) {
  const channel = socket.channel;
  if (!channel) return;

  const room = channels.get(channel);
  if (!room) return;

  room.delete(socket);

  if (room.size === 0) {
    channels.delete(channel);
  }

  socket.channel = null;
  console.log(`User ${socket.uid} left room ${channel}`);
}

function broadcastToRoom(sender, data) {
  const room = channels.get(sender.channel);
  if (!room) return;

  room.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function roomExists(room) {
  return channels.has(room);
}

export {
  joinChannel,
  leaveChannel,
  broadcastToRoom,
  roomExists
};