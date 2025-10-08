const clientRegistry = require('../utils/clientRegistry')
const sfuClient = require('../services/sfuClient')

const initSignalingSocket = (wss) => {
  wss.on("connection", (ws, req) => {
    clientRegistry.registerClient(clientId, ws);

    console.log(`Client connected: ${clientId}`);

    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);
        // e.g. { type: "offer", sdp: "...", target: "room123" }
        if (data.clientId === undefined) {
          console.error("WS message has no ClientID"); // TODO: implement stateful ID mapping to socket?
        }
        sfuClient.sendToSfu(data);
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    });

    ws.on("close", () => {
      clientRegistry.unregisterClient(clientId);
      console.log(`Client disconnected: ${clientId}`);
    });
  });

}

module.exports = {
  initSignalingSocket
}