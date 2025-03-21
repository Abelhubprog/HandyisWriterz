import { supabase } from '../lib/supabaseClient';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'author' | 'user';
  status: 'active' | 'inactive' | 'pending';
  bio?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
}

export const userService = {
  /**
   * Get users with filters and pagination
   */
  async getUsers(filters: UserFilters = {}, page = 1, pageSize = 10) {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    return {
      data,
      count,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    };
  },
  
  /**
   * Get a single user by ID
   */
  async getUser(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Create a new user with auth and profile
   */
  async createUser(email: string, password: string, userData: Partial<UserProfile>) {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    
    if (authError) {
      console.error('Error creating auth user:', authError);
      throw authError;
    }
    
    // Then create the profile record
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: userData.full_name,
        role: userData.role || 'user',
        status: userData.status || 'active',
        bio: userData.bio,
        avatar_url: userData.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // If profile creation fails, attempt to clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }
    
    return profileData;
  },
  
  /**
   * Update an existing user's profile
   */
  async updateUser(id: string, userData: Partial<UserProfile>) {
    // Set updated timestamp
    userData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Change a user's status
   */
  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'pending') {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating user status for ${id}:`, error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Delete a user (both auth and profile)
   */
  async deleteUser(id: string) {
    // Delete auth user first
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    
    if (authError) {
      console.error(`Error deleting auth user ${id}:`, authError);
      throw authError;
    }
    
    // Then delete profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (profileError) {
      console.error(`Error deleting user profile ${id}:`, profileError);
      throw profileError;
    }
    
    return true;
  },
  
  /**
   * Upload an avatar for a user
   */
  async uploadAvatar(userId: string, file: File) {
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
    
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);
    
    // Update the user's profile with the avatar URL
    const { data, error } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating user avatar for ${userId}:`, error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Get all available user roles
   */
  async getRoles() {
    // In a real app, these might come from the database
    return [
      { id: 'admin', name: 'Admin' },
      { id: 'editor', name: 'Editor' },
      { id: 'author', name: 'Author' },
      { id: 'user', name: 'User' }
    ];
  }
}; 