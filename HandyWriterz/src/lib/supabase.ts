import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Temporary direct configuration while we debug env variable loading
// These values should match what's in your .env.local
const DIRECT_SUPABASE_URL = 'https://thvgjcnrlfofioagjydk.supabase.co';
const DIRECT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmdqY25ybGZvZmlvYWdqeWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNjYzMDAsImV4cCI6MjA1Njg0MjMwMH0.OmWI-itN_xok_fKFxfID1ew7sKO843-jsylapBCqvvg';

// Get environment variables with proper error handling
function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Debug info to help troubleshoot env variable issues
  console.debug('Environment variables state:', {
    mode: import.meta.env.MODE,
    hasUrl: !!url,
    hasKey: !!key,
    envKeys: Object.keys(import.meta.env)
      .filter(key => key.startsWith('VITE_'))
      .join(', '),
    usingFallback: !url || !key
  });
  
  // Use environment variables if available, otherwise fall back to direct values
  return { 
    url: url || DIRECT_SUPABASE_URL, 
    key: key || DIRECT_SUPABASE_KEY 
  };
}

// Create a function to initialize the client
function createSupabaseClient() {
  try {
    const { url, key } = getSupabaseConfig();
    
    console.log('Initializing Supabase client with URL:', url.substring(0, 15) + '...');
    
    return createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: 'handywriterz-auth-token',
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-application-name': 'handywriterz-admin'
        }
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
}

// Initialize and export the client
export const supabase = createSupabaseClient();

// Auth helpers
export const signUp = async ({ email, password }: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async ({ email, password }: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};

// Storage helpers
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
  return { data, error };
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  return { error };
};

// Database helpers
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

// Realtime subscription helper
export const subscribeToChanges = (
  table: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('db_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      callback
    )
    .subscribe();
};

export default supabase;
