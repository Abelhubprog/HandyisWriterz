const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://mlcoggqmaayimhpeemef.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sY29nZ3FtYWF5aW1ocGVlbWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI0NDE0OSwiZXhwIjoyMDU1ODIwMTQ5fQ.8GRjwqNh2xNeJrRLtuAgfylfTYFHsiKLAHYkEUpURDc';

// Create Supabase admin client
const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Add debug function
function debug(message, data = null) {
  console.log(`[DEBUG] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

/**
 * Script to add an admin user to the admin_users table using direct SQL
 */
async function addAdminUserWithSQL() {
  try {
    console.log('Starting admin user SQL creation process...');
    debug('Using Supabase URL:', supabaseUrl);
    
    // First check if admin_users table exists
    debug('Checking if admin_users table exists...');
    try {
      const { data: tableData, error: tableError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'admin_users'
          );
        `
      });
      
      if (tableError) {
        console.error('Error checking if admin_users table exists:', tableError);
        throw tableError;
      }
      
      debug('Table check result:', tableData);
      
      if (!tableData || !tableData[0] || !tableData[0].exists) {
        console.error('admin_users table does not exist! Creating it...');
        
        const { error: createTableError } = await adminSupabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS admin_users (
              id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
              email VARCHAR UNIQUE NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            -- Enable RLS
            ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
            
            -- Create policies
            CREATE POLICY "Allow public read access"
                ON admin_users
                FOR SELECT
                USING (true);
            
            CREATE POLICY "Allow admin insert/update"
                ON admin_users
                FOR ALL
                USING (auth.uid() IN (SELECT id FROM admin_users));
          `
        });
        
        if (createTableError) {
          console.error('Error creating admin_users table:', createTableError);
          throw createTableError;
        }
        
        console.log('admin_users table created successfully');
      } else {
        console.log('admin_users table exists');
      }
    } catch (tableCheckErr) {
      console.error('Error during table check:', tableCheckErr);
      // Continue anyway
    }
    
    // First, get the user ID from auth.users
    debug('Checking if admin user exists in auth.users...');
    const { data: userData, error: userError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        SELECT id FROM auth.users 
        WHERE email = 'admin@handywriterz.com' 
        LIMIT 1;
      `
    });
    
    if (userError) {
      console.error('Error getting user ID:', userError);
      throw userError;
    }
    
    debug('User check result:', userData);
    
    let userId;
    
    if (!userData || userData.length === 0) {
      console.log('Admin user not found in auth.users table');
      console.log('Creating admin user in auth.users table...');
      
      // Create the user in auth.users
      const { data: createUserData, error: createUserError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          INSERT INTO auth.users (
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud,
            confirmed_at
          ) VALUES (
            'admin@handywriterz.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Admin User", "role": "admin"}',
            now(),
            now(),
            'authenticated',
            'authenticated',
            now()
          ) RETURNING id;
        `
      });
      
      if (createUserError) {
        console.error('Error creating admin user:', createUserError);
        debug('Create user error details:', createUserError);
        throw createUserError;
      }
      
      debug('Create user result:', createUserData);
      console.log('Admin user created in auth.users table');
      
      // Get the newly created user ID
      const { data: newUserData, error: newUserError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          SELECT id FROM auth.users 
          WHERE email = 'admin@handywriterz.com' 
          LIMIT 1;
        `
      });
      
      if (newUserError || !newUserData || newUserData.length === 0) {
        console.error('Error getting new user ID:', newUserError);
        debug('New user query error details:', newUserError);
        throw newUserError || new Error('User created but ID not found');
      }
      
      userId = newUserData[0].id;
      console.log('Admin user ID:', userId);
      
      // Create profile for the admin user
      debug('Creating profile for admin user...');
      const { error: profileError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            created_at,
            updated_at
          ) VALUES (
            '${userId}',
            'admin@handywriterz.com',
            'Admin User',
            'admin',
            now(),
            now()
          ) ON CONFLICT (id) DO NOTHING;
        `
      });
      
      if (profileError) {
        console.error('Error creating admin profile:', profileError);
        debug('Profile creation error details:', profileError);
        throw profileError;
      }
      
      console.log('Admin profile created successfully');
    } else {
      userId = userData[0].id;
      console.log('Admin user found with ID:', userId);
    }
    
    // Check if user exists in admin_users table
    debug('Checking if admin user exists in admin_users table...');
    const { data: adminData, error: adminCheckError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        SELECT id FROM public.admin_users 
        WHERE id = '${userId}' 
        LIMIT 1;
      `
    });
    
    if (adminCheckError) {
      console.error('Error checking admin_users table:', adminCheckError);
      debug('Admin check error details:', adminCheckError);
      throw adminCheckError;
    }
    
    debug('Admin check result:', adminData);
    
    if (!adminData || adminData.length === 0) {
      console.log('Admin user not found in admin_users table. Adding...');
      
      // Add the user to admin_users table
      debug('Adding user to admin_users table...');
      const { error: adminInsertError } = await adminSupabase.rpc('exec_sql', {
        sql: `
          INSERT INTO public.admin_users (
            id,
            email,
            created_at,
            updated_at
          ) VALUES (
            '${userId}',
            'admin@handywriterz.com',
            now(),
            now()
          ) ON CONFLICT (id) DO NOTHING;
        `
      });
      
      if (adminInsertError) {
        console.error('Error adding user to admin_users table:', adminInsertError);
        debug('Admin insert error details:', adminInsertError);
        
        // Try a simpler insert as a fallback
        console.log('Trying simplified insert...');
        try {
          const { error: simpleInsertError } = await adminSupabase
            .from('admin_users')
            .insert({
              id: userId,
              email: 'admin@handywriterz.com'
            });
            
          if (simpleInsertError) {
            console.error('Error with simplified insert:', simpleInsertError);
            debug('Simple insert error details:', simpleInsertError);
            throw simpleInsertError;
          }
        } catch (simpleErr) {
          console.error('Exception during simplified insert:', simpleErr);
          throw adminInsertError;
        }
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
    console.error('Error in admin user SQL creation process:', error);
    debug('Full error details:', error);
    return { success: false, error };
  }
}

// Execute the function
addAdminUserWithSQL()
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