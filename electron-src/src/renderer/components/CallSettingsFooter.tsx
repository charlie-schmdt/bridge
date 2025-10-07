import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import ProfileMenuButton from "./ProfileMenuButton";
import mic from "@assets/microphone_active.png";
import videopng from "@assets/video.png"
import { VideoFeedProvider } from "../providers/VideoFeedProvider";
import { VideoFeedContext } from "../contexts/VideoFeedContext";
  
interface CallSettingsFooterProps {}

export function CallSettingsFooter({}: CallSettingsFooterProps) {
  const navigate = useNavigate();
  const VF = useContext(VideoFeedContext);

  return (
    <footer className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      {/* Left side: Logo + Nav */}
      <div className="flex items-center gap-6">
        {/**
         * AUDIO & VIDEO CONTROLS 
         */}
         
        <nav className="flex gap-4">
          <VideoFeedProvider>
            <button 
              className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
              onClick={VF.toggleAudio}
              >
              <img src={mic} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
            </button>
            <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
              onClick={VF.toggleVideo}
            >
              <img src={videopng} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
            </button>
          </VideoFeedProvider>
        </nav>
      </div>

      {/* user settings */}
      <div className="flex items-center gap-5">
        <button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
        >
          filler
        </button>
      </div>


      {/* Chat settings */}
      <div className="flex items-center gap-4">
        <button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
        >
          filler
        </button>
      </div>
    </footer>
  );
};

export default CallSettingsFooter;
