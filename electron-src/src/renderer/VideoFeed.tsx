import { useContext, useEffect, useRef } from 'react';
import { useVideoFeedContext, VideoFeedContext } from './contexts/VideoFeedContext';

export default function VideoFeed() {
    const VF = useVideoFeedContext();

    //const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: VF.isVideoEnabled, audio: VF.isAudioEnabled});
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
    }, [VF.isAudioEnabled, VF.isVideoEnabled]);

    return <video ref={VF.videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
}