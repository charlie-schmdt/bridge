import { useEffect, useRef, useState } from 'react';
import videopng from "@assets/video.png"
import video_inactivepng from "@assets/video_inactive.png"

export default function VF () {
    const [isCameraEnabled, setIsCameraEnabled] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const toggleCamera = () => {
        setIsCameraEnabled(prev => !prev);
    };

    useEffect(() => {
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
                console.log("tracks: ", stream.getVideoTracks())
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        }

        initCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, []);

    return (
        <>
            <video
                ref={videoRef}
                autoPlay={true}
                muted={true}
                className={`w-[50%] h-[50%] ${isCameraEnabled ? 'block' : 'hidden'}`}
            />
  
            {!isCameraEnabled && (
                <div className="h-[25%] w-[25%] bg-blue-500"></div>
            )}

            <div className="flex gap-4">
                {/*
                <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
                    onClick={setIsAudioEnabled(!isAudioEnabled)}>
                    
                    <img src={ isAudioEnabled? mic : micOff} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />  

                </button>
                */}
                
                <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
                    onClick={
                        toggleCamera
                        
                    }
                >
                    <img src={isCameraEnabled? videopng : video_inactivepng} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
                </button>
            </div>  
        </>                           
    );
    
    
}