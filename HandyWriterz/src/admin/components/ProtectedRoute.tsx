import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// During development, allow all access to admin routes
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  // For now, pretend authentication is always successful to help debug
  // We'll implement proper auth checks later
  console.log('ProtectedRoute check - allowing access for debugging');
  
  // Always render children during development
  return <>{children}</>;
};

export default ProtectedRoute; 