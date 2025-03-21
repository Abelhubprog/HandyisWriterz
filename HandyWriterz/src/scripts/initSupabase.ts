/**
 * Supabase Database Initialization Script
 * 
 * This script initializes the Supabase database with required tables and policies.
 * Run this script once to set up your database structure.
 */

import { initializeDatabase, applyPolicies } from '../lib/initDatabase';
import { supabase, adminSupabase } from '../lib/supabaseClient';

async function main() {
  console.log('Starting Supabase database initialization...');
  
  try {
    // Check connection
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        console.log('Profiles table does not exist yet. Will create it.');
      } else {
        console.error('Error connecting to Supabase:', error);
        throw error;
      }
    } else {
      console.log('Successfully connected to Supabase.');
    }
    
    // Initialize database
    await initializeDatabase();
    
    // Apply policies
    await applyPolicies();
    
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