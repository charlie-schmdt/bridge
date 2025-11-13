import React, { useRef, useState } from 'react';
import { RoomMediaContext, RoomMediaType } from './RoomMediaContext';

export const RoomMediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const toggleVideo= () => {
    setIsVideoEnabled(prev => !prev);
  };

  const toggleAudio= () => {
    setIsAudioEnabled(prev => !prev);

  };

  const roomMedia: RoomMediaType = {
    videoRef,
    isAudioEnabled,
    isVideoEnabled,
    toggleVideo,
    toggleAudio,
  };

  return (
    <RoomMediaContext.Provider value={roomMedia}>
      {children}
    </RoomMediaContext.Provider>
  );
};
