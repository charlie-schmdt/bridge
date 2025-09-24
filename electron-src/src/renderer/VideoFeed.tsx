import { useEffect, useRef } from 'react';
export const VideoFeed = () => {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        async function initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false});
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

    return <video ref={videoRef} autoPlay muted style={{ width: '100%', height: 'auto' }} />
}