import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, checkAdminStatus } from '../lib/supabaseClient';

interface SupabaseContextType {
  isAdmin: boolean;
  isLoading: boolean;
  checkAdminStatus: (userId: string) => Promise<boolean>;
  supabase: any; // Using any here since we're exporting the supabase client directly
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const checkAdmin = async () => {
      setIsLoading(true);
      if (isLoaded && user?.id) {
        try {
          const adminStatus = await checkAdminStatus(user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    checkAdmin();
  }, [user, isLoaded]);

  const value = {
    isAdmin,
    isLoading,
    checkAdminStatus,
    supabase
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseClient = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabaseClient must be used within a SupabaseProvider');
  }
  return { supabase: context.supabase };
};

export const useIsAdmin = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useIsAdmin must be used within a SupabaseProvider');
  }
  return { 
    isAdmin: context.isAdmin, 
    isLoading: context.isLoading 
  };
};
