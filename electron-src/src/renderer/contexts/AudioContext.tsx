import { input } from '@heroui/react';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';


//TODO: add guards around everything. if(audioContext)...
// Helper classes to manage AudioNode input/output ports

//i need a function onNewTrack() which returns the agcPreProcessingNode that the track can connect to
//in context, save a mapping between "newtrack id = uuid() and 
// id, buffer!!just for testing agcPreProcessingNodes,agcAnalyzerNodes,postProcessingGainNode, agcGainNodes, muteNodes, mixer]"
//how will that be able to be accessed by the AGC function??s
//store a global list of [remotetrackinfo objects]
//the AGC algorithm every iterates over all the objects and edits their gainNode values



interface RemoteTrack {
  id: string | null;
  input: GainNode | null;
  agcAnalyzerNode: AnalyserNode | null;
  agcPostProcessingNode: GainNode | null;
  agcGainNode: GainNode | null;
  muteNode: GainNode | null;
  output: GainNode | null;
}

// Create the context to manage AudioContext
const WebAudioContext = createContext<{
  audioContext: AudioContext | null;
  senderInputDevice: string | null;
  senderOutputDevice: string | null;
  echoCancellation: boolean | null;
  noiseSuppression: boolean | null;
  analyserNode: AnalyserNode | null;
  senderMicSensitivity: number | null;
  micAudioStream: MediaStream | null;
  agcAnalyzerNodes : Array<AnalyserNode | null>;
  remoteTracks: Map<string, RemoteTrack | null>;
  agcValues: Array<number>;
  setMicInput: (deviceId: string, context:AudioContext) => Promise<MediaStreamAudioSourceNode | undefined>;
  initializeAudioGraph: () => Promise<void>;
  tearDownAudioGraph: () => Promise<void>;
  setSenderInputDevice: (deviceId: string | null) => void;
  setSenderOutputDevice: (deviceId: string | null) => void;
  setSenderMicSensitivity: (value: number | null) => void;
  setEchoCancellation: (value: boolean | null) => void;
  setNoiseSuppression: (value: boolean | null) => void;
  loadAudioFiles: (files: Array<string>) => Promise<void>;
  playAudioFiles: () => Promise<void>;
  resetAudioFiles: () => Promise<void>;
} | null>(null);

// Hook to use AudioContext
export const useAudioContext = () => {
  const context = useContext(WebAudioContext);
  return context;
};

