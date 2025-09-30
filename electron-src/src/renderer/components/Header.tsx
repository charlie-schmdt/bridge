import React from "react";
import { useNavigate } from "react-router-dom";
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
          <button className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Calendar
          </button>
          <button onClick={() => navigate("/video")}
            className="text-gray-700 font-medium hover:text-blue-600 cursor-pointer">
            Video
          </button>
        </nav>
      </div>

      {/* Right side: Notifications + Profile */}
      <div className="flex items-center gap-4">
        <button
          className="text-gray-500 hover:text-blue-600 cursor-pointer"
          aria-label="Notifications"
        >
          🔔
        </button>
        <ProfileMenuButton />
      </div>
    </header>
  );
};

export default Header;
