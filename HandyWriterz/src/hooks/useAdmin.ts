import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export interface AdminStats {
  totalUsers: number;
  totalContent: number;
  totalInteractions: number;
  activeUsers: number;
}

export function useAdmin() {
  const { user } = useUser();

  const isAdmin = () => {
    return user?.publicMetadata?.role === 'admin';
  };

  const getAdminStats = async (): Promise<AdminStats | null> => {
    if (!isAdmin()) {
      toast.error('Unauthorized access');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return null;
    }
  };

  const manageUserRole = async (userId: string, role: string) => {
    if (!isAdmin()) {
      toast.error('Unauthorized access');
      return { success: false };
    }

    try {
      // Update role in Clerk
      await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      // Update role in Supabase for consistency
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      toast.success('User role updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
      return { success: false, error: error.message };
    }
  };

  const manageContent = async (contentId: string, action: 'approve' | 'reject' | 'delete') => {
    if (!isAdmin()) {
      toast.error('Unauthorized access');
      return { success: false };
    }

    try {
      switch (action) {
        case 'approve':
          await supabase
            .from('services')
            .update({ status: 'published', approved_by: user?.id })
            .eq('id', contentId);
          break;
        case 'reject':
          await supabase
            .from('services')
            .update({ status: 'rejected', rejected_by: user?.id })
            .eq('id', contentId);
          break;
        case 'delete':
          await supabase
            .from('services')
            .delete()
            .eq('id', contentId);
          break;
      }

      toast.success(`Content ${action}d successfully`);
      return { success: true };
    } catch (error: any) {
      console.error('Error managing content:', error);
      toast.error(`Failed to ${action} content`);
      return { success: false, error: error.message };
    }
  };

  const getUsersList = async () => {
    if (!isAdmin()) {
      toast.error('Unauthorized access');
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          content_count: services(count),
          last_login: auth_sessions(
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching users list:', error);
      return { success: false, error: error.message };
    }
  };

  const getContentList = async () => {
    if (!isAdmin()) {
      toast.error('Unauthorized access');
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          author:profiles!services_created_by_fkey(
            id,
            full_name,
            email
          ),
          likes_count: content_likes(count),
          comments_count: comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching content list:', error);
      return { success: false, error: error.message };
    }
  };

  const updateSystemSettings = async (settings: Record<string, any>) => {
    if (!isAdmin()) {
      toast.error('Unauthorized access');
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(settings);

      if (error) throw error;

      toast.success('System settings updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error updating system settings:', error);
      toast.error('Failed to update system settings');
      return { success: false, error: error.message };
    }
  };

  const getSystemLogs = async () => {
    if (!isAdmin()) {
      toast.error('Unauthorized access');
      return { success: false };
    }

    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching system logs:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    isAdmin,
    getAdminStats,
    manageUserRole,
    manageContent,
    getUsersList,
    getContentList,
    updateSystemSettings,
    getSystemLogs,
  };
}
