import { useContext, useEffect, useRef } from 'react';
import { VideoFeedContext } from './contexts/VideoFeedContext';

export default function VideoFeed() {
    const VF = useContext(VideoFeedContext);

    //const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
                if (VF.videoRef.current) {
                    VF.videoRef.current.srcObject = stream;
                    VF.videoRef.current.play();
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        }

        initCamera();

        return () => {
            if (VF.videoRef.current?.srcObject) {
                const tracks = (VF.videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        }
    }, []);

    useEffect(() => {

        /*

            changes made to video
        */

        //add new states to ./contexts/VideoFeedContext 
        // use isVideoEnabled for that field
    

    }, [VF.isVideoEnabled]) //video dependency

    return <video ref={VF.videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
}