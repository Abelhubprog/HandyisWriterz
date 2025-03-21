import React, { useEffect, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import TopBar from '../navigation/TopBar';
import ErrorBoundary from '../ErrorBoundary';

interface AdminLayoutProps {
  children?: ReactNode;
}

/**
 * Simplified AdminLayout that doesn't rely on hooks
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  // Debug logging
  console.log('AdminLayout rendering');
  
  useEffect(() => {
    console.log('AdminLayout mounted');
    return () => {
      console.log('AdminLayout unmounted');
    };
  }, []);
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
          <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="container mx-auto">
            <ErrorBoundary>
              {children || <Outlet />}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 