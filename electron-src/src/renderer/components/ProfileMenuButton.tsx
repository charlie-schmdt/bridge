import React, { useState } from 'react';
import { useNavigate } from 'react-router';

const ProfileMenuButton = () => {
      const navigate = useNavigate();

  // 1. State to control the menu visibility
  const [isOpen, setIsOpen] = useState(false);

  // 2. Function to close the menu (e.g., when an item is clicked)
  const closeMenu = () => setIsOpen(false);

  // Example functions for menu items
  const handleLogin = () => { 
    closeMenu(); /* Logic for Login */ 
    console.log("Login clicked"); 
    navigate('/login'); // Navigate to login page
  };
  const handleSettings = () => { 
    closeMenu(); 
    /* Logic for Settings */ 
    console.log("Settings clicked"); 
    navigate('/settings'); // Navigate to settings page
  };
  const handleLogout = () => { closeMenu(); /* Logic for Logout */ console.log("Logout clicked"); };

  return (
    // 3. Main container for the button and the popup menu
    // The relative class is essential for positioning the absolute menu
    <div className="relative"> 
      
      {/* The original button, now toggles the menu */}
      <button
        onClick={() => setIsOpen(!isOpen)} // Toggle the state
        className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center hover:ring-2 hover:ring-blue-500 cursor-pointer"
      >
        <span className="text-gray-600">👤</span>
      </button>

      {/* 4. Conditionally Rendered Menu Popup */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Menu Item 1: Login/Create Account */}
          <button
            onClick={handleLogin}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            role="menuitem"
          >
            Login / Create Account
          </button>

          {/* Separator if user is logged in (optional) */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Menu Item 2: Settings (show only if logged in, for example) */}
          <button
            onClick={handleSettings}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            role="menuitem"
          >
            Settings
          </button>
          
          {/* Menu Item 3: LogOut (show only if logged in) */}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
            role="menuitem"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenuButton;