import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface TopNavProps {
  toggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Dummy notifications for UI
  const notifications = [
    {
      id: '1',
      title: 'New comment on "Evidence-Based Nursing Practices"',
      time: '5m ago',
      read: false
    },
    {
      id: '2',
      title: 'Your post has been published',
      time: '1h ago',
      read: false
    },
    {
      id: '3',
      title: 'New user registered',
      time: '3h ago',
      read: true
    }
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-20">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 mr-2"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="relative max-w-md hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications.some(n => !n.read) && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-medium">Notifications</h3>
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  Mark all as read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="text-sm font-medium">{notification.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{notification.time}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-gray-200 text-center">
                <Link to="/admin/notifications" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
            aria-label="User menu"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="font-medium">{getUserInitials()}</span>
              )}
            </div>
            <div className="hidden md:block">
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              <ChevronDown className="ml-1 h-4 w-4 inline" />
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200">
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
              </div>
              <div className="p-2">
                <Link
                  to="/admin/profile"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-5 w-5 mr-2 text-gray-500" />
                  Your Profile
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="h-5 w-5 mr-2 text-gray-500" />
                  Settings
                </Link>
              </div>
              <div className="p-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-red-600 rounded-md hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}; 