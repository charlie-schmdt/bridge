const request = {
  config: {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'en-US',
  },
  interimResults: true,
};

const path = require('path');

const initTranscriptionClient = (wss) => {

  console.log("initiating transcription client");

  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, '../../config/bridge-477216-0017e94d6565.json');

  const speech = require('@google-cloud/speech');
  const client = new speech.SpeechClient();

  wss.on('connection', (socket, req) => {
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
        console.log(data)
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
  });
}

module.exports = {
  initTranscriptionClient
}
