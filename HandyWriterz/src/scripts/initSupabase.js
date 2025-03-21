/**
 * Supabase Database Initialization Script
 * 
 * This script initializes the Supabase database with required tables and policies.
 * Run this script once to set up your database structure.
 */

// Use ES Module imports instead of CommonJS require
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('Loading environment variables...');

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env and .env.local files
dotenv.config();

// Try to load from .env.local if it exists
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log(`.env.local file found at ${envLocalPath}`);
  dotenv.config({ path: envLocalPath });
} else {
  console.warn(`.env.local file not found at ${envLocalPath}`);
}

// Print available env vars for debugging (sanitized)
console.log('Environment variables loaded:');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '[DEFINED]' : '[NOT DEFINED]');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '[DEFINED]' : '[NOT DEFINED]');
console.log('- VITE_SUPABASE_SERVICE_ROLE_KEY:', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '[DEFINED]' : '[NOT DEFINED]');
console.log('- VITE_ADMIN_EMAIL:', process.env.VITE_ADMIN_EMAIL ? '[DEFINED]' : '[NOT DEFINED]');

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlcoggqmaayimhpeemef.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sY29nZ3FtYWF5aW1ocGVlbWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDQxNDksImV4cCI6MjA1NTgyMDE0OX0._P3FTQCvxHCk3BlU-SajETrsNk3L9NfuqLobWthy7Pg';
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sY29nZ3FtYWF5aW1ocGVlbWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI0NDE0OSwiZXhwIjoyMDU1ODIwMTQ5fQ.8GRjwqNh2xNeJrRLtuAgfylfTYFHsiKLAHYkEUpURDc';

console.log(`Using Supabase URL: ${supabaseUrl}`);

// Create clients with more detailed options
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'initSupabase.js'
    }
  }
};

// Create clients
console.log('Creating Supabase clients...');
const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);
const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, supabaseOptions);

// User roles
const userRoles = {
  admin: 'admin',
  user: 'user',
  editor: 'editor'
};

// Define required tables with their structure
const requiredTables = {
  profiles: {
    id: 'uuid primary key references auth.users(id)',
    username: 'text unique',
    full_name: 'text',
    avatar_url: 'text',
    website: 'text',
    bio: 'text',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()',
    role: `text default '${userRoles.user}'`,
    email: 'text',
    preferences: 'jsonb default \'{}\''
  },
  admin_users: {
    id: 'uuid primary key references auth.users(id)',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()',
    email: 'text'
  }
};

// Define policies
const policies = {
  profiles_admin: `CREATE POLICY "Allow full access for admins" ON profiles
    FOR ALL
    TO authenticated
    USING (role = '${userRoles.admin}')
    WITH CHECK (role = '${userRoles.admin}');`,
  
  profiles_user: `CREATE POLICY "Allow users to read all profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (true);`,
  
  profiles_user_update: `CREATE POLICY "Allow users to update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);`,
  
  admin_users_admin: `CREATE POLICY "Allow admins to manage admin_users" ON admin_users
    FOR ALL
    TO authenticated
    USING (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = '${userRoles.admin}'
    ));`
};

