import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { User, AuthContextType, AuthProviderProps, Profile } from '@/types/auth.types';
import { toast } from 'react-hot-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function transformUser(supabaseUser: SupabaseUser | null, profile?: Profile | null): User | null {
  if (!supabaseUser) return null;

  return {
    ...supabaseUser,
    profile: profile || undefined,
    displayName: profile?.display_name || supabaseUser.email?.split('@')[0] || 'User',
    photoURL: profile?.avatar_url,
    role: profile?.role || 'user'
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<Omit<AuthContextType, 'signIn' | 'signUp' | 'signOut' | 'updateProfile' | 'refreshUser'>>({
    user: null,
    isLoading: true,
    error: null
  });

  const refreshUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setState(s => ({
          ...s,
          user: transformUser(user, profile),
          error: null
        }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setState(s => ({ ...s, error: error as Error }));
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let profile = null;
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        profile = data;
      }
      setState(s => ({
        ...s,
        user: transformUser(session?.user || null, profile),
        isLoading: false
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        let profile = null;
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          profile = data;
        }
        setState(s => ({
          ...s,
          user: transformUser(session?.user || null, profile),
          isLoading: false
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      setState(s => ({ ...s, error: error as Error }));
      toast.error('Failed to sign in');
      throw error;
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      if (error) throw error;

      // Create profile
      if (data.user) {
        await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              display_name: displayName,
              role: 'user',
              status: 'active'
            }
          ]);
      }

      toast.success('Account created! Please check your email to verify your account.');
    } catch (error) {
      setState(s => ({ ...s, error: error as Error }));
      toast.error('Failed to create account');
      throw error;
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const signOut = async () => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState(s => ({ ...s, user: null }));
    } catch (error) {
      setState(s => ({ ...s, error: error as Error }));
      toast.error('Failed to sign out');
      throw error;
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      setState(s => ({ ...s, isLoading: true, error: null }));
      if (!state.user) throw new Error('No user logged in');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', state.user.id);

      if (error) throw error;

      // Refresh user data
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      setState(s => ({ ...s, error: error as Error }));
      toast.error('Failed to update profile');
      throw error;
    } finally {
      setState(s => ({ ...s, isLoading: false }));
    }
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshUser
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
