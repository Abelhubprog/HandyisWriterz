import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * SimpleDashboard - A minimal dashboard with no dependencies for debugging
 */
const SimpleDashboard: React.FC = () => {
  // Debug logging to console
  useEffect(() => {
    console.log('SimpleDashboard mounted');
    
    return () => {
      console.log('SimpleDashboard unmounted');
    };
  }, []);
  
  // Log render
  console.log('SimpleDashboard rendering');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your admin dashboard!
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Link 
            to="/admin/content/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Content
          </Link>
        </div>
      </div>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {['Content', 'Users', 'Views', 'Engagement'].map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-sm uppercase text-gray-500 font-medium">{item}</h3>
            <p className="mt-2 text-3xl font-bold">--</p>
          </div>
        ))}
      </div>
      
      {/* Admin Tools */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/admin/content"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"  
          >
            <h3 className="font-medium">Content Manager</h3>
            <p className="text-sm text-gray-500 mt-1">Edit and publish new content</p>
          </Link>
          
          <Link 
            to="/admin/users"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"  
          >
            <h3 className="font-medium">User Manager</h3>
            <p className="text-sm text-gray-500 mt-1">Manage user accounts</p>
          </Link>
          
          <Link 
            to="/admin/categories"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"  
          >
            <h3 className="font-medium">Categories</h3>
            <p className="text-sm text-gray-500 mt-1">Organize your content</p>
          </Link>
        </div>
      </div>
      
      {/* Auth Debug Info */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Session Debug Info</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify({
            sessionStorage: Object.keys(sessionStorage),
            localStorage: Object.keys(localStorage),
            location: window.location.pathname
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimpleDashboard; 