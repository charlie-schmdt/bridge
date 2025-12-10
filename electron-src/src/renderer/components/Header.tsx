import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import ProfileMenuButton from "./ProfileMenuButton";
  
const Header: React.FC = () => {
  const navigate = useNavigate();



  return (
    <header className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      {/* Left side: Logo + Nav */}
      <div className="flex items-center gap-6">
        <span className="text-blue-600 font-bold text-xl">BRIDGE</span>
        <nav className="flex gap-4">
          <button onClick={() => navigate("/")}
            className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Workspaces
          </button>
          <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Calls
          </button>
          <button onClick={() => navigate("/calendar")} className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Calendar
          </button>
          <button onClick={() => navigate("/audiosandbox")} className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Audio Sandbox
          </button>
          {/*
          <button onClick={() => navigate("/video")}
            className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Video
          </button>
          */}
          <button onClick={() => navigate("/TestRoom")}
            className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Test Room
          </button>
           <button onClick={() => navigate("/TestWaitingRoom")}
            className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Test Waiting Room
          </button>
        </nav>
      </div>

      {/* Right side: Notifications + Profile */}
      <div className="flex items-center gap-4">
        <ProfileMenuButton />
      </div>
    </header>
  );
};

export default Header;
