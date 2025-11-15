import { useEffect, useRef } from "react";

export interface VideoPlayerProps {
  stream: MediaStream;
  isMuted?: boolean;
}

export const VideoPlayer = ({ stream, isMuted = false }: VideoPlayerProps) => {

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Assign the stream to the videoElement's srcObject
      videoRef.current.srcObject = stream;
    }
  }, [stream])

  return (
    <div className="flex-[1_1_400px] h-full box-border">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain rounded-lg" />
    </div>
  );
}