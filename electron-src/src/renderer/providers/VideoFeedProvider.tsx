import React, { useRef, useState } from 'react';
import { VideoFeedContext } from '../contexts/VideoFeedContext';
import { VideoFeedType } from '../contexts/VideoFeedContext';

export const VideoFeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const toggleVideo= () => {
    setIsVideoEnabled(prev => !prev);
    console.log("video is: ", isVideoEnabled);

  };

  const toggleAudio= () => {
        setIsAudioEnabled(prev => !prev);
        console.log("audio is: ", isAudioEnabled);

  };

  const videoFeed: VideoFeedType = {
    videoRef,
    isAudioEnabled,
    isVideoEnabled,
    toggleVideo,
    toggleAudio,
  };

  return (
    <VideoFeedContext.Provider value={videoFeed}>
      {children}
    </VideoFeedContext.Provider>
  );
};
