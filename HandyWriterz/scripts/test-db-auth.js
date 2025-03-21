#!/usr/bin/env node
/**
 * Script to test Supabase database connection with authentication
 * 
 * This script tests the connection to your Supabase database using your API keys.
 * 
 * Usage:
 *   node scripts/test-db-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables or use hardcoded values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlcoggqmaayimhpeemef.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sY29nZ3FtYWF5aW1ocGVlbWVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAyNDQxNDksImV4cCI6MjA1NTgyMDE0OX0._P3FTQCvxHCk3BlU-SajETrsNk3L9NfuqLobWthy7Pg';

console.log('Testing Supabase database connection with authentication');
console.log(`Using Supabase URL: ${supabaseUrl}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('\nTesting API connectivity...');
    
    // Test 1: Check if we can connect to the API
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('❌ Auth API check failed:', error.message);
      } else {
        console.log('✅ Auth API connection successful');
      }
    } catch (err) {
      console.log('❌ Auth API connection failed:', err.message);
    }
    
    // Test 2: Try to query a simple system table
    console.log('\nTesting database query...');
    try {
      const { data, error } = await supabase
        .from('_prisma_migrations')
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ No rows found in _prisma_migrations table, but connection works');
        } else if (error.code === '42P01') {
          console.log('⚠️ Table _prisma_migrations does not exist, trying another table...');
        } else {
          console.log('❌ Database query failed:', error.message, error.code);
        }
      } else {
        console.log('✅ Database query successful');
        console.log(`   Found ${data.length} rows`);
      }
    } catch (err) {
      console.log('❌ Database query failed with exception:', err.message);
    }
    
    // Test 3: Try to query the profiles table
    console.log('\nTesting profiles table query...');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ No rows found in profiles table, but connection works');
        } else if (error.code === '42P01') {
          console.log('❌ Table profiles does not exist');
        } else {
          console.log('❌ Profiles query failed:', error.message, error.code);
        }
      } else {
        console.log('✅ Profiles table query successful');
        console.log(`   Count: ${data.count || 0}`);
      }
    } catch (err) {
      console.log('❌ Profiles query failed with exception:', err.message);
    }
    
    // Test 4: Try to query the posts table
    console.log('\nTesting posts table query...');
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ No rows found in posts table, but connection works');
        } else if (error.code === '42P01') {
          console.log('❌ Table posts does not exist');
        } else {
          console.log('❌ Posts query failed:', error.message, error.code);
        }
      } else {
        console.log('✅ Posts table query successful');
        console.log(`   Count: ${data.count || 0}`);
      }
    } catch (err) {
      console.log('❌ Posts query failed with exception:', err.message);
    }
    
    // Test 5: Check for RLS policies
    console.log('\nChecking for RLS policies...');
    try {
      // This query requires service role key, so it might fail with anon key
      const { data, error } = await supabase
        .rpc('get_policies');
      
      if (error) {
        if (error.message.includes('function') && error.message.includes('does not exist')) {
          console.log('⚠️ get_policies function does not exist (this is normal)');
        } else {
          console.log('⚠️ Could not check RLS policies:', error.message);
        }
      } else if (data) {
        console.log('✅ RLS policies check successful');
        console.log(`   Found ${data.length} policies`);
      }
    } catch (err) {
      console.log('⚠️ RLS policies check failed:', err.message);
    }
    
    console.log('\nConnection test complete.');
    
  } catch (error) {
    console.error('Error testing connection:', error.message);
  }
}

// Create a helper RPC function to get policies if it doesn't exist
async function createHelperFunctions() {
  try {
    const { data, error } = await supabase.rpc('create_helper_functions');
    
    if (error && !error.message.includes('does not exist')) {
      console.log('Failed to create helper functions:', error.message);
    }
  } catch (err) {
    // Ignore errors here
  }
}

// Run the tests
createHelperFunctions()
  .then(() => testConnection())
  .catch(err => console.error('Unhandled error:', err.message)); 