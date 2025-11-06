import { useState } from "react";
import {
  Switch
} from "@heroui/react";
import {useAudioContext} from "../contexts/AudioContext";

/*
 * Echo Cancellation
 *
 * Component for toggling echo cancellation
*/
export default function EchoCancellationToggle() {
  const {echoCancellation,
      setEchoCancellation} = useAudioContext();
  
  const handleChange = () => {
    setEchoCancellation(!echoCancellation)
  }
  
  return (
    <div className="flex gap-4 items-center min-w-[300px]">
      <Switch 
      defaultSelected={echoCancellation}
      onChange={handleChange}/>
    </div>
  );
}
