import {useAudioContext} from "../contexts/AudioContext";

/*
 * Latency
 *
 * Component for displaying latency information
*/
export default function Latency() {
  const {audioContext} = useAudioContext();

  return (
    <h2 className="text-1xl font-bold text-gray-900 mt-2">Latency: {audioContext.baseLatency}</h2>
  );
}
