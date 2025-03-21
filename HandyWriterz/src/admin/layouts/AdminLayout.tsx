import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconType } from 'react-icons';
import { 
  FiHome, 
  FiFileText, 
  FiUsers, 
  FiBarChart2, 
  FiSettings, 
  FiMenu, 
  FiX, 
  FiBell, 
  FiSearch,
  FiLogOut
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast/use-toast';

interface NavItem {
  title: string;
  path: string;
  icon: IconType;
  submenu?: NavItem[];
}

const navigation: NavItem[] = [
  { title: 'Dashboard', path: '/admin', icon: FiHome },
  { 
    title: 'Content', 
    path: '/admin/content', 
    icon: FiFileText,
    submenu: [
      { title: 'All Content', path: '/admin/content', icon: FiFileText },
      { title: 'Add New', path: '/admin/content/new', icon: FiFileText },
      { title: 'Categories', path: '/admin/categories', icon: FiFileText },
    ]
  },
  { title: 'Users', path: '/admin/users', icon: FiUsers },
  { title: 'Analytics', path: '/admin/analytics', icon: FiBarChart2 },
  { title: 'Settings', path: '/admin/settings', icon: FiSettings },
];

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error logging out",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar} />
        
        <div className="fixed inset-y-0 left-0 flex flex-col z-40 w-64 max-w-xs bg-white">
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-xl font-semibold">Handy Writerz</span>
            </div>
            <button 
              onClick={toggleSidebar} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <React.Fragment key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                  
                  {item.submenu && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            location.pathname === subItem.path
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <subItem.icon className="mr-3 flex-shrink-0 h-4 w-4" aria-hidden="true" />
                          <span>{subItem.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      </div>
      
      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
            <div className="h-16 flex items-center flex-shrink-0 px-4 border-b border-gray-200">
              <span className="text-xl font-semibold">Handy Writerz</span>
            </div>
            
            <div className="flex-grow flex flex-col px-3 py-4">
              <nav className="flex-1 space-y-1">
                {navigation.map((item) => (
                  <React.Fragment key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${
                        location.pathname === item.path
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                    
                    {item.submenu && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                              location.pathname === subItem.path
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <subItem.icon className="mr-3 flex-shrink-0 h-4 w-4" aria-hidden="true" />
                            <span>{subItem.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </div>
            
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md w-full px-3 py-2"
              >
                <FiLogOut className="mr-3 flex-shrink-0 h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
            <button
              className="md:hidden h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
              title="Open sidebar"
            >
              <FiMenu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-lg w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative text-gray-400 focus-within:text-gray-600">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <FiSearch className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="search"
                    className="block w-full bg-white py-2 pl-10 pr-3 border border-gray-300 rounded-md leading-5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search content..."
                    type="search"
                    title="Search content"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              <button 
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="View notifications"
                title="View notifications"
              >
                <FiBell className="h-6 w-6" aria-hidden="true" />
              </button>
              
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                    <span className="text-sm font-medium">JD</span>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">John Doe</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 