import { authService } from './authService';
import { adminAuthFixService } from './adminAuthFix';
import { supabase } from '../lib/supabaseClient';
import { useUser } from '@clerk/clerk-react';

/**
 * AuthAdapter provides a unified interface for authentication,
 * supporting both Appwrite, Supabase, and Clerk authentication systems.
 */
export const authAdapter = {
  /**
   * Check if user is authenticated using any available auth system
   */
  async isAuthenticated(): Promise<boolean> {
    // First check Appwrite auth for admin users
    const appwriteUser = adminAuthFixService.getCurrentUser();
    if (appwriteUser) {
      try {
        const isValid = await adminAuthFixService.verifySession();
        if (isValid) {
          return true;
        } else {
          // Invalid session, clear it
          adminAuthFixService.clearLocalStorage();
        }
      } catch (error) {
        console.error('Error verifying Appwrite session:', error);
      }
    }

    // Next try Supabase auth
    try {
      const { data } = await authService.getCurrentUser();
      if (data && data.user) {
        return true;
      }
    } catch (error) {
      console.error('Error checking Supabase auth:', error);
    }

    // Finally, check for Clerk auth in the browser environment
    // Note: This is a client-side only check and will only work in component context
    if (typeof window !== 'undefined') {
      try {
        // For non-hook context, we can try to get the user from localStorage
        // This is not a secure way to validate auth, but can work as a fallback for admin UI
        const clerkUser = localStorage.getItem('clerk-user');
        if (clerkUser) {
          // Additional validation would be done through the Clerk API in a real implementation
          return true;
        }
      } catch (error) {
        console.error('Error checking Clerk auth:', error);
      }
    }

    return false;
  },

  /**
   * Check if user has admin privileges
   */
  async isAdmin(): Promise<boolean> {
    // First check Appwrite auth (all users in adminAuth are admins)
    const appwriteUser = adminAuthFixService.getCurrentUser();
    if (appwriteUser) {
      try {
        const isValid = await adminAuthFixService.verifySession();
        if (isValid) {
          return true; // All users in admin auth system are admins
        }
      } catch (error) {
        console.error('Error verifying Appwrite admin status:', error);
      }
    }

    // Then check Supabase admin status
    try {
      const isAdmin = await authService.isAdmin();
      if (isAdmin) return true;
    } catch (error) {
      console.error('Error checking Supabase admin status:', error);
    }

    // Fallback to checking Clerk user roles (would need to implement in a real app)
    // This is a placeholder for how you'd implement it
    if (typeof window !== 'undefined') {
      try {
        const clerkUser = localStorage.getItem('clerk-user');
        if (clerkUser) {
          const userData = JSON.parse(clerkUser);
          // Check if user has admin role in publicMetadata
          return !!(userData.publicMetadata && userData.publicMetadata.role === 'admin');
        }
      } catch (error) {
        console.error('Error checking Clerk admin status:', error);
      }
    }

    return false;
  },

  /**
   * Sign out from all auth systems
   */
  async signOut(): Promise<void> {
    // Sign out from Appwrite
    try {
      adminAuthFixService.clearLocalStorage();
    } catch (error) {
      console.error('Error signing out from Appwrite:', error);
    }

    // Sign out from Supabase
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    }

    // Redirect to admin login after logout
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/admin-login';
    }
  },

  /**
   * Get current user info from any auth system
   */
  async getCurrentUser() {
    // First try Appwrite
    const appwriteUser = adminAuthFixService.getCurrentUser();
    if (appwriteUser) {
      try {
        const isValid = await adminAuthFixService.verifySession();
        if (isValid) {
          return {
            id: appwriteUser.id,
            email: appwriteUser.email,
            name: appwriteUser.name,
            role: 'admin',
          };
        }
      } catch (error) {
        console.error('Error getting Appwrite user:', error);
      }
    }

    // Then try Supabase
    try {
      const { data } = await authService.getCurrentUser();
      if (data && data.user) {
        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: profile?.full_name || data.user.email?.split('@')[0],
          role: profile?.role || 'user',
        };
      }
    } catch (error) {
      console.error('Error getting Supabase user:', error);
    }

    // Last fallback would be Clerk
    if (typeof window !== 'undefined') {
      try {
        const clerkUser = localStorage.getItem('clerk-user');
        if (clerkUser) {
          const userData = JSON.parse(clerkUser);
          return {
            id: userData.id,
            email: userData.primaryEmailAddress?.emailAddress,
            name: `${userData.firstName} ${userData.lastName}`.trim(),
            role: userData.publicMetadata?.role || 'user',
          };
        }
      } catch (error) {
        console.error('Error getting Clerk user:', error);
      }
    }

    return null;
  },
}; 