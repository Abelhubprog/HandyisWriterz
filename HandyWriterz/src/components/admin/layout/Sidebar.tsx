import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  FileText,
  Users,
  Image,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  Plus,
  Tags,
  PanelLeft,
  BarChart
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    content: true
  });

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Navigation items with nested structure
  const navItems = [
    {
      title: 'Dashboard',
      path: '/admin',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Content',
      path: '/admin/content',
      icon: <FileText className="h-5 w-5" />,
      children: [
        {
          title: 'All Content',
          path: '/admin/content',
          icon: <FileText className="h-4 w-4" />
        },
        {
          title: 'Add New',
          path: '/admin/content/new',
          icon: <Plus className="h-4 w-4" />
        },
        {
          title: 'Categories',
          path: '/admin/content/categories',
          icon: <Tags className="h-4 w-4" />
        }
      ]
    },
    {
      title: 'Media Library',
      path: '/admin/media',
      icon: <Image className="h-5 w-5" />
    },
    {
      title: 'Users',
      path: '/admin/users',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Analytics',
      path: '/admin/analytics',
      icon: <BarChart className="h-5 w-5" />
    },
    {
      title: 'Settings',
      path: '/admin/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  if (!open) {
    return (
      <aside className="w-16 fixed h-full bg-white border-r border-gray-200 shadow-sm z-10 flex flex-col">
        <div className="h-16 border-b border-gray-200 flex items-center justify-center">
          <Link to="/admin" className="p-2">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              H
            </div>
          </Link>
        </div>
        <nav className="flex-1 pt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center p-4 my-1 rounded-lg mx-2 ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={item.title}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => logout()}
            className="flex items-center justify-center p-2 rounded-lg w-full text-gray-600 hover:bg-gray-50"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 fixed h-full bg-white border-r border-gray-200 shadow-sm z-10 flex flex-col">
      <div className="h-16 border-b border-gray-200 flex items-center px-4">
        <Link to="/admin" className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            H
          </div>
          <span className="ml-2 font-bold text-gray-800">HandyWriterz</span>
        </Link>
      </div>
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.path} className="mb-1">
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpand('content')}
                  className={`flex items-center justify-between w-full p-3 rounded-lg ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3 font-medium">{item.title}</span>
                  </div>
                  {expandedItems.content ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedItems.content && (
                  <div className="mt-1 ml-4 pl-4 border-l border-gray-200">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center py-2 px-3 rounded-lg mb-1 ${
                          isActive(child.path)
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {child.icon}
                        <span className="ml-2 text-sm">{child.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={item.path}
                className={`flex items-center p-3 rounded-lg ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="ml-3 font-medium">{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => logout()}
          className="flex items-center w-full p-2 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </aside>
  );
}; 