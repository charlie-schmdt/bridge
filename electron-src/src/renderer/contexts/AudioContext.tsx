import { Endpoints, WebSocketURL } from '@/utils/endpoints';
import { input } from '@heroui/react';
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, MutableRefObject} from 'react';
import { data } from 'react-router';
import { v4 as uuidv4 } from 'uuid';


//TODO: add guards around everything. if(audioContext)...
interface RemoteTrack {
  id: string | null;
  source: MediaStreamAudioSourceNode | null
  agcPreProcessingNode: GainNode | null;
  agcAnalyzerNode: AnalyserNode | null;
  agcPostProcessingNode: GainNode | null;
  agcGainNode: GainNode | null;
  prevGain: number;
}


// Create the context to manage AudioContext

const WebAudioContext = createContext<{
  audioContext: MutableRefObject<AudioContext | null>;
  senderInputDevice: string | null;
  senderOutputDevice: string | null;
  analyserNode: MutableRefObject<AnalyserNode | null>;
  micAudioStream: MutableRefObject<MediaStream | null>;
  remoteTracks: MutableRefObject<Map<string, RemoteTrack | null>>;
  //agcGains: Map<string, number | null>;
  transcript: string[] | null;
  echoCancellation: boolean | null;
  noiseSuppression: boolean | null;
  senderMicSensitivity: number | null;
  initializeAudioGraph: () => void;
  tearDownAudioGraph: () => void;
  setSenderMicSensitivity: (value: number | null) => void;
  setSenderInputDevice: (value: string | null) => void;
  setSenderOutputDevice: (value: string | null) => void;
  setEchoCancellation: (value: boolean | null) => void;
  setNoiseSuppression: (value: boolean | null) => void;
  //loadAudioFiles: (files: Array<string>) => Promise<void>;
  //playAudioFiles: () => Promise<void>;
  //resetAudioFiles: () => Promise<void>;
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<void>;
  setAudioOutputChannel: (id : string, track : MediaStream) => RemoteTrack;
  removeAudioOutputChannel: (id : string) => void;
} | null>(null);

// Hook to use AudioContext
export const useAudioContext = () => {
  const context = useContext(WebAudioContext);
  return context;
};

