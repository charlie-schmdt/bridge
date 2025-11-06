import { useState } from "react";
import {
  Select, SelectItem
} from "@heroui/react";
import {useAudioContext} from "../contexts/AudioContext";

/*
 * Output Options
 *
 * Component for selecting an output option
*/
export default function OutputOptions() {
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
        defaultSelectedKeys={[senderOutputDevice]}
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
