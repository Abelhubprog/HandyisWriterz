import React, { createContext, useContext } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';

interface AuthContextType {
  user: any;
  isAdmin: boolean;
  loading: boolean;
  initialized: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user: clerkUser,
    isAdmin: clerkUser?.publicMetadata?.role === 'admin',
    loading: !clerkLoaded,
    initialized: clerkLoaded,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
