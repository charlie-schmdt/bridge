import { useEffect, useState } from "react";
import {
  Select, SelectItem
} from "@heroui/react";
import {useAudioContext} from "../contexts/AudioContext";

/*
 * Input Options
 *
 * Component for selecting audio input options
*/
export default function InputOptions() {
  //Read in the context values
  const {audioContext,
      senderInputDevice} = useAudioContext();
  
  //State to hold list of audio devices
  const [audioInputList, setAudioInputList] = useState([]);

  //Effect to fetch audio input devices when component mounts
  useEffect(() => {
    if (audioContext.current) {
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
  }, [audioContext.current]);

  //Function to handle when the input devices selection changes
  const handleInputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //Get the selected device ID
    const selectedDevice = event.target.value;

    //Update the state with the selected input source
    senderInputDevice.current = selectedDevice;
  };

  //Render the select dropdown with available audio input devices
  return (
    <div className="flex flex-col gap-2">
      <Select
        className="w-full max-w-md bg-white text-gray-900"
        value={senderInputDevice.current}
        defaultSelectedKeys={[senderInputDevice.current]}
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
