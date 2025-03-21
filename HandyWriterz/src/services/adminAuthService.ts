import { supabase } from '@/lib/supabaseClient';
import { useClerk } from '@clerk/clerk-react';

// Check if a user is an admin
const checkIfUserIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const adminAuthService = {
  // Login is handled by Clerk
  async login() {
    // This is a placeholder as Clerk handles the login UI
    return;
  },
  
  // Logout function
  async logout() {
    const { signOut } = useClerk();
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
      throw new Error('Failed to log out');
    }
  },
  
  // Verify admin status
  async isAdmin(userId: string): Promise<boolean> {
    return checkIfUserIsAdmin(userId);
  },
  
  // Get current admin user details
  async getCurrentAdmin() {
    try {
      // Get current user from Clerk
      const userId = window.Clerk?.user?.id;
      
      if (!userId) {
        return null;
      }
      
      // Check admin status
      const isAdmin = await checkIfUserIsAdmin(userId);
      
      if (!isAdmin) {
        return null;
      }
      
      // Get admin details from Supabase
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error getting admin details:', error);
        return null;
      }
      
      return {
        id: userId,
        name: window.Clerk?.user?.fullName || data.name,
        email: window.Clerk?.user?.primaryEmailAddress?.emailAddress || data.email,
        role: data.role,
        avatar: window.Clerk?.user?.imageUrl || data.avatar,
        status: data.status,
        lastLogin: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting current admin:', error);
      return null;
    }
  }
}; 