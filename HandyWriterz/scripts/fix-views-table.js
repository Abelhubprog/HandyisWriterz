// Script to fix the views table by adding the missing status column
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with admin rights from environment variables
const main = async () => {
  try {
    // Load environment variables
    let supabaseUrl = process.env.VITE_SUPABASE_URL;
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Fallback to hardcoded URLs from the project if environment variables are not set
    // NOTE: This is not secure for production, but helpful for development
    if (!supabaseUrl) {
      supabaseUrl = 'https://thvgjcnrlfofioagjydk.supabase.co';
      console.log('Using fallback Supabase URL');
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is required. Set this environment variable before running the script.');
      process.exit(1);
    }

    console.log('Connecting to Supabase...');
    // Create a Supabase client with the service role key for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '..', 'migrations', '03_fix_views_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL migration...');
    const { error } = await supabase.rpc('pgmoon.query', { query: sql });

    if (error) {
      console.error('Error executing SQL migration:', error);
      process.exit(1);
    }

    console.log('Migration completed successfully!');

    // Check if the views table exists and has the status column
    const { data, error: tableError } = await supabase.rpc('pgmoon.query', { 
      query: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'views'
        AND column_name = 'status'
      `
    });

    if (tableError) {
      console.error('Error checking table status:', tableError);
    } else {
      if (data && data.length > 0) {
        console.log('✅ Table "views" exists with "status" column');
      } else {
        console.log('❌ Table "views" still missing "status" column - check for errors');
      }
    }

  } catch (err) {
    console.error('Unhandled error:', err);
    process.exit(1);
  }
};

main(); 