const http = require("http");
const handleHttp = require("./http/staticServer");
const initWebSocket = require("./ws/websocketServer");

const server = http.createServer(handleHttp);

initWebSocket(server);

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});