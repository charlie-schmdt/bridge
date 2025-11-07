import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import ProfileMenuButton from "./ProfileMenuButton";
import mic from "@assets/microphone_active.png";
import micOff from "@assets/microphone_inactive.png";
import videopng from "@assets/video.png"
import video_inactivepng from "@assets/video_inactive.png"
import { VideoFeedProvider } from "../providers/VideoFeedProvider";
import { useVideoFeedContext, VideoFeedContext } from "../contexts/VideoFeedContext";
import { Button, useDisclosure } from "@heroui/react";
import UserFeaturesModal from "./UserFeaturesModal";
  



export function CallSettingsFooter({ onOpenChat }) {
  const navigate = useNavigate();
  const VF = useVideoFeedContext();
  const {isOpen, onOpen, onOpenChange} = useDisclosure();


  return (
    <footer className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      {/* Left side: Logo + Nav */}
      <div className="flex items-center gap-6">
        {/**
         * AUDIO & VIDEO CONTROLS 
         */}
         
        <div className="flex gap-4">
          <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
            onClick={VF.toggleAudio}>
              
            <img src={ VF.isAudioEnabled? mic : micOff} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />  

          </button>
          
          <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
            onClick={VF.toggleVideo}
          >
            <img src={VF.isVideoEnabled? videopng : video_inactivepng} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
          </button>
        </div>
      </div>

      {/* user settings */}
      <div className="flex items-center gap-5">
        <Button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
          onPress={onOpen}
        >
          User Features Menu
        </Button>
        <UserFeaturesModal isOpen={isOpen} onOpen={onOpen} onOpenChange={onOpenChange}/>
      </div>


      {/* Chat settings */}
      <div className="flex items-center gap-4">
        <button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
          onClick={onOpenChat}
        >
          Chat
        </button>
      </div>
    </footer>
  );
};

export default CallSettingsFooter;
