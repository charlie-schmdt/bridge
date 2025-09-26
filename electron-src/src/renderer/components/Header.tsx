import React from "react";
import { useNavigate } from "react-router-dom";
  
const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      {/* Left side: Logo + Nav */}
      <div className="flex items-center gap-6">
        <span className="text-blue-600 font-bold text-xl">BRIDGE</span>
        <nav className="flex gap-4">
          <button onClick={() => navigate("/")}
            className="text-gray-700 font-medium hover:text-blue-600">
            Workspaces
          </button>
          <button className="text-gray-700 font-medium hover:text-blue-600">
            Calls
          </button>
          <button className="text-gray-700 font-medium hover:text-blue-600">
            Calendar
          </button>
        </nav>
      </div>

      {/* Right side: Notifications + Profile */}
      <div className="flex items-center gap-4">
        <button
          className="text-gray-500 hover:text-blue-600"
          aria-label="Notifications"
        >
          🔔
        </button>
        <button
          onClick={() => navigate("/login")}
          className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center hover:ring-2 hover:ring-blue-500"
          aria-label="Profile"
        >
          <span className="text-gray-600">👤</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
