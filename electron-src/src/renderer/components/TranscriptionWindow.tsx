import { useEffect, useRef, useState } from "react";
import {useAudioContext} from "../contexts/AudioContext";

import {
  Button
} from "@heroui/react";

export default function TranscriptionWindow() {
  
  const canvasRef = useRef(null);
  const {transcript, startTranscription, stopTranscription} = useAudioContext();

  return (
    <div className="m-6 p-4 bg-blue-200 rounded-xl">
      <h1 className="text-2xl font-bold text-gray-900">Meeting Transcript</h1>
      <Button
          onPress={async ()=>{
            startTranscription();
            console.log("Transcription set in state.");
          }}
        >Enable Transcription
        </Button>
      <div className="flex flex-col h-80 bg-gray-100 p-4 rounded-lg shadow-inner overflow-y-auto">
        {transcript.map((msg, i) => (
          <div key={i} className={`flex w-full mb-2`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg shadow`}>
              {msg}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
