const BASE_URL = "https://gushy-etha-bushily.ngrok-free.dev";

const joinForm = document.getElementById("joinForm");
const roomInput = document.getElementById("roomInput");
const createBtn = document.getElementById("createRoomBtn");

joinForm.addEventListener("submit", evt => {
  evt.preventDefault();
  const room = roomInput.value.trim();
  if (!room) {
    alert('Plz!! Enter the room id');
  return;
  };
  window.location.href = `${BASE_URL}/?room=${room}`;
});
createBtn.addEventListener("click", () => {
  const room = roomInput.value.trim();
  if (!room) {
    alert('Plz!! Enter the room id');
    return;
  }
  window.location.href = `${BASE_URL}/?room=${room}`;
});
