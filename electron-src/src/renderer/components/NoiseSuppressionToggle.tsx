import { useEffect, useState, useRef } from "react";
import {
  Tabs, Tab,
  Card, CardHeader, CardBody,
  Input, Textarea, Button, Slider,
  Select, SelectItem, 
  Switch,
  select
} from "@heroui/react";
import {useAudioContext} from "../contexts/AudioContext";

/*
 * Noise Suppression
 *
 * Component for toggling noise suppression
*/
export default function NoiseSuppressionToggle() {
  const {noiseSuppression,
      setNoiseSuppression} = useAudioContext();
  
  const handleChange = () => {
    setNoiseSuppression(!noiseSuppression)
  }
  
  return (
    <div className="flex gap-4 items-center min-w-[300px]">
      <Switch 
      defaultSelected={noiseSuppression}
      onChange={handleChange}/>
    </div>
  );
}
