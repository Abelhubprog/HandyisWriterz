import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Image,
  ChevronDown,
  Bell,
  File,
  Palette,
  BarChart2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout, user, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!user) {
      navigate('/admin/login', { replace: true });
    } else if (!isAdmin) {
      toast.error('You do not have access to the admin area');
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === `/admin/${path}` || location.pathname.startsWith(`/admin/${path}/`);
  };

  const mainNavItems = [
    { name: 'Dashboard', path: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Content', path: 'content', icon: <FileText className="h-5 w-5" /> },
    { name: 'Services', path: 'services', icon: <Palette className="h-5 w-5" /> },
    { name: 'Media', path: 'media', icon: <Image className="h-5 w-5" /> },
    { name: 'Posts', path: 'posts', icon: <File className="h-5 w-5" /> },
    { name: 'Users', path: 'users', icon: <Users className="h-5 w-5" /> },
    { name: 'Analytics', path: 'analytics', icon: <BarChart2 className="h-5 w-5" /> },
    { name: 'Settings', path: 'settings', icon: <Settings className="h-5 w-5" /> },
  ];
  
  // Get current section name
  const currentSection = mainNavItems.find(item => isActive(item.path))?.name || 'Admin Panel';

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-40 flex lg:hidden`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-blue-600">HandyWriterz Admin</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1" aria-label="Admin navigation">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={`/admin/${item.path}`}
                  className={`${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                >
                  <div className={`${
                    isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-4`}>
                    {item.icon}
                  </div>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div>
                <img
                  className="inline-block h-10 w-10 rounded-full"
                  src={user?.photoURL || "https://via.placeholder.com/40/4f46e5/ffffff?text=Admin"}
                  alt="User avatar"
                />
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700">{user?.displayName || 'Admin User'}</p>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-500 hover:text-red-700 flex items-center"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Link to="/admin/dashboard">
                  <h1 className="text-xl font-bold text-blue-600">HandyWriterz Admin</h1>
                </Link>
              </div>
              <nav className="mt-8 flex-1 px-2 space-y-1" aria-label="Admin navigation">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.name}
                    to={`/admin/${item.path}`}
                    className={`${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    <div className={`${
                      isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3`}>
                      {item.icon}
                    </div>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div>
                  <img
                    className="inline-block h-9 w-9 rounded-full"
                    src={user?.photoURL || "https://via.placeholder.com/40/4f46e5/ffffff?text=Admin"}
                    alt="User avatar"
                  />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.displayName || 'Admin User'}</p>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 lg:hidden"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
            title="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <h2 className="text-xl font-semibold text-gray-800 self-center">
                {currentSection}
              </h2>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <button 
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="View notifications"
                title="View notifications"
              >
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="hidden md:block">
                  <span className="text-sm text-gray-600 mr-2">Welcome, {user?.displayName?.split(' ')[0] || 'Admin'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 