import { User as SupabaseUser } from '@supabase/supabase-js';
import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface User extends SupabaseUser {
  profile?: Profile;
  // Computed properties for easier access
  displayName: string;
  photoURL: string | null;
  role: 'admin' | 'editor' | 'user';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
