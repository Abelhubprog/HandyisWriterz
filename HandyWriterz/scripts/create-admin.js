#!/usr/bin/env node
/**
 * Admin User Creation Script
 * 
 * This script creates an admin user in the Supabase database.
 * It can be run from the command line with:
 * node scripts/create-admin.js
 * 
 * Environment variables:
 * - SUPABASE_URL: The URL of your Supabase project
 * - SUPABASE_ANON_KEY: The anonymous key for your Supabase project
 * - ADMIN_EMAIL: The email for the admin user (default: admin@handywriterz.com)
 * - ADMIN_PASSWORD: The password for the admin user (default: Admin@123!)
 * - ADMIN_NAME: The name for the admin user (default: Super Admin)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@handywriterz.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123!';
const adminName = process.env.ADMIN_NAME || 'Super Admin';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  console.log('Starting admin user creation process...');
  console.log(`Using Supabase URL: ${supabaseUrl}`);
  
  try {
    // Check if admin user already exists
    console.log('Checking if admin user already exists...');
    const { data: existingAdmin, error: checkError } = await supabase.rpc(
      'is_admin_email_exists',
      { email: adminEmail }
    );
    
    if (checkError) {
      // If the RPC function doesn't exist, try a direct query
      const { data: adminUsers, error: queryError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', adminEmail);
      
      if (queryError) {
        console.error('Error checking for existing admin:', queryError.message);
      } else if (adminUsers && adminUsers.length > 0) {
        console.log(`Admin user with email ${adminEmail} already exists!`);
        return;
      }
    } else if (existingAdmin) {
      console.log(`Admin user with email ${adminEmail} already exists!`);
      return;
    }
    
    // Create admin user using the RPC function
    console.log('Creating admin user...');
    const { data: adminId, error: createError } = await supabase.rpc(
      'create_first_super_admin',
      {
        admin_email: adminEmail,
        admin_password: adminPassword,
        admin_name: adminName
      }
    );
    
    if (createError) {
      throw new Error(`Error creating admin user: ${createError.message}`);
    }
    
    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Admin ID: ${adminId}`);
    console.log('You can now log in with these credentials at /admin/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

// Run the function
createAdminUser()
  .then(() => {
    console.log('Script finished executing');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 