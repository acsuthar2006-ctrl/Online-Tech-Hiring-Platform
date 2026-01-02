import http from "http";
import handleHttp from "./http/staticServer.js";
import initWebSocket from "./ws/websocketServer.js";

const PORT = 3000;

const server = http.createServer(handleHttp);
initWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});