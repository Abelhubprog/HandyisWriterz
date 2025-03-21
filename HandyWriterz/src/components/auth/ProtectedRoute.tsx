import React, { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/providers/SupabaseProvider';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireAdmin = false
}) => {
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const { supabase } = useSupabase();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const location = useLocation();

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setIsAdmin(adminUser?.role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    if (user && requireAdmin) {
      checkAdminStatus();
    } else {
      setIsChecking(false);
    }
  }, [user, requireAdmin, supabase]);

  // Show loading spinner while checking auth state
  if (!isLoaded || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to sign-in
  if (!isSignedIn) {
    toast.error("Please sign in to access this page");
    return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  }

  // If route requires admin but user is not admin, redirect to dashboard
  if (requireAdmin && !isAdmin) {
    toast.error("You do not have permission to access this page");
    return <Navigate to="/dashboard" replace />;
  }

  // If all checks pass, render the children
  return <>{children}</>;
};

export default ProtectedRoute;