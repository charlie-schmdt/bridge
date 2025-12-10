const clients = new Map(); // clientId -> ws
const rooms = new Map(); // roomId -> Set of clientIds
const clientRoomMap = new Map(); // clientId -> roomId

const registerClient = (id, ws) => {
    clients.set(id, ws);
}

const unregisterClient = (id) => {
    clients.delete(id);
}

const getClientById = (id) => {
    return clients.get(id);
}

const addClientToRoom = (clientId, roomId) => {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(clientId);
    clientRoomMap.set(clientId, roomId);
}

const removeClientFromRoom = (clientId) => {
    const roomId = clientRoomMap.get(clientId);
    if (roomId) {
        rooms.get(roomId).delete(clientId);
        clientRoomMap.delete(clientId);
        if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
        }
    }
}

const getClientsInRoom = (roomId) => {
    return rooms.get(roomId) || new Set();
}

const getRoomFromClient = (clientId) => {
    return clientRoomMap.get(clientId);
}

module.exports = {
    registerClient,
    unregisterClient,
    getClientById,
    addClientToRoom,
    removeClientFromRoom,
    getClientsInRoom,
    getRoomFromClient,
}