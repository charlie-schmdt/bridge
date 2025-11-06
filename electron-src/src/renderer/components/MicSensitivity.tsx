import {useAudioContext} from "../contexts/AudioContext";

/*
 * Mic Sensitivity
 *
 * Component for selecting the mic sensitivity
*/
export default function MicSensitivity() {
  const { senderMicSensitivity, setSenderMicSensitivity } = useAudioContext();
  let value = 1.0
  
  // Handle the change event for the slider input
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    value = parseFloat(event.target.value); // Get the value from the input
    setSenderMicSensitivity(value);
  };

  return (
    <div className="flex gap-4 items-center">
      <label htmlFor="micSensitivity">Mic Sensitivity</label>
      <input
        id="micSensitivity"
        type="range"
        min="0"
        max="1"
        step="0.01"
        defaultValue={senderMicSensitivity}
        onChange={handleChange}
        className="w-full"
      />
      <span>{senderMicSensitivity}</span>
    </div>
  );
}
