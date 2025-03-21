import React from 'react';
import { FiBell, FiLogOut } from 'react-icons/fi';

/**
 * Simplified TopBar that doesn't depend on authentication hooks
 */
const TopBar: React.FC = () => {
  console.log('TopBar rendering');
  
  // Simplified logout handler that just redirects
  const handleLogout = () => {
    window.location.href = '/auth/admin-login';
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">HandyWriterz Admin</h1>
          </div>
          
          {/* Right side - User menu */}
          <div className="flex items-center">
            {/* Notification button */}
            <button 
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="View notifications"
            >
              <FiBell className="h-6 w-6" />
            </button>
            
            {/* User info and logout */}
            <div className="ml-3 flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                A
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                Admin
              </span>
              
              <button
                onClick={handleLogout}
                className="ml-4 p-2 rounded-full text-gray-400 hover:text-red-500 focus:outline-none"
                aria-label="Log out"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar; 