// AudioContext Provider Component
export const AudioContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  //Sender -------------

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [micInput, setMicInputState] = useState<MediaStreamAudioSourceNode | null>(null);
  const [senderInputDevice, setSenderInputDevice] = useState<string | null>('default');
  const [senderOutputDevice, setSenderOutputDevice] = useState<string | null>('default');
  const [volumeSensitivityGainNode, setVolumeSensitivityGainNode] = useState<GainNode | null>(null);
  const [preProcessingGainNode, setPreProcessingGainNode] = useState<GainNode | null>(null);
  const [gainStage, setGainStage] = useState<number | null>(1.0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [postProcessingGainNode, setPostProcessingGainNode] = useState<GainNode | null>(null);
  const [micAudioStream, setMicAudioStream] = useState<MediaStream | null>(null);
  const [senderMicSensitivity, setSenderMicSensitivity] = useState<number | null>(0.5);
  const [echoCancellation, setEchoCancellation] = useState<boolean | null>(false);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean | null>(false);

  //Testing AGC and Transcript from files
  const [audioInputBuffers, setAudioInputBuffers] = useState<Array<AudioBuffer> | null>([null, null, null, null, null]);
  const [agcInputNodes, setAgcInputNodes] = useState<Array<GainNode> | null>([null, null, null, null, null]);
  const [agcAnalyzerNodes, setAgcAnalyzerNodes] = useState<Array<AnalyserNode> | null>([null, null, null, null, null]);
  const [agcPostProcessingNodes, setAgcPostProcessingNodes] = useState<Array<GainNode> | null>([null, null, null, null, null]);
  const [agcGainNodes, setAgcGainNodes] = useState<Array<GainNode> | null>([null, null, null, null, null]);
  const [agcMuteNodes, setAgcMuteNodes] = useState<Array<GainNode> | null>([null, null, null, null, null]);
  const [agcValues, setAgcValues] = useState<Array<number> | null>([0.5,0.5,0.5,0.5,0.5]);

  interface RemoteTrack {
  id: string | null;
  input: GainNode | null;
  agcAnalyzerNode: AnalyserNode | null;
  agcPostProcessingNode: GainNode | null;
  agcGainNode: GainNode | null;
  muteNode: GainNode | null;
  output: GainNode | null;
}


  //Reciever in Production-------------

  const [mixer, setMixer] = useState<GainNode | null>(null);
  const [remoteTracks, setRemoteTracks] = useState<Map<string, RemoteTrack>>(new Map());

//Function to set the microphone input source
  const setMicInput = async (deviceId: string, context:AudioContext) => {
  return new Promise<MediaStreamAudioSourceNode | null>(async (resolve, reject) => {
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
      const newSource = context.createMediaStreamSource(stream);
      resolve(newSource);
    } catch (err) {
      reject(err);
    }
  });
  };

   //Effect for mic sensitivity
  useEffect(() => {
    if (audioContext === null) return;
    if (volumeSensitivityGainNode === null) return;
    if (senderMicSensitivity === null) return;

    console.log("Setting mic sensitivity to:", gainStage * senderMicSensitivity);
    volumeSensitivityGainNode.gain.value = gainStage * senderMicSensitivity;
    
    // Cleanup when the component is unmounted (close AudioContext)
    return () => {
    };
  }, [senderMicSensitivity]);
  
  //create the functions to initialize the audio graph
  useEffect(() => {
    if (audioContext) {
      console.log("Sender Input Device changed:", senderInputDevice);
    if (senderInputDevice === null) return;

    //Update the mic input source based on the selected device
    const updateInputSource = async () => {
      micInput?.disconnect();

      //Set the mic input to the selected device
      console.log("Setting mic input to device ID:", senderInputDevice);
      const newMicInput = await setMicInput(senderInputDevice, audioContext);

      //Connect the new mic input to the volume sensitivity gain node
      console.log("Connecting new mic input to volume sensitivity gain node");
      newMicInput?.connect(volumeSensitivityGainNode);

      setMicInputState(newMicInput);
    }
    updateInputSource();
    }
    
    
    // Cleanup when the component is unmounted (close AudioContext)
    return () => {
    };
  }, [senderInputDevice, echoCancellation, noiseSuppression]);

  //Function to set the microphone input source
  const initializeAudioGraph = async () => {
  return new Promise<void>(async (resolve, reject) => {
    console.log("initialize Audio Graph")
    try {
      if (!audioContext) {

        //Sender-side ---------------------------------------------------

        console.log("Creating AudioContext");
        // Create a All neccesary graph objects
        const context = new AudioContext();
        const micInput = await setMicInput('default', context);
        const volumeSensitivityGainNode = context.createGain();
        volumeSensitivityGainNode.gain.value = gainStage;
        const preProcessingGainNode = context.createGain();
        preProcessingGainNode.gain.value = 10.0;
        const analyser = context.createAnalyser();
        const postProcessingGainNode = context.createGain();
        postProcessingGainNode.gain.value = 0.1;
        analyser.fftSize = 2048;
        const micAudioStream = context.createMediaStreamDestination();

        //Connect the nodes
        console.log("Connecting audio nodes");
        micInput.connect(volumeSensitivityGainNode);
        volumeSensitivityGainNode.connect(preProcessingGainNode);
        preProcessingGainNode.connect(analyser);
        analyser.connect(postProcessingGainNode);
        postProcessingGainNode.connect(micAudioStream);
        
        //Set the states
        console.log("Setting state values");
        setAudioContext(context);
        setMicInputState(micInput);
        setVolumeSensitivityGainNode(volumeSensitivityGainNode);
        setPreProcessingGainNode(preProcessingGainNode)
        setAnalyserNode(analyser)
        setPostProcessingGainNode(postProcessingGainNode)
        setMicAudioStream(micAudioStream.stream)
        console.log("AudioContext created:", context);

        //Reciever-side ---------------------------------------------------
        const mixer = context.createGain();
        mixer.gain.value = 1;
        mixer.connect(context.destination);

        let inputs = [];
        let analyzers = [];
        let posts = [];
        let gains = [];
        let mutes = [];

        for (let i = 0; i < 5; i++) {
          let input = context.createGain()
          input.gain.value = 10;
          let analyze = context.createAnalyser();
          let post = context.createGain();
          post.gain.value = 0.1;
          let gain = context.createGain();
          gain.gain.value = 1;
          let mute = context.createGain();
          mute.gain.value = 1;

          input.connect(analyze);
          analyze.connect(post);
          post.connect(gain);
          gain.connect(mute);
          mute.connect(mixer);
          
          inputs.push(input);
          analyzers.push(analyze);
          posts.push(post);
          gains.push(gain);
          mutes.push(mute);
        }

        setAgcInputNodes(inputs);
        setAgcAnalyzerNodes(analyzers);
        setAgcPostProcessingNodes(posts);
        setAgcGainNodes(gains);
        setAgcMuteNodes(mutes);
        setMixer(mixer);  
      }
      else {
        console.log("Audio Graph already exists")
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };

  //Function to set the microphone input source
  const tearDownAudioGraph = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log(audioContext)
      if (audioContext) {
        if (audioContext.state !== 'closed') {
                await audioContext.close();
                
              }
      }
      setAudioContext(null)
      
      micInput?.disconnect();
      console.log("mic disconnected")
      volumeSensitivityGainNode?.disconnect();
      console.log("sensitivity disconnected")
      preProcessingGainNode?.disconnect();
      console.log("pre disconnected")
      preProcessingGainNode?.disconnect();
      analyserNode?.disconnect();
      postProcessingGainNode?.disconnect();

      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };

  //ontrack -> addToTrackMap(newTrack);

  

  //Function to set the microphone input source
  const newRemoteTrack = (id : string) => {
      console.log("Creating new Audio Track with id: ", id);
      if (audioContext) {
        let newtrack = {
          id: null,
          input: null,
          agcAnalyzerNode: null,
          agcPostProcessingNode: null,
          agcGainNode: null,
          muteNode: null,
          output: null
        };

        const uuid = id;
        const agcPreProcessingNode = audioContext.createGain();
        agcPreProcessingNode.gain.value = 10;     // default volume
        const agcAnalyzerNode = audioContext.createAnalyser()
        const agcPostProcessingNode = audioContext.createGain();
        agcPostProcessingNode.gain.value = 0.1;     // default volume
        const agcGainNode = audioContext.createGain();
        agcGainNode.gain.value = 1;     // default volume
        const muteNode = audioContext.createGain();
        muteNode.gain.value = 1;     // default volume
        const output = audioContext.createGain();
        output.gain.value = 1;     // default volume
        
        agcPreProcessingNode.connect(agcAnalyzerNode);
        agcAnalyzerNode.connect(agcPostProcessingNode);
        agcPostProcessingNode.connect(agcGainNode);
        agcGainNode.connect(muteNode);
        muteNode.connect(mixer);
        mixer.connect(output);
        output.connect(audioContext.destination);

        newtrack.id = uuid;
        newtrack.input = agcPreProcessingNode;
        newtrack.agcAnalyzerNode = agcAnalyzerNode;
        newtrack.agcPostProcessingNode = agcPostProcessingNode;
        newtrack.agcGainNode = agcGainNode;
        newtrack.muteNode = muteNode;
        newtrack.output = output;

        console.log("new track created", newtrack);

        console.log("adding track to trackmap", newtrack);
        let trackMap = remoteTracks;
        trackMap[id] = newtrack;
        setRemoteTracks(trackMap);
        console.log("new trackmap is ", trackMap);

        return newtrack;
      }
  };

  interface RemoteTrack {
  id: string | null;
  input: GainNode | null;
  agcAnalyzerNode: AnalyserNode | null;
  agcPostProcessingNode: GainNode | null;
  agcGainNode: GainNode | null;
  muteNode: GainNode | null;
  output: GainNode | null;
}

  //Function to set the microphone input source
  const removeRemoteTrack = (id : string) => {
      console.log("Creating new Audio Track with id: ", id);
      if (audioContext) {
        if (remoteTracks[id]) {
          remoteTracks[id].input.disconnect();
          remoteTracks[id].agcAnalyzerNode.disconnect();
          remoteTracks[id].agcPostProcessingNode.disconnect();
          remoteTracks[id].agcGainNode.disconnect();
          remoteTracks[id].muteNode.disconnect();
          remoteTracks[id].output.disconnect();
        }

        console.log("removing track from trackmap", id);
        delete remoteTracks[id];
        console.log("trackmap is now", remoteTracks);
      }
  };



  //Function to load files into loadAudio
  const loadAudioFiles = async (files: Array<string>) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const loadSingleFile = (fileName: string, index: number) => {
        return new Promise<AudioBuffer | null>((resolve) => {
          console.log("Loading file", fileName)
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
      
      console.log("recieved buffers: ", audioBuffers)
      
      // Set state after all files succeed
      setAudioInputBuffers(audioBuffers);
      
      resolve();
    } catch (err) {
      reject(err);
    }
  });
  };

  function calculateRMS(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += Math.pow(dataArray[i] - 128, 2);
    }
    const rms = Math.sqrt(sum / dataArray.length)
    return rms / 128; // Normalize RMS value between 0 and 1
  }

//TODO: in production this needs to be running right when the audio context starts
//add a check to see if the trackmap has anything in it. if not do nothing
//if it does, then start changing the values 
  function createAGCLoop(
    audioContext: AudioContext,
    agcAnalyserNodes: AnalyserNode[],
    agcGainNodes: GainNode[],
    setAgcValues: React.Dispatch<React.SetStateAction<number[]>>
  ) {
  let rafId: number | null = null;
  let running = false;
  const TARGET_DB = -18;

  // Hard limits on how much the AGC can boost/cut
  const MIN_GAIN_DB = -12;
  const MAX_GAIN_DB = 18;

  function linearToDb(value: number): number {
    const min = 1e-8;            // prevent log(0)
    const safe = Math.max(value, min);
    return 20 * Math.log10(safe);
  }

  function dbToLinear(db: number): number {
    return Math.pow(10, db / 20);
  }

  function update() {
    if (!running) return;

    const now = audioContext.currentTime;

    for (let i = 0; i < agcAnalyserNodes.length; i++) {
      const analyser = agcAnalyserNodes[i];
      const gainNode = agcGainNodes[i];
      if (!analyser || !gainNode) continue;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
      const rms = calculateRMS(dataArray)
      const currentDb = rms > 0 ? 20 * Math.log10(rms) : -100;


      const desiredGainDb = Math.max(
        MIN_GAIN_DB,
        Math.min(MAX_GAIN_DB, TARGET_DB - currentDb)
      );

      // 2. Where are we right now (in dB)?
      const currentGain = gainNode.gain.value || 1; // fallback to 1 if 0
      const currentGainDb = linearToDb(currentGain);

      // 3. Smoothly move partway toward the desired gain (0.0–1.0)
      const SMOOTHING = 0.2; // 20% of the way each frame
      const targetGainDb =
        currentGainDb + (desiredGainDb - currentGainDb) * SMOOTHING;

      // 4. Convert back to linear
      const targetGainLinear = dbToLinear(targetGainDb);

      gainNode.gain.setTargetAtTime(targetGainLinear, now, 0.05);

      setAgcValues(prev => {
        const next = [...prev];
        next[i] = targetGainLinear;
        return next;
      });
    }

      rafId = requestAnimationFrame(update);
  }

  function start() {
    if (!running) {
      running = true;
      rafId = requestAnimationFrame(update);
    }
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return { start, stop };
  }

  //Function to load files into loadAudio
  const playAudioFiles = async () => {
  return new Promise<void>(async (resolve, reject) => {
    try {

      const allPromises = audioInputBuffers.map((buffer, index) => {
      return new Promise<void>((resolve, reject) => {
        try {
          if (!buffer) {
            console.warn(`No buffer loaded at index ${index}`);
            return resolve(); // nothing to play, but don't kill everything
          }

          const inputNode = agcInputNodes[index];
          if (!inputNode) {
            console.error(`No AGC input at index ${index}`, inputNode);
            return reject(new Error(`Missing AGC node at index ${index}`));
          }

          console.log("playing audio files")

          const src = audioContext.createBufferSource();
          src.buffer = buffer;

          // connect into your AGC chain
          src.connect(inputNode);

          src.onended = () => {
            console.log(`Track ${index} finished`);
            agcLoop.stop(); 
            resolve();
          };

          src.start();

          //set up the AGC Loop
          console.log("AGC Loop Started");
          const agcLoop = createAGCLoop(audioContext, agcAnalyzerNodes, agcGainNodes, setAgcValues);
          agcLoop.start();        
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
      agcAnalyzerNodes,
      remoteTracks, 
      agcValues,
      setMicInput,
      initializeAudioGraph,
      tearDownAudioGraph,
      setSenderInputDevice,
      setSenderOutputDevice,
      setSenderMicSensitivity,
      setEchoCancellation,
      setNoiseSuppression,
      loadAudioFiles,
      playAudioFiles,
      resetAudioFiles
    }}>
      {children}
    </WebAudioContext.Provider>
  );
};
