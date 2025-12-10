// const encoding = 'LINEAR16';
// const sampleRateHertz = 16000;
// const languageCode = 'en-US';
// const streamingLimit = 10000; // ms - set to low number for demo purposes

//process.env.GOOGLE_APPLICATION_CREDENTIALS = '/Users/tylerptak/Documents/Class/Fall_25/407/bridge/electron-src/src/assets/timejump.json';


const speech = require('@google-cloud/speech');
const chalk = require('chalk');
const {Writable} = require('stream');

const express = require('express');
const path = require('path');
const ws = require('ws');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
const cors = require('cors');
app.use(cors());

const request = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'en-US',
  },
  interimResults: true,
};

const client = new speech.SpeechClient();

// Serve static files from public folder
const publicFolder = path.join(__dirname, '../electron-src/public');
console.log("Public Folder:", publicFolder);
app.use(express.static(publicFolder));

// Example: GET /transcription-worklet-processor.js will serve public/transcription-worklet-processor.js
// Your other static assets can go here as well

// Create HTTP server from Express app
const server = require('http').createServer(app);

// Attach WebSocket server to same HTTP server
const wss = new ws.WebSocketServer({ server, path: '/transcribe' });

wss.on('connection', (socket) => {
  console.log('Client connected for transcription');
  let recognizeStream;
  
  function startRecognitionStream() {
    recognizeStream = client.streamingRecognize(request, interimResults=false)
    .on('error', (err) => {
      console.error('Speech recognition error:', err);
      if (err.code === 11 || err.message.includes('Audio Timeout')) {
        console.log('Restarting stream due to timeout...');
        recognizeStream = startRecognitionStream();
      }
    })
    .on('data', (data) => {
      if (data.results[0] && data.results[0].alternatives[0]) {
        socket.send(JSON.stringify({transcript: data.results[0].alternatives[0].transcript, isFinal: data.results[0].isFinal}));
      }
    });
    return recognizeStream;
  }

  recognizeStream = startRecognitionStream();
  
  socket.on('message', (msg) => {
    recognizeStream.write(msg);
  });

  //socket.send('Connected to server');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
