import { createContext, useContext } from "react";

export interface VideoFeedType {
  videoRef: React.RefObject<HTMLVideoElement>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

export const VideoFeedContext = createContext<VideoFeedType | undefined> (undefined);


export function useVideoFeedContext() { //hook for videoFeed
    const videoFeed = useContext(VideoFeedContext);

    if (videoFeed === undefined) {
        throw new Error('useVideoFeedContext not defined');
    }

    return videoFeed;
}