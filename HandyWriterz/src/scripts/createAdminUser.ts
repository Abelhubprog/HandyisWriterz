import { supabase, adminSupabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

/**
 * Script to create an admin user and add it to the admin_users table
 * Run this script with: npx ts-node -r tsconfig-paths/register src/scripts/createAdminUser.ts
 */
async function createAdminUser() {
  try {
    console.log('Starting admin user creation process...');
    
    // Check if admin user already exists in auth
    const { data: existingUser, error: checkError } = await supabase.auth
      .signInWithPassword({
        email: 'admin@handywriterz.com',
        password: 'admin123',
      });
    
    let userId;
    
    // If admin doesn't exist, create it
    if (checkError || !existingUser?.user) {
      console.log('Admin user does not exist. Creating new admin user...');
      
      // Create admin user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@handywriterz.com',
        password: 'admin123',
        options: {
          data: {
            full_name: 'Admin User',
            role: 'admin'
          }
        }
      });
      
      if (authError) {
        console.error('Error creating admin user in auth:', authError);
        throw authError;
      }
      
      userId = authData.user?.id;
      console.log('Admin user created in auth with ID:', userId);
      
      // Create profile for admin
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: 'admin@handywriterz.com',
          full_name: 'Admin User',
          role: 'admin',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        });
      
      if (profileError) {
        console.error('Error creating admin profile:', profileError);
        throw profileError;
      }
      
      console.log('Admin profile created successfully');
    } else {
      userId = existingUser.user.id;
      console.log('Admin user already exists with ID:', userId);
    }
    
    // Check if admin exists in admin_users table
    const { data: existingAdminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.error('Error checking admin_users table:', adminCheckError);
      throw adminCheckError;
    }
    
    // If admin doesn't exist in admin_users, add it
    if (!existingAdminUser) {
      console.log('Adding user to admin_users table...');
      
      const { error: adminInsertError } = await supabase
        .from('admin_users')
        .insert({
          id: userId,
          email: 'admin@handywriterz.com'
        });
      
      if (adminInsertError) {
        console.error('Error adding user to admin_users table:', adminInsertError);
        throw adminInsertError;
      }
      
      console.log('Admin user added to admin_users table successfully');
    } else {
      console.log('Admin user already exists in admin_users table');
    }
    
    console.log('Admin user setup completed successfully!');
    console.log('You can now log in with:');
    console.log('Email: admin@handywriterz.com');
    console.log('Password: admin123');
    
    return { success: true };
  } catch (error) {
    console.error('Error in admin user creation process:', error);
    return { success: false, error };
  }
}

// Execute the function if this file is run directly
if (require.main === module) {
  createAdminUser()
    .then(result => {
      if (result.success) {
        console.log('Script completed successfully');
        process.exit(0);
      } else {
        console.error('Script failed:', result.error);
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unhandled error:', err);
      process.exit(1);
    });
}

// Export for use in other files
export { createAdminUser }; 