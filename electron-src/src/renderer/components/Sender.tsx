import { useEffect, useState, useRef } from "react";
import AudioVisualizers from "./AudioVisualizers";
import {
  Tabs, Tab,
  Card, CardHeader, CardBody,
  Input, Textarea, Button, Slider,
  Select, SelectItem, 
  Switch,
  select
} from "@heroui/react";
import {useAudioContext} from "../contexts/AudioContext";
import AudioInputOptions from "./AudioInputOptions"
import AudioOutputOptions from "./AudioOutputOptions"
import MicSensitivity from "./MicSensitivity";
import EchoCancellationToggle from "./EchoCancellationToggle";
import NoiseSuppressionToggle from "./NoiseSuppressionToggle";
import Latency from "./Latency"

function Initialize() {
  const { initializeAudioGraph } = useAudioContext();
  return(<Button
  onPress={initializeAudioGraph}
  >Initialize Audio</Button>)
  
}

function Teardown() {
  const { tearDownAudioGraph } = useAudioContext();
  return(<Button
  onPress={tearDownAudioGraph}
  >TearDown Audio</Button>)
  
}

export default function Sender() {

  return (
    <div>
      <Initialize/>
      <Teardown/>
      {/*<div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="grid grid-cols-2 grid-rows-1 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Input source:</label>
          </div>
          <div className="p-4 ">
            <AudioInputOptions />
          </div>
        </div>
        <div className="grid grid-cols-2 grid-rows-1 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Destination:</label>
          </div>
          <div className="p-4 ">
            <AudioOutputOptions />
          </div>  
        </div>
      </div>
      <hr/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="flex flex-col flex-[2] min-w-[300px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Mic Sensitivity:</label>
          </div>
          <div className="p-4 ">
            <MicSensitivity/>
          </div>     
        </div>
        <div className="flex flex-col flex-[1] min-w-[150px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Echo Cancellation:</label>
          </div>
          <div className="p-4 ">
            <EchoCancellationToggle/>
          </div>     
        </div>
        <div className="flex flex-col flex-[1] min-w-[150px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Noise Reduction:</label>
          </div>
          <div className="p-4 ">
            <NoiseSuppressionToggle/>
          </div>
        </div>
      </div>
      <hr/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <AudioVisualizers/>
      </div>
      <hr/>*/}
    </div>
  );
}
