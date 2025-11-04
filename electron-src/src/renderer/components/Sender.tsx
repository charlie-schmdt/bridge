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


function InputOptions() {
  const {audioContext,
      senderInputDevice,
      senderOutputDevice,
      setMicInput,
      setSenderInputDevice,
      setSenderOutputDevice,
      setVolumeSensitivityGainValue,} = useAudioContext();

  const [audioInputList, setAudioInputList] = useState([
    {key: "file", label: "Input File"},
  ]);


  useEffect(() => {
      console.log("audioContext:", audioContext); // Check if audioContext is defined

      const updateInputs = async () => {
        let inputs = [{ key: "file", label: "Input File" }];
        try {
          if (audioContext) {
            // Enumerate devices with await
            const devices = await navigator.mediaDevices.enumerateDevices();
            devices.forEach((device) => {
              if (device.kind === "audioinput") {
                inputs.push({
                  key: device.deviceId,
                  label: device.label || `Microphone ${inputs.length}`,
                });
              }
            });
            setAudioInputList(inputs);
            console.log("inputs:", inputs); // Debugging line to check inputs
          }
        } catch (error) {
          console.error("Error fetching audio input devices:", error);
        }
      };

      if (audioContext) {
        updateInputs(); // Call the async function
        console.log("Audio inputs updated"); // Debugging line
      }
      
  }, [audioContext]);

  const handleInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDevice = event.target.value; // Get the selected device ID
    if (selectedDevice === 'file') {
      console.log("File input selected");
      setMicInput('file');
    }
    else {
      setMicInput(selectedDevice);
    }
    
  };

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

function InputFile() {

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <Input 
      placeholder="File"
      type="file"/>
    </div>
  )
}

//TODO: update the url
function ProcessButton() {
  return (
    <div className="flex gap-4 items-center">
      <Button isIconOnly aria-label="Process">
        <img
          src="/Users/tylerptak/Documents/Class/Fall_25/407/bridge/electron-src/src/assets/record.avif" // Replace with the path to your image
          alt="Process Icon"
          className="w-8 h-8" // You can adjust the size here
        />
      </Button>
    </div>
  );
}

function OutputOptions() {
  const audioContext = useAudioContext();

  const [audioOutputs, setAudioOutputs] = useState([
    {key: "file", label: "Output File"},{key: "default", label: "Default - Macbook Pro Speakers (Built-in)"},
  ]);
  const [selectedOutput, setSelectedOutput] = useState<string>('file');

  const handleOutputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDevice = event.target.value; // Get the selected device ID
    setSelectedOutput(selectedDevice); // Update the state with the selected input source
    console.log(selectedDevice)
  };

  return (
    <div className="flex flex-col gap-2">
      <Select
        className="w-full max-w-md bg-white text-gray-900"
        value={selectedOutput}
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

function OutputFile() {

  return (
    <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
      <Input placeholder="File"/>
    </div>
  )
}

//TODO: update the url
function PlayButton() {
  return (
    <div className="flex gap-4 items-center">
      <Button isIconOnly aria-label="Play">
        <img
          src="/Users/tylerptak/Documents/Class/Fall_25/407/bridge/electron-src/src/assets/play.png" // Replace with the path to your image
          alt="Record Icon"
          className="w-8 h-8" // You can adjust the size here
        />
      </Button>
    </div>
  );
}


//TODO: IDK What the problem is with it not displaying and the color issue
function MicSensitivity() {
  return (
    <div className="flex gap-4 items-center">
      <Slider
      className="w-full"
      defaultValue={0.5}
      label="Mic Sensitivity"
      maxValue={1}
      minValue={0}
      step={0.01}
      size="lg"
      color="success"
    />
    </div>
  );
}

function EchoCancellation() {
  return (
    <div className="flex gap-4 items-center min-w-[300px]">
      <Switch />
    </div>
  );
}

function NoiseReduction() {
  return (
    <div className="flex gap-4 items-center min-w-[150px]">
      <Switch/>
    </div>
  );
}

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

  useEffect(()=>{

  }, []
  );

  return (
    <div>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Input source:</label>
          </div>
          <div className="p-4 ">
            <InputOptions />
          </div>
          <div className="p-4 ">
            <label className="mb-2">Input File:</label>
          </div>
          <div className="p-4 ">
            <InputFile/>
          </div>
          <div className="p-4 ">
            <label className="mb-2">Process:</label>
          </div>
          <div className="p-4 ">
            <ProcessButton />
          </div>      
        </div>
        <div className="grid grid-cols-2 grid-rows-3 gap-4 flex-1 min-w-[300px] mt-2 mb-2">
          <div className="p-4 ">
            <label className="mb-2">Destination:</label>
          </div>
          <div className="p-4 ">
            <OutputOptions />
          </div>
          <div className="p-4 ">
            <label className="mb-2">Output File:</label>
          </div>
          <div className="p-4 ">
            <OutputFile/>
          </div>
          <div className="p-4 ">
            <label className="mb-2">Play Output:</label>
          </div>
          <div className="p-4 ">
            <PlayButton />
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
            <NoiseReduction/>
          </div>
        </div>
      </div>
      <hr/>
      <div className="flex flex-row mt-2 mb-2 w-full justify-between">
          <h2 className="text-1xl font-bold text-gray-900">Before Processing:</h2>
          <h2 className="text-1xl font-bold text-gray-900">After Processing:</h2>
      </div>
      <div className="flex flex-row  rounded-xl shadow gap-4">
        <AudioVisualizers/>
        <AudioVisualizers/>
      </div>
      <hr/>
      <Latency/>
    </div>
  );
}