// AudioContext Provider Component
export const AudioContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  //Sender -------------

  const audioContext = useRef<AudioContext | null>(null);
  const micInput = useRef<MediaStreamAudioSourceNode | null>(null);
  const volumeSensitivityGainNode = useRef<GainNode | null>(null);
  const preProcessingGainNode = useRef<GainNode | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const postProcessingGainNode = useRef<GainNode | null>(null);
  const micAudioStream = useRef<MediaStream | null>(null);
  const [senderInputDevice, setSenderInputDevice] = useState<string | null>('default');
  const [senderOutputDevice, setSenderOutputDevice] = useState<string | null>('default');
  const [senderMicSensitivity, setSenderMicSensitivity] = useState<number | null>(0.5);
  const [echoCancellation, setEchoCancellation] = useState<boolean | null>(false);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean | null>(false);

  //AGC
  const mixer = useRef<GainNode | null>(null);
  const remoteTracks = useRef<Map<string, RemoteTrack>>(new Map());
  const agcRaf = useRef<number | null>(null)
  const agcRunning = useRef<boolean | null>(true)
  //const [audioInputBuffers, setAudioInputBuffers] = useState<Array<AudioBuffer> | null>([]);
  //const agcGains = useState<Map<string, number>>(new Map());

  //Transcript
  const [transcript, setTranscript] = useState<string[] | null>([]);
  const ws = useRef<WebSocket | null>(null);

  //Function to set the microphone input source
  async function initializeAudioGraph() {
    console.log("initialize Audio Graph")
    try {
      if (!audioContext.current) {

        //Sender-side ---------------------------------------------------
        console.log("Creating AudioContext");
        const context = new AudioContext({
          sampleRate: 44100
        });
        audioContext.current = context;

        micInput.current = await setMicInput('default');
        volumeSensitivityGainNode.current = audioContext.current.createGain();
        volumeSensitivityGainNode.current.gain.value = 1;
        preProcessingGainNode.current = audioContext.current.createGain();
        preProcessingGainNode.current.gain.value = 10.0;
        analyserNode.current = audioContext.current.createAnalyser();
        postProcessingGainNode.current = audioContext.current.createGain();
        postProcessingGainNode.current.gain.value = 0.1;
        analyserNode.current.fftSize = 2048;
        const dest = audioContext.current.createMediaStreamDestination();
        micAudioStream.current = dest.stream;


        //Connect the nodes
        console.log("Connecting audio nodes");
        micInput.current?.connect(volumeSensitivityGainNode.current);
        volumeSensitivityGainNode.current?.connect(preProcessingGainNode.current);
        preProcessingGainNode.current?.connect(analyserNode.current);
        analyserNode.current?.connect(postProcessingGainNode.current);
        postProcessingGainNode.current?.connect(dest);
        
        console.log("AudioContext created:", audioContext.current);

        //Reciever-side ---------------------------------------------------
        const agcloop = startAGCLoop();
        mixer.current = audioContext.current.createGain();
        mixer.current.gain.value = 1;
        mixer.current?.connect(context.destination);
      }
      else {
        console.log("Audio Graph already exists")
      }
    }
    catch(error) {
      console.log("error")
    }
  }

  //Function to set the microphone input source
  async function setMicInput(deviceId: string) {
    try {
      //Get user media with the selected device ID
      console.log("Setting mic input to device ID:", deviceId);
      console.log("Echo Cancellation:", echoCancellation);
      console.log("Noise Suppression:", noiseSuppression);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: echoCancellation,
          noiseSuppression: noiseSuppression,
        },
      });
      //Create MediaStreamSource from the stream
      console.log("Creating MediaStreamAudioSourceNode from stream");
      const newSource = audioContext.current.createMediaStreamSource(stream);
      return newSource
    } catch (err) {
      return null
    }
  }

   //Effect for mic sensitivity
  useEffect(() => {
    if (audioContext.current === null) return;
    if (volumeSensitivityGainNode.current === null) return;
    if (senderMicSensitivity === null) return;

    console.log("Setting mic sensitivity to:", senderMicSensitivity);
    volumeSensitivityGainNode.current.gain.value = senderMicSensitivity;
    
    return () => {
    };
  }, [senderMicSensitivity]);
  
  //Effect to reinitialize mic input when source changes
  useEffect(() => {
    if (audioContext.current) {
      console.log("Sender Input Device changed:", senderInputDevice);
    if (senderInputDevice === null) return;

    //Update the mic input source based on the selected device
    const updateInputSource = async () => {
      micInput?.current.disconnect();

      //Set the mic input to the selected device
      console.log("Setting mic input to device ID:", senderInputDevice);
      const newMicInput = await setMicInput(senderInputDevice);
      micInput.current = newMicInput;

      //Connect the new mic input to the volume sensitivity gain node
      console.log("Connecting new mic input to volume sensitivity gain node");
      micInput.current.connect(volumeSensitivityGainNode.current);
    }
    updateInputSource();
    }
    
    return () => {
    };
  }, [senderInputDevice, echoCancellation, noiseSuppression]);

  //Function to set the microphone input source
  async function tearDownAudioGraph() {
    try {
      console.log(audioContext.current)
      if (audioContext.current) {
        if (audioContext.current.state !== 'closed') {
          await audioContext.current.close();
        }
      }
      stopTranscription();
      stopAGCLoop();
      
      micInput.current?.disconnect();
      console.log("mic disconnected")
      volumeSensitivityGainNode.current?.disconnect();
      console.log("sensitivity disconnected")
      preProcessingGainNode.current?.disconnect();
      console.log("pre disconnected")
      preProcessingGainNode.current?.disconnect();
      analyserNode.current?.disconnect();
      postProcessingGainNode.current?.disconnect();

      audioContext.current = null;
    } catch(err) {
      console.log(err)
    }
  }

  //Function to set the microphone input source
  const setAudioOutputChannel = (id : string, track : MediaStream) => {
      console.log("Creating new Audio Track with id: ", id);
      if (audioContext) {
        let newtrack = {
          id: null,
          source: null,
          agcPreProcessingNode: null,
          agcAnalyzerNode: null,
          agcPostProcessingNode: null,
          agcGainNode: null,
          prevGain: 1.0,
        };

        const source = audioContext.current?.createMediaStreamSource(track);
        const agcPreProcessingNode = audioContext.current?.createGain();
        agcPreProcessingNode.gain.value = 10;     // default volume
        const agcAnalyzerNode = audioContext.current?.createAnalyser()
        const agcPostProcessingNode = audioContext.current?.createGain();
        agcPostProcessingNode.gain.value = 0.1;     // default volume
        const agcGainNode = audioContext.current?.createGain();
        agcGainNode.gain.value = 1.0;     // default volume
        
        source.connect(agcPreProcessingNode)
        agcPreProcessingNode.connect(agcAnalyzerNode);
        agcAnalyzerNode.connect(agcPostProcessingNode);
        agcPostProcessingNode.connect(agcGainNode);
        agcGainNode.connect(mixer.current);

        newtrack.id = id;
        newtrack.source = source;
        newtrack.agcPreProcessingNode = agcPreProcessingNode;
        newtrack.agcAnalyzerNode = agcAnalyzerNode;
        newtrack.agcPostProcessingNode = agcPostProcessingNode;
        newtrack.agcGainNode = agcGainNode;
        newtrack.prevGain = 1.0;

        //("adding track to trackmap", newtrack);
        remoteTracks.current.set(id, newtrack);
        console.log("new trackmap is ", remoteTracks.current);
        return newtrack;
      }
  };


  //TODO: add the thing to the other function

  //Function to set the microphone input source
  const removeAudioOutputChannel = (id : string) => {
      //("Removing new Audio Track with id: ", id);
      if (audioContext.current) {
        if (remoteTracks.current?.get(id)) {
          remoteTracks.current?.get(id).agcPreProcessingNode.disconnect();
          remoteTracks.current?.get(id).agcAnalyzerNode.disconnect();
          remoteTracks.current?.get(id).agcPostProcessingNode.disconnect();
          remoteTracks.current?.get(id).agcGainNode.disconnect();
        }

        remoteTracks.current?.delete(id);
        console.log("trackmap is now", remoteTracks.current);
      }
  };

  /*
  //Function to load files into loadAudio
  const loadAudioFiles = async (files: Array<string>) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const loadSingleFile = (fileName: string, index: number) => {
        return new Promise<AudioBuffer | null>((resolve) => {
          //("Loading file", fileName)
          const request = new XMLHttpRequest();
          request.open("GET", `../src/audio/${fileName}.mp3`);
          request.responseType = "arraybuffer";

          request.onload = function () {
            // Check NOT FOUND, 404, etc.
            if (request.status !== 200) {
              console.log("Error on load with status:", request.status)
              return resolve(null);
            }

            audioContext.decodeAudioData(
              request.response,
              (audioBuffer) => {
                console.log("Audio Buffer Received:", audioBuffer);
                resolve(audioBuffer);
              },
              (decodeErr) => {
                resolve(null);
              }
            );
          };

          request.onerror = () => {
            console.log("Error requesting audio buffer")
            resolve(null);
          };

          request.send();
        });
      };

      // Load all files in parallel with full error handling
      const allPromises = files.map((fileName, index) =>
        loadSingleFile(fileName, index)
      );

      // Wait for all to finish (or throw if ANY fail)
      const audioBuffers = await Promise.all(allPromises);
      
      //console.log("recieved buffers: ", audioBuffers)
      // Set state after all files succeed
      setAudioInputBuffers(audioBuffers);
      
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };*/

  function calculateRMS(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      let sample = (dataArray[i] - 128) / 128;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / dataArray.length)
    return rms; // Normalize RMS value between 0 and 1
  }

  function linearToDbfs(value: number): number {
    const noiseFloor = 1e-8; //noise floor
    let rms = Math.max(value, noiseFloor);
    return 20 * Math.log10(rms);
  }

  function dbfsToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  function startAGCLoop() {
    const dbStep = 2.0
    const maxDbIncrease = dbStep;
    const maxDbDecrease = -dbStep;
    const minGain = 0.01;
    const maxGain = 10;
    const alphaUp = 0.3;   // slow boost
    const alphaDown = 0.7; // fast cut
    let targetDB = -20.0;

    function update() {
      if (!agcRunning.current) return;
      //console.log(remoteTracks.size)

      const now = audioContext.current.currentTime;

      remoteTracks.current.forEach((remoteTrack, i) => {
        if (!remoteTrack) return;
        const analyser = remoteTrack.agcAnalyzerNode
        const gainNode = remoteTrack.agcGainNode;
        if (!analyser || !gainNode) return;

        // Get RMS
        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        const rms = calculateRMS(dataArray);

        const rmsFloor = 0.001; // avoid -Infinity
        const effectiveRms = gainNode.gain.value * Math.max(rms, rmsFloor);
        const currentDB = linearToDbfs(effectiveRms);

        // Compute dB difference to target
        let dbChange = targetDB - currentDB;

        // Clip max increase/decrease per frame
        dbChange = Math.max(Math.min(dbChange, maxDbIncrease), maxDbDecrease);

        // Smooth separately for up/down
        const alpha = dbChange > 0 ? alphaUp : alphaDown;

        // Current gain in dB
        const currentGainDB = linearToDbfs(gainNode.gain.value);

        // Smoothed new gain in dB
        const smoothedGainDB = currentGainDB + dbChange * alpha;

        // Convert back to linear
        let newGain = dbfsToLinear(smoothedGainDB);

        // Clamp to min/max linear gain
        newGain = Math.min(Math.max(newGain, minGain), maxGain);

        // Apply gain
        gainNode.gain.setTargetAtTime(newGain, now, 0.05);

        remoteTrack.prevGain = newGain;

        /*setAgcGains(prev => {
          const newGains = new Map(prev); // clone previous state
          newGains.set(remoteTrack.id!, newGain); // ensure id is not undefined
          return newGains;
        });*/
        
        //(`AGC Track ${i}: RMS=${rms.toFixed(4)} CurrentDB=${currentDB.toFixed(2)} dBChange=${dbChange.toFixed(2)} FinalGain=${newGain.toFixed(4)}`);
      });

      agcRaf.current = requestAnimationFrame(update);
    } 

    if (agcRunning.current) {
        agcRunning.current = true; // start the loop
        agcRaf.current = requestAnimationFrame(update);
    }

    return;
  }

  function stopAGCLoop() {
      agcRunning.current = false;
      if (agcRaf.current !== null) {
        cancelAnimationFrame(agcRaf.current);
        agcRaf.current = null;
      }
    }

  /*
    //Function to load files into loadAudio
  const playAudioFiles = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const allPromises = audioInputBuffers.map((buffer, index) => {
      return new Promise<void>((resolve, reject) => {
        try {
          if (!buffer) {
            console.warn(`No buffer loaded at index ${index}`);
            return resolve();
          }

          //("playing audio files")

          const src = audioContext.createBufferSource();
          src.buffer = buffer;

          const fakeStreamDest = audioContext.createMediaStreamDestination(); 
          src.connect(fakeStreamDest)
          const fakeStream = fakeStreamDest.stream;

          setAudioOutputChannel(`Track${index}`, fakeStream)


          src.onended = () => {
            //(`Track ${index} finished and removed from map`);
            removeAudioOutputChannel(`Track${index}`);
            resolve();
          };

          src.start();     
        } catch (error) {
          reject(error);
        }
      });
    });

      // Wait for all to finish (or throw if ANY fail)
      await Promise.all(allPromises);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };

  //Function to load files into loadAudio
  const resetAudioFiles = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      setAudioInputBuffers([null,null,null,null,null])
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };*/

  async function startAudioWorkletPipeline(ws: WebSocket) {
    //("Starting AudioWorklet Pipeline.with websocket..", ws);
    if (!audioContext) {
      console.error("AudioContext not initialized");
      return;
    }

    //console.log("AudioContext:", audioContext);
    //console.log("Trying for", Endpoints.TRANSCRIPTION_SRC)
    await audioContext.current?.audioWorklet.addModule(Endpoints.TRANSCRIPTION_SRC);
    const workletNode = new AudioWorkletNode(audioContext.current, "pcm-processor");
    console.log("workletNode", workletNode)
    micInput.current?.connect(workletNode);

    workletNode.port.onmessage = (event) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      console.log("Received audio data from worklet", event.data);

      const floatSamples: Float32Array = event.data;
      const pcm16 = floatTo16BitPCM(floatSamples);

      ws.send(pcm16);
    };

    const silentGain = audioContext.current.createGain();
    silentGain.gain.value = 0;
    workletNode.connect(silentGain);
    silentGain.connect(audioContext.current.destination); // required to keep alive

    console.log("AudioWorklet pipeline running.");
}


