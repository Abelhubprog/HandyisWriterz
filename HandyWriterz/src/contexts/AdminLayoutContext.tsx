import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CircleUserRound, HelpCircle, LogOut, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface Notification {
  id: string;
  type: "comment" | "like" | "mention" | "system" | "alert";
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

interface AdminLayoutContextType {
  notifications: Notification[];
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  isUserMenuOpen: boolean;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  toggleNotifications: () => void;
  toggleUserMenu: () => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  markAllNotificationsAsRead: () => void;
  markNotificationAsRead: (id: string) => void;
}

const AdminLayoutContext = createContext<AdminLayoutContextType | undefined>(undefined);

export const useAdminLayout = () => {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error("useAdminLayout must be used within an AdminLayoutProvider");
  }
  return context;
};

export const AdminLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    // In production, this would fetch from an API
    setNotifications([
      {
        id: "1",
        type: "comment",
        message: "New comment on 'Adult Health Nursing Best Practices'",
        time: "5 minutes ago",
        read: false,
        link: "/admin/content/posts/edit/1"
      },
      {
        id: "2",
        type: "like",
        message: "15 new likes on your recent post",
        time: "1 hour ago",
        read: false,
        link: "/admin/analytics"
      },
      {
        id: "3",
        type: "system",
        message: "System update completed successfully",
        time: "2 hours ago",
        read: true
      },
      {
        id: "4",
        type: "alert",
        message: "Your storage is almost full (85%)",
        time: "1 day ago",
        read: true,
        link: "/admin/media"
      }
    ]);
  }, []);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsNotificationsOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsNotificationsOpen(false);
      setIsUserMenuOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const value = {
    notifications,
    unreadNotificationsCount,
    isNotificationsOpen,
    isUserMenuOpen,
    isSidebarOpen,
    isMobileMenuOpen,
    toggleNotifications,
    toggleUserMenu,
    toggleSidebar,
    toggleMobileMenu,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  };

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
};

export const NotificationsDropdown: React.FC = () => {
  const {
    notifications,
    isNotificationsOpen,
    markAllNotificationsAsRead,
    markNotificationAsRead
  } = useAdminLayout();

  if (!isNotificationsOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Notifications</h3>
          <button 
            onClick={markAllNotificationsAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                !notification.read ? "bg-blue-50" : ""
              }`}
              onClick={() => markNotificationAsRead(notification.id)}
            >
              <div className="flex gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  notification.type === "comment" ? "bg-green-100 text-green-600" :
                  notification.type === "like" ? "bg-red-100 text-red-600" :
                  notification.type === "mention" ? "bg-blue-100 text-blue-600" :
                  notification.type === "alert" ? "bg-orange-100 text-orange-600" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  <Bell size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-sm">{notification.message}</div>
                  <div className="text-xs text-gray-500 mt-1">{notification.time}</div>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 bg-blue-600 rounded-full self-start mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200">
        <button className="text-sm text-blue-600 hover:text-blue-800 block text-center w-full">
          View all notifications
        </button>
      </div>
    </div>
  );
};

export const UserMenuDropdown: React.FC = () => {
  const { isUserMenuOpen } = useAdminLayout();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isUserMenuOpen || !user) return null;

  return (
    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-3 border-b border-gray-200">
        <div className="font-medium">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
      </div>
      
      <div className="p-2">
        <button 
          onClick={() => navigate("/admin/profile")}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700 w-full text-left"
        >
          <CircleUserRound size={16} />
          Your Profile
        </button>
        
        <button 
          onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700 w-full text-left"
        >
          <Settings size={16} />
          Settings
        </button>
        
        <button 
          onClick={() => navigate("/admin/help")}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700 w-full text-left"
        >
          <HelpCircle size={16} />
          Help & Support
        </button>
      </div>
      
      <div className="p-2 border-t border-gray-200">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-gray-700 w-full text-left"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};