// Check if a table exists
async function tableExists(tableName) {
  try {
    console.log(`Checking if table '${tableName}' exists...`);
    
    // Use direct query with error handling
    const { error } = await supabase
      .from(tableName)
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    if (!error) {
      console.log(`Table '${tableName}' exists.`);
      return true;
    }
    
    if (error.code === '42P01') { // Table does not exist
      console.log(`Table '${tableName}' does not exist.`);
      return false;
    }
    
    console.error(`Error checking if table '${tableName}' exists:`, error);
    return false;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Create a table if it doesn't exist
async function createTableIfNotExists(tableName, fields) {
  try {
    const exists = await tableExists(tableName);
    
    if (!exists) {
      console.log(`Creating table: ${tableName}`);
      
      const fieldDefinitions = Object.entries(fields)
        .map(([name, type]) => `${name} ${type}`)
        .join(', ');
      
      const sql = `CREATE TABLE ${tableName} (${fieldDefinitions});`;
      console.log(`Executing SQL: ${sql}`);
      
      // Use raw REST API or fetch to execute SQL instead of RPC
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'apikey': supabaseAnonKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: sql
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error creating table: ${errorText}`);
        throw new Error(`Failed to create table: ${errorText}`);
      }
      
      console.log(`Table ${tableName} created successfully.`);
    } else {
      console.log(`Table ${tableName} already exists.`);
    }
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
}

// Apply policies using direct SQL in a separate function
async function executeSQL(sql) {
  try {
    console.log(`Executing SQL: ${sql}`);
    
    // Use Supabase REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'apikey': supabaseAnonKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SQL execution error: ${errorText}`);
      throw new Error(`SQL execution failed: ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

// Apply policies
async function applyPolicies() {
  try {
    console.log('Applying database policies...');
    
    // Enable RLS on tables
    console.log('Enabling Row Level Security...');
    await executeSQL(`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
                    ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;`);
    
    // Apply each policy
    for (const [name, policy] of Object.entries(policies)) {
      try {
        console.log(`Applying policy: ${name}`);
        await executeSQL(policy);
        console.log(`Applied policy: ${name}`);
      } catch (error) {
        console.error(`Error applying policy ${name}:`, error);
      }
    }
    
    console.log('Policies applied successfully');
  } catch (error) {
    console.error('Error applying policies:', error);
  }
}

// Add an admin user
async function addAdminUser(email) {
  try {
    console.log(`Checking if user with email ${email} exists...`);
    
    // Check if user exists
    const { data: users, error: userError } = await adminSupabase
      .from('auth.users')
      .select('id')
      .eq('email', email);
    
    if (userError) {
      console.error('Error checking if user exists:', userError);
      throw userError;
    }
    
    if (users && users.length > 0) {
      const userId = users[0].id;
      console.log(`User found with ID: ${userId}`);
      
      // Check if already in admin_users
      const { data: adminUsers, error: adminError } = await adminSupabase
        .from('admin_users')
        .select('id')
        .eq('id', userId);
      
      if (adminError) {
        console.error('Error checking if user is admin:', adminError);
        throw adminError;
      }
      
      if (!adminUsers || adminUsers.length === 0) {
        console.log(`Adding user ${email} to admin_users table...`);
        
        // Add to admin_users
        const { error: insertError } = await adminSupabase
          .from('admin_users')
          .insert({ id: userId, email });
        
        if (insertError) {
          console.error('Error adding user to admin_users:', insertError);
          throw insertError;
        }
        
        console.log(`Updating user profile to set role to admin...`);
        
        // Update profile role
        const { error: updateError } = await adminSupabase
          .from('profiles')
          .update({ role: userRoles.admin })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating user role:', updateError);
          throw updateError;
        }
        
        console.log(`Added admin user: ${email}`);
      } else {
        console.log(`User ${email} is already an admin.`);
      }
    } else {
      console.log(`User ${email} not found. They will be made admin upon signup.`);
    }
  } catch (error) {
    console.error(`Error adding admin user ${email}:`, error);
  }
}

// Check if all required tables exist
async function checkTablesExist() {
  console.log('Checking if all required tables exist...');
  for (const tableName of Object.keys(requiredTables)) {
    const exists = await tableExists(tableName);
    if (!exists) {
      console.log(`Table ${tableName} does not exist. Need to create tables.`);
      return false;
    }
  }
  console.log('All required tables exist.');
  return true;
}

// Create all required tables
async function createTables() {
  console.log('Creating required tables...');
  for (const [tableName, fields] of Object.entries(requiredTables)) {
    await createTableIfNotExists(tableName, fields);
  }
  console.log('All required tables created successfully.');
}

// Seed initial data
async function seedInitialData() {
  try {
    console.log('Seeding initial data...');
    
    // Add admin user if specified in environment variables
    const adminEmail = process.env.VITE_ADMIN_EMAIL;
    if (adminEmail) {
      console.log(`Adding admin user: ${adminEmail}`);
      await addAdminUser(adminEmail);
    } else {
      console.warn('No admin email specified in environment variables. Skipping admin user creation.');
    }
    
    console.log('Initial data seeding complete.');
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

// Main initialization function
async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Check if tables exist
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      // Create tables
      await createTables();
      
      // Apply policies
      await applyPolicies();
      
      // Seed initial data if needed
      await seedInitialData();
    } else {
      console.log('All required tables already exist.');
      
      // Even if tables exist, ensure policies are applied
      await applyPolicies();
      
      // And ensure admin user is added
      await seedInitialData();
    }
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Main function
async function main() {
  console.log('Starting Supabase database initialization...');
  
  try {
    // Test connection with a simple query
    console.log('Testing connection to Supabase...');
    
    // Use a simpler query to test connection - just rpc status
    const { error: connectionError } = await supabase.rpc('get_service_status');
    
    if (connectionError) {
      // Try a different approach - just check auth configuration
      console.log('Trying fallback connection test...');
      const { error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('Error connecting to Supabase:', authError);
        throw authError;
      }
      
      console.log('Connected to Supabase auth service successfully.');
    } else {
      console.log('Connected to Supabase service successfully.');
    }
    
    // Initialize database
    await initializeDatabase();
    
    console.log('Database initialization completed successfully!');
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 