import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText, 
  FiFolder, 
  FiSettings, 
  FiLogOut, 
  FiBarChart2, 
  FiUsers 
} from 'react-icons/fi';
import { authAdapter } from '../../../services/authAdapter';

// Navigation items for the sidebar
const navigationItems = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Content', href: '/admin/content', icon: FiFileText },
  { name: 'Categories', href: '/admin/categories', icon: FiFolder },
  { name: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
  { name: 'Users', href: '/admin/users', icon: FiUsers },
  { name: 'Settings', href: '/admin/settings', icon: FiSettings },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isActiveRoute = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };
  
  const handleLogout = async () => {
    try {
      await authAdapter.signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <img
            className="h-8 w-auto"
            src="/logo.svg"
            alt="Handy Writerz"
          />
          <span className="ml-2 text-xl font-semibold text-gray-800">Admin</span>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${isActiveRoute(item.href)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon
                  className={`
                    mr-3 flex-shrink-0 h-5 w-5
                    ${isActiveRoute(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="flex-shrink-0 group block w-full flex items-center text-sm font-medium text-red-500 hover:text-red-700"
          title="Log out"
          aria-label="Log out"
        >
          <FiLogOut className="mr-3 flex-shrink-0 h-5 w-5 text-red-500 group-hover:text-red-700" />
          Log out
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 