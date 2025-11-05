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

/*
 * Input Options
 *
 * Component for selecting audio input options
*/
function InputOptions() {
  //Read in the context values
  const {audioContext,
      senderInputDevice,
      setSenderInputDevice} = useAudioContext();
  
  //State to hold list of audio devices
  const [audioInputList, setAudioInputList] = useState([]);

  //Effect to fetch audio input devices when component mounts
  useEffect(() => {
    if (audioContext) {
      const updateInputs = async () => {
        let inputs = [];
        try {
          // Get all the audioinput devices
          const devices = await navigator.mediaDevices.enumerateDevices();
          devices.forEach((device) => {
            if (device.kind === "audioinput") {
              //Add each input to the list with its label
              inputs.push({
                key: device.deviceId,
                label: device.label || `Microphone ${inputs.length}`,
              });
            }
          });
          //Update state with the list of input devices
          setAudioInputList(inputs);
          console.log("inputs:", inputs); // Debugging line to check inputs
        } catch (error) {
          console.error("Error fetching audio input devices:", error);
        }
      };
      updateInputs(); // Call the async function
    }
  }, [audioContext]);

  //Function to handle when the input devices selection changes
  const handleInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //Get the selected device ID
    const selectedDevice = event.target.value;

    //Update the state with the selected input source
    setSenderInputDevice(selectedDevice);
  };

  //Render the select dropdown with available audio input devices
  return (
    <div className="flex flex-col gap-2">
      <Select
        className="w-full max-w-md bg-white text-gray-900"
        value={senderInputDevice}
        onChange={handleInputChange}
        radius="md"
      >
        {audioInputList.map((input) => (
          <SelectItem 
            className="bg-white hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" 
            key={input.key}>
              {input.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}

/*
 * Output Options
 *
 * Component for selecting an output option
*/
function OutputOptions() {
  //Read in the context values
  const {audioContext,
      senderOutputDevice,
      setSenderOutputDevice} = useAudioContext();

  //State to hold list of audio output devices
  const [audioOutputs, setAudioOutputs] = useState([
    {key: "default", label: "Default - Macbook Pro Speakers (Built-in)"},
  ]);

  //Function to handle when the output devices selection changes
  const handleOutputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //Get the selected device ID
    const selectedDevice = event.target.value; 
    
    // Update the state with the selected output source
    setSenderOutputDevice(selectedDevice); 
    console.log(selectedDevice)
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        className="w-full max-w-md bg-white text-gray-900"
        value={senderOutputDevice}
        onChange={handleOutputChange}
        radius="md"
      >
        {audioOutputs.map((output) => (
          <SelectItem 
            className="bg-white hover:bg-neutral-100 cursor-pointer transition-colors rounded-md py-2 px-3" 
            key={output.key}>
              {output.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}


//TODO: IDK What the problem is with it not displaying and the color issue
/*
 * Mic Sensitivity
 *
 * Component for selecting the mic sensitivity
*/
function MicSensitivity() {
  const {audioContext,
      setSenderMicSensitivity} = useAudioContext();
    
  const handleChange = (value: number) => {
    setSenderMicSensitivity(value);
  }

  return (
    <div className="flex gap-4 items-center">
      <Slider
      className="w-full"
      defaultValue={0.5}
      label="Mic Sensitivity"
      maxValue={1}
      onChange={handleChange}
      minValue={0}
      step={0.01}
      size="lg"
      color="success"
    />
    </div>
  );
}

/*
 * Echo Cancellation
 *
 * Component for toggling echo cancellation
*/
function EchoCancellation() {
  const {echoCancellation,
      setEchoCancellation} = useAudioContext();
  
  const handleChange = () => {
    setEchoCancellation(!echoCancellation)
  }
  
  return (
    <div className="flex gap-4 items-center min-w-[300px]">
      <Switch onChange={handleChange}/>
    </div>
  );
}

/*
 * Noise Suppression
 *
 * Component for toggling noise suppression
*/
function NoiseSuppression() {
  const {noiseSuppression,
      setNoiseSuppression} = useAudioContext();
  
  const handleChange = () => {
    setNoiseSuppression(!noiseSuppression)
  }
  
  return (
    <div className="flex gap-4 items-center min-w-[300px]">
      <Switch onChange={handleChange}/>
    </div>
  );
}

/*
 * Latency
 *
 * Component for displaying latency information
*/
function Latency() {
  const [latency, setlatency] = useState("0 ms");

  useEffect(() => {
    // Logic to fetch and update latency can be added here
  }, []);

  return (
    <h2 className="text-1xl font-bold text-gray-900 mt-2">Latency: {latency}</h2>
  );
}

export default function Sender() {

  return (
    <div>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="grid grid-cols-2 grid-rows-1 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Input source:</label>
          </div>
          <div className="p-4 ">
            <InputOptions />
          </div>
        </div>
        <div className="grid grid-cols-2 grid-rows-1 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Destination:</label>
          </div>
          <div className="p-4 ">
            <OutputOptions />
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
            <EchoCancellation/>
          </div>     
        </div>
        <div className="flex flex-col flex-[1] min-w-[150px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Noise Reduction:</label>
          </div>
          <div className="p-4 ">
            <NoiseSuppression/>
          </div>
        </div>
      </div>
      <hr/>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <AudioVisualizers/>
      </div>
      <hr/>
      <Latency/>
    </div>
  );
}
