import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiFileText, 
  FiUsers, 
  FiBarChart2, 
  FiSettings,
  FiFolder,
  FiChevronRight,
  FiChevronDown,
  FiBookOpen,
  FiEdit
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';

// Service types
const serviceTypes = [
  { id: 'adult-health-nursing', name: 'Adult Health Nursing' },
  { id: 'mental-health-nursing', name: 'Mental Health Nursing' },
  { id: 'child-nursing', name: 'Child Nursing' },
  { id: 'crypto', name: 'Cryptocurrency' },
  { id: 'ai', name: 'AI' }
];

/**
 * Improved Sidebar component with service-specific navigation
 */
const Sidebar: React.FC = () => {
  const location = useLocation();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  
  // Check if the current route matches this path
  const isActive = (path: string) => location.pathname === path;
  
  // Check if the current route starts with this path
  const isActiveParent = (path: string) => location.pathname.startsWith(path);
  
  // Toggle the services dropdown
  const toggleServices = () => setServicesOpen(!servicesOpen);
  
  // Toggle the content dropdown
  const toggleContent = () => setContentOpen(!contentOpen);
  
  // Check if we need to open dropdown based on current path
  useEffect(() => {
    if (location.pathname.startsWith('/admin/services/')) {
      setServicesOpen(true);
    }
    if (location.pathname.startsWith('/admin/content')) {
      setContentOpen(true);
    }
  }, [location.pathname]);
  
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden md:block overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">H</span>
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">HandyWriterz</span>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <div className="p-4 space-y-1 overflow-y-auto">
        <Link 
          to="/admin" 
          className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
            isActive('/admin') ? 'bg-blue-50 text-blue-700' : ''
          }`}
        >
          <FiHome className="w-5 h-5" />
          <span className="mx-4 font-medium">Dashboard</span>
        </Link>
        
        {/* Content Management - with dropdown */}
        <div>
          <button 
            className={`w-full flex items-center justify-between px-4 py-3 text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
              isActiveParent('/admin/content') ? 'bg-blue-50 text-blue-700' : ''
            }`}
            onClick={toggleContent}
          >
            <div className="flex items-center">
              <FiFileText className="w-5 h-5" />
              <span className="mx-4 font-medium">Content</span>
            </div>
            {contentOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
          </button>
          
          {contentOpen && (
            <div className="pl-4 mt-1 space-y-1">
              <Link 
                to="/admin/content" 
                className={`flex items-center pl-8 pr-4 py-2 text-sm text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
                  isActive('/admin/content') ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <span>All Content</span>
              </Link>
              <Link 
                to="/admin/content/new" 
                className={`flex items-center pl-8 pr-4 py-2 text-sm text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
                  isActive('/admin/content/new') ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <span>Create New</span>
              </Link>
              <Link 
                to="/admin/categories" 
                className={`flex items-center pl-8 pr-4 py-2 text-sm text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
                  isActive('/admin/categories') ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <span>Categories</span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Services - with dropdown */}
        <div>
          <button 
            className={`w-full flex items-center justify-between px-4 py-3 text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
              isActiveParent('/admin/services') ? 'bg-blue-50 text-blue-700' : ''
            }`}
            onClick={toggleServices}
          >
            <div className="flex items-center">
              <FiBookOpen className="w-5 h-5" />
              <span className="mx-4 font-medium">Services</span>
            </div>
            {servicesOpen ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
          </button>
          
          {servicesOpen && (
            <div className="pl-4 mt-1 space-y-1">
              {serviceTypes.map((service) => (
                <div key={service.id}>
                  <Link 
                    to={`/admin/services/${service.id}`}
                    className={`flex items-center pl-8 pr-4 py-2 text-sm text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
                      isActive(`/admin/services/${service.id}`) ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <span>{service.name}</span>
                  </Link>
                  <Link 
                    to={`/admin/services/edit/${service.id}`}
                    className={`flex items-center pl-12 pr-4 py-2 text-xs text-gray-500 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
                      isActive(`/admin/services/edit/${service.id}`) ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <FiEdit className="w-3 h-3 mr-2" />
                    <span>Settings</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Link 
          to="/admin/users" 
          className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
            isActiveParent('/admin/users') ? 'bg-blue-50 text-blue-700' : ''
          }`}
        >
          <FiUsers className="w-5 h-5" />
          <span className="mx-4 font-medium">Users</span>
        </Link>
        
        <Link 
          to="/admin/analytics" 
          className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
            isActive('/admin/analytics') ? 'bg-blue-50 text-blue-700' : ''
          }`}
        >
          <FiBarChart2 className="w-5 h-5" />
          <span className="mx-4 font-medium">Analytics</span>
        </Link>
        
        <Link 
          to="/admin/settings" 
          className={`flex items-center px-4 py-3 text-gray-600 transition-colors duration-200 rounded-lg hover:bg-gray-100 ${
            isActive('/admin/settings') ? 'bg-blue-50 text-blue-700' : ''
          }`}
        >
          <FiSettings className="w-5 h-5" />
          <span className="mx-4 font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar; 