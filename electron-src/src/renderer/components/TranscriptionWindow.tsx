import { useEffect, useRef } from "react";
import {useAudioContext} from "../contexts/AudioContext";

export default function TranscriptionWindow() {
  const canvasRef = useRef(null);
  const {audioContext, analyserNode} = useAudioContext();

  return (
    <div className="m-6 p-4 bg-blue-200 rounded-xl">
      <h1 className="text-2xl font-bold text-gray-900">Meeting Transcript</h1>
      <p>
        My transcript
      </p>
    </div>
  );
}