// Convert Float32 → Int16 PCM
function floatTo16BitPCM(float32: Float32Array) {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);

  let offset = 0;
  for (let i = 0; i < float32.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return buffer;
}

  //Function to start transcribing from audio
  const startTranscription = async () => {
  const t0 = Date.now();
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log("Starting Transcription...")
      console.log(WebSocketURL)
      let transcribeWS = WebSocketURL.replace(/\/ws$/, "/transcribe");
      ws.current = new WebSocket(transcribeWS);
      console.log("open websocket", ws.current)
      ws.current.binaryType = "arraybuffer";

      ws.current.onopen = () => {
        console.log("WebSocket connection opened for transcription");
        startAudioWorkletPipeline(ws.current);
        resolve();
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        let transcript = message.transcript;
        let isFinal = message.isFinal;
        let tcurr = Date.now();
        let elapsed = (tcurr - t0)/1000.0;
        transcript = `[${elapsed.toFixed(2)}s]: ${transcript}`;
        if (isFinal) {
          setTranscript(prev => [...prev, transcript]);
        }      
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };


  //TODO: add the same trick for this
  //Function to start transcribing from audio
  const stopTranscription = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log("Stopping Transcription...")
      ws.current.close()
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };


  // Provide the context values to children components
  return (
    <WebAudioContext.Provider value={{
      audioContext,
      senderInputDevice,
      senderOutputDevice,
      echoCancellation,
      noiseSuppression,
      analyserNode,
      senderMicSensitivity,
      micAudioStream,
      remoteTracks,
      transcript,
      initializeAudioGraph,
      tearDownAudioGraph,
      setSenderMicSensitivity,
      setEchoCancellation,
      setNoiseSuppression,
      setSenderInputDevice,
      setSenderOutputDevice,
      //loadAudioFiles,
      //playAudioFiles,
      //resetAudioFiles,
      startTranscription,
      stopTranscription,
      setAudioOutputChannel,
      removeAudioOutputChannel
    }}>
      {children}
    </WebAudioContext.Provider>
  );
};
