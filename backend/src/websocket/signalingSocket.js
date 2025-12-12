const clientRegistry = require('../utils/clientRegistry')
const sfuClient = require('../services/sfuClient')

const SignalMessageTypes = require('../utils/signalMessageTypes')

const initSignalingSocket = (wss) => {
  wss.on("connection", (ws, req) => {

    console.log(`Client connected`);

    var clientId;

    ws.on("message", (msg) => {
      var data;
      try {
        data = JSON.parse(msg);
        // e.g. { type: "offer", sdp: "...", target: "room123" }
        if (data.clientId === undefined) {
          console.error("WS message has no ClientID"); // TODO: implement stateful ID mapping to socket?
        }
      } catch (err) {
        console.error("Invalid WS message:", err);
        return;
      }

      clientId = data.clientId;
      if (clientRegistry.getClientById(data.clientId) === undefined) {
        // new client
        clientRegistry.registerClient(data.clientId, ws);
      }

      // Handle signal messages by type
      switch (data.type) {
        case SignalMessageTypes.JOIN:
          console.log(`Client ${data.clientId} joining room ${data.roomId}`);
          clientRegistry.addClientToRoom(data.clientId, data.roomId);
          break;
        case SignalMessageTypes.EXIT:
          console.log(`Client ${data.clientId} exiting room`);
          clientRegistry.removeClientFromRoom(data.clientId);
          break;
        case SignalMessageTypes.SCREEN_SHARE_REQUEST:
          console.log(`Client ${data.clientId} sharing screen`);
          // Propagate screen share notice to all other clients in the room
          const sharedRoomId = clientRegistry.getRoomFromClient(data.clientId);
          if (!sharedRoomId) {
            console.error(`Client ${data.clientId} is not in a room, cannot share screen.`);
            return;
          }
          const clientsInRoom = clientRegistry.getClientsInRoom(sharedRoomId);
          clientsInRoom.forEach(peerClientId => {
            if (peerClientId !== data.clientId) {
              const peerWs = clientRegistry.getClientById(peerClientId);
              if (peerWs) {
                peerWs.send(JSON.stringify({
                  type: SignalMessageTypes.PEER_SCREEN_SHARE,
                  clientId: peerClientId,
                  roomId: sharedRoomId,
                  payload: {
                    peerId: data.clientId,
                    streamId: data.clientId+"-screen" // Use the convention of clientId-screen for screen share stream IDs
                  }
                }));
              }
              else {
                console.error(`WebSocket for client ${peerClientId} not found.`);
              }
            }
          });
          return; // Do not forward shareScreen to SFU
        case SignalMessageTypes.PEER_SCREEN_SHARE_STOP:
          console.log(`Client ${data.clientId} stopped screen sharing.`);
          // Propagate screen share stop to all other clients in the room
          const stoppedRoomId = clientRegistry.getRoomFromClient(data.clientId);
          if (!stoppedRoomId) {
            console.error(`Client ${data.clientId} is not in a room, cannot stop screen sharing.`);
            return;
          }
          const peersInRoom = clientRegistry.getClientsInRoom(stoppedRoomId);
          peersInRoom.forEach(peerClientId => {
            if (peerClientId !== data.clientId) {
              const peerWs = clientRegistry.getClientById(peerClientId);
              if (peerWs) {
                peerWs.send(JSON.stringify({
                  type: SignalMessageTypes.PEER_SCREEN_SHARE_STOP,
                  clientId: peerClientId,
                  roomId: stoppedRoomId,
                  payload: {
                    peerId: data.clientId
                  }
                }));
              }
              else {
                console.error(`WebSocket for client ${peerClientId} not found.`);
              }
            }
          });
          break;
        default:
          // Other message types have no processing, just forwarded to SFU
      }

      try {
        sfuClient.sendToSfu(data);
      } catch (err) {
        console.error("Error sending client message to SFU:", err);
      }
    });

    ws.on("close", () => {
      clientRegistry.removeClientFromRoom(clientId);
      clientRegistry.unregisterClient(clientId);
      console.log(`Client disconnected: ${clientId}`);
    });
  });
}

module.exports = {
  initSignalingSocket
}