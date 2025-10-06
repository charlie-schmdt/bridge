import React from "react";
import { useNavigate } from "react-router-dom";
import ProfileMenuButton from "./ProfileMenuButton";
import mic from "@assets/microphone_active.png";
import videopng from "@assets/video.png"
  

const handleMic = () => {
  /*
    handler for mic

    turn mic on... or toggle 

  */


};

const CallSettingsFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      {/* Left side: Logo + Nav */}
      <div className="flex items-center gap-6">
        {/**
         * AUDIO & VIDEO CONTROLS 
         */}
         
        <nav className="flex gap-4">
          <button 
            className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer"
            onClick={handleMic}
            >
            <img src={mic} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          
          </button>
          <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            <img src={videopng} alt="App Icon" className="h-auto w-auto max-w-[32px] max-h-[32px]" />          

          </button>
        </nav>
      </div>

      {/* Right side: Notifications + Profile */}
      <div className="flex items-center gap-4">
        <button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
          aria-label="Notifications"
        >
          filler
        </button>
      </div>
    </footer>
  );
};

export default CallSettingsFooter;
