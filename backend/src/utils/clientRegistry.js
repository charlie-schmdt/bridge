const clients = new Map();

const registerClient = (id, ws) => {
    clients.set(id, ws);
}

const unregisterClient = (id) => {
    clients.delete(id);
}

const getClientById = (id) => {
    return clients.get(id);
}

module.exports = {
    registerClient,
    unregisterClient,
    getClientById
}