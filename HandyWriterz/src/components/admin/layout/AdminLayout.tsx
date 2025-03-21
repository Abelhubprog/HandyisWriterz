import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <TopNav toggleSidebar={toggleSidebar} />
      
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar open={sidebarOpen} />
        
        <main 
          className={`flex-1 overflow-auto transition-all duration-200 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
