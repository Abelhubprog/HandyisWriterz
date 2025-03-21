const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mlcoggqmaayimhpeemef.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sY29nZ3FtYWF5aW1ocGVlbWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDQxNDksImV4cCI6MjA1NTgyMDE0OX0._P3FTQCvxHCk3BlU-SajETrsNk3L9NfuqLobWthy7Pg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // 1. Sign up the admin user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: 'admin@handywriterz.com',
      password: 'admin123',
    });

    if (signUpError) {
      throw signUpError;
    }

    console.log('Admin user created:', authData.user);

    // 2. Create admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: 'admin@handywriterz.com',
          role: 'admin',
        },
      ]);

    if (profileError) {
      throw profileError;
    }

    console.log('Admin profile created successfully!');
    
    // 3. Sign in to verify
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@handywriterz.com',
      password: 'admin123',
    });

    if (signInError) {
      throw signInError;
    }

    console.log('Admin login successful:', signInData.user);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdminUser(); 