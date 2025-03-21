import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

/**
 * Dashboard Layout Component
 * 
 * Provides consistent layout structure for admin dashboard pages
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = 'Admin Dashboard',
  className = ''
}) => {
  return (
    <>
      <Helmet>
        <title>{title} | HandyWriterz Admin</title>
      </Helmet>
      
      <div className={`p-6 ${className}`}>
        {children}
      </div>
    </>
  );
};

export default DashboardLayout; 