import React, { useRef, useState } from 'react';
import { VideoFeedContext, VideoFeedType } from './VideoFeedContext';

export const VideoFeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const toggleVideo= () => {
    setIsVideoEnabled(prev => !prev);
  };

  const toggleAudio= () => {
    setIsAudioEnabled(prev => !prev);

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
