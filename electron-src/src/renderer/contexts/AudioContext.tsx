import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Create the context to manage AudioContext
const WebAudioContext = createContext<{
  audioContext: AudioContext | null;
  senderInputDevice: string | null;
  senderOutputDevice: string | null;
  setMicInput: (deviceId: string) => Promise<void>;
  setSenderInputDevice: (deviceId: string | null) => void;
  setSenderOutputDevice: (deviceId: string | null) => void;
  setVolumeSensitivityGainValue: (value: number) => void;
} | null>(null);

// Custom hook to use AudioContext
export const useAudioContext = () => {
  const context = useContext(WebAudioContext);
  return context;
};

// Create the AudioContextProvider to manage the AudioContext lifecycle

export const AudioContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [micInputSourceNode, setMicInputSourceNode] = useState<MediaStreamAudioSourceNode | null>(null);
  const [senderInputDevice, setSenderInputDevice] = useState<string | null>(null);
  const [senderOutputDevice, setSenderOutputDevice] = useState<string | null>(null);
  const [volumeSensitivityGainValue, setVolumeSensitivityGainValue] = useState<number>(1.0);
  const [volumeSensitivityGainNode, setVolumeSensitivityGainNode] = useState<GainNode | null>(null);
  const [initializationDone, setInitializationDone] = useState<boolean>(false);

  useEffect(() => {
    // Create the AudioContext once the component is mounted
    const context = new AudioContext();
    setAudioContext(context);

    // Set default input device to system default
    setMicInput('file');

    //create the gain node
    const volumeSensitivityGainNode = context.createGain();
    volumeSensitivityGainNode.gain.value = volumeSensitivityGainValue;
    setVolumeSensitivityGainNode(volumeSensitivityGainNode);

    setInitializationDone(true); //queue the next effect
    
    // Cleanup when the component is unmounted (close AudioContext)
    return () => {
      if (context.state !== 'closed') {
        context.close();
      }
    };
  }, []);

  useEffect(() => {
    // Update gain value when volumeSensitivityGainValue changes
    if (volumeSensitivityGainNode && audioContext.destination) {
      volumeSensitivityGainNode.connect(audioContext.destination);
    }
  }, [volumeSensitivityGainNode, audioContext]);

  // Function to set the microphone input device and create the source node
  const setMicInput = async (deviceId: string) => {
    try {
      console.log("Setting mic input to deviceId:", deviceId);
      if (deviceId === 'file') {
        console.log("File input selected - no microphone source created");
        setMicInputSourceNode(null); // No source node for file input
        setSenderInputDevice('file'); // Update the state with 'file' input
        return;
      }

      if (micInputSourceNode) {
        const oldStream = (micInputSourceNode as any).mediaStream; // Extract the mediaStream from the source node (casting)
        oldStream.getTracks().forEach((track: MediaStreamTrack) => track.stop()); // Stop all tracks
        micInputSourceNode.disconnect(); // Disconnect the old source from the AudioContext
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined, // Use specific deviceId or let browser choose
        },
      });

      const newSource = audioContext?.createMediaStreamSource(stream);
      setMicInputSourceNode(newSource); // Update the global source
      setSenderInputDevice(deviceId); // Update the state with the selected input source

      if (volumeSensitivityGainNode && newSource) {
        micInputSourceNode.connect(volumeSensitivityGainNode); // Connect to the volume node
      }
      
      console.log("Audio source set to deviceId:", deviceId);

    } catch (err) {
      console.error("Error accessing audio input:", err);
      setMicInputSourceNode(null); // Set to empty source on error
    }
  };

  return (
    <WebAudioContext.Provider value={{
      audioContext,
      senderInputDevice,
      senderOutputDevice,
      setMicInput,
      setSenderInputDevice,
      setSenderOutputDevice,
      setVolumeSensitivityGainValue,
    }}>
      {children}
    </WebAudioContext.Provider>
  );
};
