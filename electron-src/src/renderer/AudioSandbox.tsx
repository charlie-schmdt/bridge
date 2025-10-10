import {useEffect, useRef, useState} from "react";
import AudioStreamMeter from "audio-stream-meter";
import { start } from "repl";
export default function AudioSandbox() {
  const volumeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const recorderRef = useRef(null);
  const [gainValue, setGainValue] = useState(1.0);
  const [echoCancel, setEchoCancel] = useState(true);
  const [agc, setAGC] = useState(false);

  useEffect(() => {
    let stream;
    let context;
    let source;
    let dest;
    let gainNode;

    const initAudio = async () => {
    try {
      context = new AudioContext();
      
      stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
        echoCancellation: echoCancel,
        noiseSuppression: true}})
        
        source = context.createMediaStreamSource(stream);
        dest = context.createMediaStreamDestination();
        gainNode = context.createGain();
        volumeRef.current = document.getElementById("volume");

        gainNodeRef.current = gainNode;
        gainNode.gain.value = gainValue;

        source.connect(gainNode);
        console.log("Audio context initialized with gain node.");

        gainNode.connect(dest)
        //gainNode.connect(context.destination)

        recorderRef.current = new MediaRecorder(dest.stream);
        const chunks = [];

        recorderRef.current.ondataavailable = e => chunks.push(e.data);
        recorderRef.current.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'recording.webm';
          a.click();
          URL.revokeObjectURL(url);
        };
    } catch (err) {
        console.error("Error getting audio:", err);
    }
  }
  
  initAudio();

  return () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (source) source.disconnect();
      if (gainNode) gainNode.disconnect();
      if (dest) dest.disconnect();
      if (context && context.state !== "closed") {
        context.close();
      }
  }


  }, [echoCancel]);

  const handleGainChange = (e) => {
    const newGain = parseFloat(e.target.value);
    setGainValue(newGain);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newGain;
    }
  };

  const toggleEchoCancellation = () => {
    setEchoCancel(!echoCancel);
    console.log("Echo Cancellation set to:", !echoCancel);
    // Note: Toggling echo cancellation would typically require re-acquiring the media stream
    // with updated constraints. This is a simplified example.
  };

  const startRecording = () => {
    // Implement recording logic here
    recorderRef.current.start();
  }

  const stopRecording = () => {
    // Implement recording logic here
    recorderRef.current.stop();
  }

  return (
  <div className="flex flex-col gap-4 p-4 w-full h-full">
     {/* Gain Control */}
      <div className="flex flex-col w-[300px]">
        <label className="text-sm text-gray-200 mb-1">
          Mic Sensitivity: {gainValue.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.01"
          value={gainValue}
          onChange={handleGainChange}
          className="w-full accent-blue-500"
        />
      </div>
      <div className="flex flex-col gap-4 p-4 w-full h-full">
        <label className="text-sm text-gray-200 mb-1">
          Echo Cancellation: {echoCancel ? "On" : "Off"}
        </label>
        <button onClick={toggleEchoCancellation}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Toggle Echo Cancellation
        </button>
        {/*<button onClick={startRecording}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Start Recording
        </button>
        <button onClick={stopRecording}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Stop Recording
        </button>*/}
      </div>
      <div className="flex flex-col gap-4 p-4 w-full h-full">
        <label className="text-sm text-gray-200 mb-1">
          Test AGC: {agc ? "On" : "Off"}
        </label>
        <button onClick={toggleAGC}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Toggle AGC
        </button>
        {/*<button onClick={startRecording}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Start Recording
        </button>
        <button onClick={stopRecording}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Stop Recording
        </button>*/}
      </div>
      
    </div>
  );
}
