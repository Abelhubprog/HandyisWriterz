import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add local cache to prevent blinking during navigation
const AUTH_CACHE_KEY = 'handywriterz-auth-state';
const getSessionCache = () => {
  try {
    const cache = sessionStorage.getItem(AUTH_CACHE_KEY);
    return cache ? JSON.parse(cache) : null;
  } catch (e) {
    return null;
  }
};

const setSessionCache = (data: any) => {
  try {
    // Only cache non-sensitive data
    const cacheData = {
      isAuthenticated: !!data.user,
      email: data.user?.email,
      lastUpdated: Date.now()
    };
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Error caching auth state:', e);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current session
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        
        if (data.session?.user) {
          setUser(data.session.user);
          setIsAuthenticated(true);
          
          // Cache the auth state to prevent flicker
          setSessionCache({ user: data.session.user });
          
          // Check if user is admin based on metadata or a profile lookup
          const isAdminUser = data.session.user.app_metadata?.role === 'admin';
          setIsAdmin(isAdminUser);
        } else {
          // Check for cached auth state
          const cachedAuth = getSessionCache();
          if (cachedAuth && cachedAuth.isAuthenticated) {
            // If we have cached auth data, maintain authenticated state briefly
            // while we check the server again
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user || null);
      setIsAuthenticated(!!session?.user);
      
      if (session?.user) {
        // Cache the auth state
        setSessionCache({ user: session.user });
        
        const isAdminUser = session.user.app_metadata?.role === 'admin';
        setIsAdmin(isAdminUser);
      } else {
        // Clear cache if signed out
        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem(AUTH_CACHE_KEY);
        }
      }
    });
    
    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Auth methods
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return { user: null, error };
      }
      
      setUser(data.user);
      setSession(data.session);
      setIsAuthenticated(true);
      
      if (data.user) {
        // Cache auth state
        setSessionCache({ user: data.user });
        
        const isAdminUser = data.user.app_metadata?.role === 'admin';
        setIsAdmin(isAdminUser);
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { 
        user: null, 
        error: new AuthError('An unexpected error occurred during sign in', 500) 
      };
    }
  };
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
      
      // Clear cached auth state
      sessionStorage.removeItem(AUTH_CACHE_KEY);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  const value = {
    user,
    session,
    isLoading,
    isAdmin,
    isAuthenticated,
    signIn,
    signOut,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 