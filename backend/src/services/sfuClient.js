const WebSocket = require('ws');
const clientRegistry = require('../utils/clientRegistry');

let sfuSocket = null;

const initSfuConnection = () => {
    sfuSocket = new WebSocket('ws://localhost:50051/ws');

    sfuSocket.on('open', () => {
        console.log('Connected to SFU server');
    });

    sfuSocket.on('message', (data) => {
        console.log('Received message from SFU server:', data);
        try {
            const msg = JSON.parse(data.toString());
            console.log('SFU Message received:', msg);

            handleSfuMessage(msg);
        } catch (err) {
            console.error('SFU Message parsing error:', err);
        }
    });

    sfuSocket.on('close', () => {
        console.log('[SFU] Disconnected — retrying...');
        setTimeout(initSfuConnection, 2000);
    });

    sfuSocket.on('error', (err) => {
        console.error('[SFU] WebSocket error:', err);
    });
}

const sendToSfu = (message) => {
    if (sfuSocket && sfuSocket.readyState === WebSocket.OPEN) {
        sfuSocket.send(JSON.stringify(message));
    }
}

// Handle incoming messages from the SFU and route them through the correct websocket
const handleSfuMessage = (message) => {
    if (message.clientId !== undefined) {
        const client = clientRegistry.getClientById(message.clientId);
        if (client && client.readyState === client.OPEN) {
            client.send(JSON.stringify(message));
            //client.send(message);
        }
    }
}

module.exports = {
    initSfuConnection,
    sendToSfu,
}