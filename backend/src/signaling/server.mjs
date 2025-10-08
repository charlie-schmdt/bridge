import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// Load the protobuf
const PROTO_PATH = './signaling.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH)
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const signalingPkg = protoDescriptor.signaling;

// Create a gRPC stub
let stub = new signalingPkg.Signaling('localhost:50031', grpc.credentials.createInsecure());

// Create a WebSocket server

const wss = new WebSocketServer({ port: 3000 });
const clients = new Set();

wss.on('connection', function connection(ws) {
  console.log('A new client connected!');
  const call = stub.HandleSession()
  const my_id = uuidv4();
  clients.add(ws);

  let hasSentOffer = false;
  const pendingCandidates = [];

  // Pipe gRPC -> WebSocket
  call.on("data", (message) => {
    if (message.cantidate){
      console.log("Received ICE candidate from SFU:", message.candidate);
    }
    else if (message.answer){
      console.log("Received answer from SFU:", message.answer);
    }
    else if (message.offer){
      console.log("Received offer from SFU:", message.offer);
    }
    else {
      console.error("Unknown message from SFU:", message);
      return;
    }
    });
  call.on("end", () => {
    console.log("SFU stream ended");
    ws.close();
  });
  call.on("error", (err) => {
    console.error("SFU stream error:", err);
    ws.close();
  });

  ws.on('message', function message(data) {
    try {
      let message = JSON.parse(data.toString())
      //console.log('received: %s', message);
      if (message.type === "offer") {
        call.write({
        offer: {
          sdp: message.payload,      // from your WebSocket payload
          client_id: my_id     // UUID generated on Node bridge
        }});
        hasSentOffer = true;

        // Now flush any buffered ICE
        pendingCandidates.forEach((c) => call.write(c));
        pendingCandidates.length = 0;
      }
      else if (message.type === "answer") {
        //
      }
      else if (message.type === "ice-candidate") {
        console.log("Received ICE candidate from client:", message.payload);

        const candidateMsg = {
          candidate: {
            candidate: message.payload.candidate,
            sdp_mid: message.payload.sdpMid,          // note: snake_case for gRPC
            sdp_mline_index: message.payload.sdpMLineIndex,
            client_id: my_id
          }
        };

        if (!hasSentOffer) {
          // buffer ICE until after offer is sent
          pendingCandidates.push(candidateMsg);
        } else {
          call.write(candidateMsg);
        }
      }
      else if (message.type === "subscribe") {
        ///
      }
      else {
        console.error("Unknown message type:", message);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    call.end();
    clients.delete(ws);
  })

  ws.onerror = function () {
    console.log('Some Error occurred')
    call.end();
    clients.delete(ws);
  }

  // Send a message to the client

  //ws.send('something');
});
