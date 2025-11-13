import { createContext, useContext } from "react";

export interface RoomMediaType {
  videoRef: React.RefObject<HTMLVideoElement>;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

export const RoomMediaContext = createContext<RoomMediaType | undefined> (undefined);


export function useRoomMediaContext() { //hook for videoFeed
    const roomMedia = useContext(RoomMediaContext);

    if (roomMedia === undefined) {
        throw new Error('roomMedia not defined');
    }

    return roomMedia;
}