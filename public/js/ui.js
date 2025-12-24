// ui.js
export const micBtn = document.getElementById("mic-btn");
export const cameraBtn = document.getElementById("camera-btn");
export const localVideo = document.getElementById("local-user");
export const remoteVideo = document.getElementById("remote-user");
export const preview = document.getElementById("remote-user-preview");

export const tempDiv = document.createElement("div");
tempDiv.id = "temp-div";
tempDiv.textContent = "Waiting for user…";

export function setStatus(text) {
  const ele = document.getElementById("status-text");
  if (ele) ele.textContent = text;
}