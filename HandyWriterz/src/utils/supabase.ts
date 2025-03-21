import { createClient } from '@supabase/supabase-js';

// Fallback values for Supabase credentials
const FALLBACK_URL = 'https://thvgjcnrlfofioagjydk.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmdqY25ybGZvZmlvYWdqeWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNjYzMDAsImV4cCI6MjA1Njg0MjMwMH0.OmWI-itN_xok_fKFxfID1ew7sKO843-jsylapBCqvvg';

// Get environment variables (use Vite's import.meta.env instead of process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Create a new Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-export from lib to centralize access
export { supabase as default } from '@/lib/supabase'; 