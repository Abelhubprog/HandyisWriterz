/**
 * User Model Definitions
 * 
 * This file defines the User model interfaces and repository for the HandyWriterz application.
 * 
 * @file src/models/User.ts
 */

import { supabase } from '@/lib/supabase';

/**
 * User Role Enum
 */
export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  USER = 'user'
}

/**
 * User Model Interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

/**
 * User Creation Input Interface
 * Omits system-generated fields like ID and timestamps
 */
export interface UserInput extends Omit<User, 'id' | 'created_at' | 'updated_at'> {
  role?: UserRole; // Optional in creation, defaults to USER
  is_active?: boolean; // Optional in creation, defaults to true
}

/**
 * User Update Input Interface
 * Partial update with only the fields that need to change
 */
export interface UserUpdateInput extends Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> {}

/**
 * User Repository Class
 * 
 * Handles all database operations for the User model
 */
export class UserRepository {
  private static table = 'users';

  /**
   * Create a new user
   * 
   * @param data User input data
   * @returns The created user
   */
  static async create(data: UserInput): Promise<User> {
    // Set defaults if not provided
    const userData = {
      ...data,
      role: data.role || UserRole.USER,
      is_active: data.is_active !== undefined ? data.is_active : true
    };
    
    const { data: user, error } = await supabase
      .from(this.table)
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return user;
  }
  
  /**
   * Get a user by ID
   * 
   * @param id User ID
   * @returns The user or null if not found
   */
  static async getById(id: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from(this.table)
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return user;
  }
  
  /**
   * Get a user by email
   * 
   * @param email User email
   * @returns The user or null if not found
   */
  static async getByEmail(email: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from(this.table)
      .select()
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return user;
  }
  
  /**
   * List all users with pagination and optional filters
   * 
   * @param page Page number (starts at 1)
   * @param limit Items per page
   * @param role Optional role filter
   * @param isActive Optional active status filter
   * @returns Object with users array and total count
   */
  static async list(
    page: number = 1,
    limit: number = 10,
    role?: UserRole,
    isActive?: boolean
  ): Promise<{ users: User[], total: number }> {
    let query = supabase
      .from(this.table)
      .select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: users, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      users: users || [],
      total: count || 0
    };
  }
  
  /**
   * Update a user
   * 
   * @param id User ID
   * @param data User update data
   * @returns The updated user
   */
  static async update(id: string, data: UserUpdateInput): Promise<User> {
    const { data: user, error } = await supabase
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return user;
  }
  
  /**
   * Delete a user
   * 
   * @param id User ID
   * @returns Boolean indicating success
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
  
  /**
   * Update a user's last login time
   * 
   * @param id User ID
   * @returns The updated user
   */
  static async updateLastLogin(id: string): Promise<User> {
    return this.update(id, {
      last_login: new Date().toISOString()
    });
  }
  
  /**
   * Deactivate a user
   * 
   * @param id User ID
   * @returns The updated user
   */
  static async deactivate(id: string): Promise<User> {
    return this.update(id, {
      is_active: false
    });
  }
  
  /**
   * Activate a user
   * 
   * @param id User ID
   * @returns The updated user
   */
  static async activate(id: string): Promise<User> {
    return this.update(id, {
      is_active: true
    });
  }
  
  /**
   * Change a user's role
   * 
   * @param id User ID
   * @param role New role
   * @returns The updated user
   */
  static async changeRole(id: string, role: UserRole): Promise<User> {
    return this.update(id, { role });
  }
  
  /**
   * Search users by name or email
   * 
   * @param query Search query string
   * @param limit Maximum number of results to return
   * @returns Array of matching users
   */
  static async search(query: string, limit: number = 10): Promise<User[]> {
    const { data: users, error } = await supabase
      .from(this.table)
      .select()
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return users || [];
  }
} 