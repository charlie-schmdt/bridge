import { useEffect, useRef, useState } from 'react';
import videopng from "@assets/video.png"
import video_inactivepng from "@assets/video_inactive.png"
import { Select, SelectItem } from '@heroui/react';

export default function VF() {
    const [isCameraEnabled, setIsCameraEnabled] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const toggleCamera = () => {
        setIsCameraEnabled(prev => !prev);
        if (currStream) {
            stop_stream();
        } else if (selectedDevice){
            initCamera(selectedDevice);
        }
    };
    const [currStream, setCurrStream] = useState(null);

    useEffect(() => {     
        const getDevices = async () => {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === "videoinput");
            setDevices(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedDevice(videoDevices[0].deviceId); // default to first camera
            }
        };
        getDevices();
      return () => {
        stop_stream();
      }
    }, [])
    

    async function initCamera(deviceId) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId }}, audio:false});
            setCurrStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            
        } catch (err) {
            console.error("Error accessing camera:", err);
        }
    }
    async function stop_stream() {
        if (currStream) {
            const tracks = (currStream as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            setCurrStream(null);
        }
    }
    return (
        <> 
            <div className="flex items-start gap-4">
                <div className="aspect-video overflow-hidden w-[50%] h-[50%] rounded-md bg-black">
                    <video
                        ref={videoRef}
                        autoPlay={true}
                        muted={true}
                        className={`w-full h-full" ${isCameraEnabled ? 'block' : 'hidden'}`}
                    />
                </div>
                <div>
                    <label className="mb-1">Input Source</label>
                    {selectedDevice &&
                    <Select
                        label="Choose a camera"
                        placeholder="Select camera"
                        defaultSelectedKeys={[selectedDevice]}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        disallowEmptySelection
                    >
                        {devices.map((device) => (
                        <SelectItem key={device.deviceId}>
                            {device.label || `Camera ${device.deviceId}`}
                        </SelectItem>
                        ))}
                    </Select>
                    }
                </div>
            </div>
            <div className="flex gap-4">
                <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
                    onClick={ toggleCamera } >
                    <img src={isCameraEnabled? videopng : video_inactivepng} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
                </button>
            </div> 
        </>                           
    );
    
    
}