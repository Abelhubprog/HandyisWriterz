import { toast } from 'react-hot-toast';
import { supabase } from '@/utils/supabase';
import { User, AuthError, Session, UserResponse } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'editor' | 'user';
  avatarUrl: string | null;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string | null;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },
  
  /**
   * Sign out the current user
   */
  async signOut() {
    return supabase.auth.signOut();
  },
  
  /**
   * Get the current user's information
   */
  async getCurrentUser(): Promise<UserResponse> {
    return supabase.auth.getUser();
  },
  
  /**
   * Get the current session
   */
  async getSession() {
    return supabase.auth.getSession();
  },
  
  /**
   * Set up an auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
  
  /**
   * Check if the current user has admin role
   */
  async isAdmin(): Promise<boolean> {
    const { data: { user } } = await this.getCurrentUser();
    
    if (!user) return false;
    
    // Check user metadata for admin role
    return user.app_metadata?.role === 'admin';
  },
  
  /**
   * Reset password with email
   */
  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
  },
  
  /**
   * Update user password
   */
  async updatePassword(password: string) {
    return supabase.auth.updateUser({ password });
  },

  // Login user
  login: async (email: string, password: string) => {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (user) {
        // Get user profile with role information
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        return {
          id: user.id,
          email: user.email!,
          name: profile?.display_name || user.email?.split('@')[0],
          role: profile?.role || 'user',
          avatarUrl: profile?.avatar_url,
          status: profile?.status || 'active',
          lastLogin: user.last_sign_in_at,
        } as AuthUser;
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Admin login with additional role check
  adminLogin: async (email: string, password: string) => {
    try {
      const user = await authService.login(email, password);
      
      if (user?.role !== 'admin') {
        throw new Error('Not authorized as admin');
      }

      return user;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (email: string, password: string, name: string) => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
        },
      });

      if (error) throw error;

      if (user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              display_name: name,
              role: 'user',
              status: 'active',
            },
          ]);

        if (profileError) throw profileError;

        return {
          id: user.id,
          email: user.email!,
          name,
          role: 'user',
          avatarUrl: null,
          status: 'active',
          lastLogin: user.last_sign_in_at,
        } as AuthUser;
      }

      return null;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId: string, data: Partial<AuthUser>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.name,
          avatar_url: data.avatarUrl,
          status: data.status,
          role: data.role,
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  },
};

/**
 * Hook to get current auth state
 */
export const useAuth = () => {
  // This would be implemented with React's useState and useEffect
  // Just placeholder for now to show the concept
  return {
    getCurrentUser: authService.getCurrentUser,
    signIn: authService.signIn,
    signOut: authService.signOut,
    isAdmin: authService.isAdmin,
  };
};
