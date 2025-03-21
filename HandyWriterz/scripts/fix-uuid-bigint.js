#!/usr/bin/env node
/**
 * Script to fix UUID vs bigint type mismatch in Supabase
 * 
 * This script runs the migration SQL file to convert tables with bigint IDs to UUID IDs.
 * 
 * Usage:
 *   node scripts/fix-uuid-bigint.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables or use hardcoded values from supabaseClient.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mlcoggqmaayimhpeemef.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sY29nZ3FtYWF5aW1ocGVlbWVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDI0NDE0OSwiZXhwIjoyMDU1ODIwMTQ5fQ.8GRjwqNh2xNeJrRLtuAgfylfTYFHsiKLAHYkEUpURDc';

if (!supabaseUrl) {
  console.error('Error: Missing Supabase URL in environment variables.');
  console.error('Make sure VITE_SUPABASE_URL is set or update the hardcoded value in this script.');
  process.exit(1);
}

console.log(`Using Supabase URL: ${supabaseUrl}`);

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Path to the migration SQL file
const migrationFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20240701_fix_uuid_bigint.sql');

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Running migration to fix UUID vs bigint type mismatch...');
    
    // Execute the SQL using Supabase's rpc function
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Error running migration:', error.message);
      
      // Try alternative approach if rpc method fails
      console.log('Trying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      // Execute each statement separately
      for (const stmt of statements) {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        if (error) {
          console.error('Error executing statement:', error.message);
          console.error('Statement:', stmt);
        }
      }
      
      console.log('Migration completed with some errors. Please check your database.');
    } else {
      console.log('Migration completed successfully!');
    }
    
    console.log('\nNext steps:');
    console.log('1. Verify that your tables are using UUID IDs instead of bigint');
    console.log('2. Update your application code to handle UUID IDs');
    console.log('3. Once everything is working, you can drop the old tables');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Check if the exec_sql function exists, and create it if it doesn't
async function ensureExecSqlFunction() {
  try {
    console.log('Checking if exec_sql function exists...');
    
    // Try to call the function to see if it exists
    const { error } = await supabase.rpc('exec_sql_exists');
    
    if (error) {
      console.log('Creating exec_sql function...');
      
      // Create the exec_sql function
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION exec_sql(sql text) RETURNS void AS $$
        BEGIN
          EXECUTE sql;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        CREATE OR REPLACE FUNCTION exec_sql_exists() RETURNS boolean AS $$
        BEGIN
          RETURN TRUE;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      // Execute the SQL directly using the REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: createFunctionSQL })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create exec_sql function: ${JSON.stringify(errorData)}`);
      }
      
      console.log('exec_sql function created successfully.');
    } else {
      console.log('exec_sql function already exists.');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting up exec_sql function:', error.message);
    console.log('\nYou may need to run the migration manually:');
    console.log('1. Connect to your Supabase database using psql or the SQL editor in the Supabase dashboard');
    console.log(`2. Run the SQL in the file: ${migrationFilePath}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting UUID vs bigint fix script...');
  
  const canProceed = await ensureExecSqlFunction();
  
  if (canProceed) {
    await runMigration();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 