import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Helper classes to manage AudioNode input/output ports

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
  setMicInput: (deviceId: string, context:AudioContext) => Promise<MediaStreamAudioSourceNode | undefined>;
  initializeAudioGraph: () => Promise<void>;
  tearDownAudioGraph: () => Promise<void>;
  setSenderInputDevice: (deviceId: string | null) => void;
  setSenderOutputDevice: (deviceId: string | null) => void;
  setSenderMicSensitivity: (value: number | null) => void;
  setEchoCancellation: (value: boolean | null) => void;
  setNoiseSuppression: (value: boolean | null) => void;
} | null>(null);

// Hook to use AudioContext
export const useAudioContext = () => {
  const context = useContext(WebAudioContext);
  return context;
};

// AudioContext Provider Component
export const AudioContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
  const [senderMicSensitivity, setSenderMicSensitivity] = useState<number | null>(0.5);  // Store the selected file
  const [echoCancellation, setEchoCancellation] = useState<boolean | null>(false);  // Store the selected file
  const [noiseSuppression, setNoiseSuppression] = useState<boolean | null>(false);  // Store the selected file
  
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

        //set audio input files to null as a default
        let audioInputFiles = [null, null, null, null, null];



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
      setMicInput,
      initializeAudioGraph,
      tearDownAudioGraph,
      setSenderInputDevice,
      setSenderOutputDevice,
      setSenderMicSensitivity,
      setEchoCancellation,
      setNoiseSuppression
    }}>
      {children}
    </WebAudioContext.Provider>
  );
};
