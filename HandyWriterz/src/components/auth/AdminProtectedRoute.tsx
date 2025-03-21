import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { isAdmin, syncUserToAppwrite } from '@/lib/clerkClient';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          // Sync user with Appwrite
          await syncUserToAppwrite(user);
          
          // Check if user has admin privileges
          const adminStatus = await isAdmin(user.id);
          setHasAdminAccess(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setHasAdminAccess(false);
        } finally {
          setIsLoading(false);
        }
      } else if (isLoaded && !isSignedIn) {
        setIsLoading(false);
        setHasAdminAccess(false);
      }
    };

    checkAdminStatus();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <h2 className="text-xl font-medium text-gray-700">Verifying admin access...</h2>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    // Redirect to sign-in page if user is not signed in
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (hasAdminAccess === false) {
    // Redirect to unauthorized page if user is not an admin
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  // Render children if user has admin access
  return <>{children}</>;
};

export default AdminProtectedRoute; 