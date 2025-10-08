import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });
const clients = new Set();

wss.on('connection', function connection(ws) {
  console.log('A new client connected!');
  clients.add(ws);

  ws.on('message', function message(data) {
    try {
      let message = JSON.parse(data.toString())
      console.log('received: %s', message);
      // Send to gRPC server here
      
      //grpcClient.sendMessage(message)
      //broadcast the response to all other clients
      //ws.send(JSON.stringify({ type: 'echo', payload: message.payload }));
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  })

  ws.onerror = function () {
    console.log('Some Error occurred')
  }

  // Send a message to the client

  //ws.send('something');
});
