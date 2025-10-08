import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileMenuButton = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

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
    // NEW FUNCTION: Handle navigation to FAQ page
  const handleFAQ = () => {
    closeMenu();
    console.log("FAQ clicked");
    navigate("/faq"); // Navigate to FAQ page
  };

  const handleLogout = async () => {
    closeMenu();
    console.log("Logout clicked");

    try {
      await logout();
      console.log("✅ Logout successful");
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }

    };


  const handleProfile = () => {
    closeMenu();
    console.log("Profile clicked");
    navigate('/settings');

  };
   return (
    <div className="relative"> 
      {/* Profile button - shows different icon based on auth status */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center hover:ring-2 hover:ring-blue-500 cursor-pointer"
      >
        {isAuthenticated ? (
          // Show user's first letter or profile picture if logged in
          <span className="text-gray-600 font-semibold">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '👤'}
          </span>
        ) : (
          // Show generic user icon if not logged in
          <span className="text-gray-600">👤</span>
        )}
      </button>

      {/* Conditionally Rendered Menu Popup */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1"
          role="menu"
          aria-orientation="vertical"
        >
          {isAuthenticated ? (
            // Menu for logged-in users
            <>
              {/* User info header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>

              {/* Profile option */}
              <button
                onClick={handleProfile}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                role="menuitem"
              >
                Profile
              </button>

              {/* Settings option */}
              <button
                onClick={handleSettings}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                role="menuitem"
              >
                Settings
              </button>

              <button
                onClick={handleFAQ}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                role="menuitem"
              >
                FAQ
              </button>

              {/* Separator */}
              <div className="border-t border-gray-100 my-1"></div>
              
              {/* Logout option */}
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                role="menuitem"
              >
                Log Out
              </button>
            </>
          ) : (
            // Menu for non-logged-in users
            <>
              {/* Login/Create Account option */}
              <button
                onClick={handleLogin}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                role="menuitem"
              >
                Login / Create Account
              </button>

              {/* Optional: Settings for guest users */}
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={handleSettings}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                role="menuitem"
              >
                Settings
              </button>
                            {/* NEW FAQ Option */}
              <button
                onClick={handleFAQ}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                role="menuitem"
              >
                FAQ
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileMenuButton;