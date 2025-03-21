import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Loader } from '@/components/ui/Loader';
import { motion } from 'framer-motion';
import { LockIcon, AlertCircle } from 'lucide-react';
import HandyWriterzLogo from '@/components/HandyWriterzLogo';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component
 * 
 * Protects routes that should only be accessible to authenticated users.
 * Redirects to login if not authenticated.
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const location = useLocation();
  const [showLoader, setShowLoader] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Set a timeout to hide the loader if it takes too long
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!isLoaded) {
      timer = setTimeout(() => {
        setAuthError('Authentication is taking longer than expected. Please refresh the page.');
      }, 10000); // 10 seconds timeout
    } else {
      setShowLoader(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoaded]);

  // Render loader while checking authentication
  if (!isLoaded) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gray-50"
      >
        <HandyWriterzLogo className="h-12 mb-6" />
        
        {showLoader ? (
          <div className="text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Verifying your credentials...</p>
          </div>
        ) : null}
        
        {authError && (
          <div className="mt-6 max-w-md mx-auto p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{authError}</p>
              <p className="mt-1 text-sm">
                There might be an issue with your connection or the authentication service.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Redirect to login if not authenticated
  if (!isSignedIn) {
    // Don't redirect admin login requests to the regular sign-in page
    if (location.pathname.includes('/admin') || location.pathname.includes('/auth/admin')) {
      return (
        <Navigate 
          to="/auth/admin-login" 
          state={{ from: location, message: "Please sign in to access this area" }} 
          replace 
        />
      );
    }
    
    // Regular user auth flow
    return (
      <Navigate 
        to="/sign-in" 
        state={{ from: location, message: "Please sign in to access this page" }} 
        replace 
      />
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default AuthGuard; 