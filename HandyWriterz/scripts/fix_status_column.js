// Simple script to fix the views table issue directly using the Supabase client
const { createClient } = require('@supabase/supabase-js');

// Fallback values from the project
const SUPABASE_URL = 'https://thvgjcnrlfofioagjydk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmdqY25ybGZvZmlvYWdqeWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNjYzMDAsImV4cCI6MjA1Njg0MjMwMH0.OmWI-itN_xok_fKFxfID1ew7sKO843-jsylapBCqvvg';

async function fixViewsTable() {
  try {
    console.log('Connecting to Supabase...');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
    );

    // Check if user is authenticated with sufficient privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error. Please sign in first with sufficient privileges.');
      return;
    }

    console.log('Authenticated as:', user.email);

    // Execute SQL via RPC
    console.log('Attempting to create or fix views table...');
    
    // Step 1: Check if the table exists
    const { data: tableExists, error: checkError } = await supabase.rpc('check_table_exists', { 
      table_name: 'views' 
    });
    
    if (checkError) {
      // If the check_table_exists function doesn't exist, we'll try a direct SQL approach
      console.log('Could not check table existence through RPC, trying direct SQL fix...');
      
      try {
        // First, try to get some data which will tell us if the table exists
        const { data: viewsData, error: viewsError } = await supabase
          .from('views')
          .select('id')
          .limit(1);
        
        if (viewsError && viewsError.code === '42P01') {
          // Table doesn't exist, we'll need to tell the user to run the proper migration
          console.error('The views table does not exist. Please run the full database migrations first.');
        } else {
          // Table exists but might be missing the status column, let's try to add it
          console.log('Attempting to add status column to existing views table...');
          
          // Execute the modification through the dashboard UI or SQL editor
          console.log('This script cannot directly modify table schema. Please:');
          console.log('1. Go to your Supabase dashboard');
          console.log('2. Open the SQL Editor');
          console.log('3. Run the following SQL:');
          console.log('\nALTER TABLE public.views ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'active\';\n');
        }
      } catch (sqlError) {
        console.error('Error running SQL commands:', sqlError);
      }
    } else if (tableExists) {
      console.log('Views table exists, checking for status column...');
      
      // Step 2: Check if status column exists
      const { data: columnExists, error: columnError } = await supabase.rpc('check_column_exists', {
        table_name: 'views',
        column_name: 'status'
      });
      
      if (columnError) {
        console.error('Error checking for status column:', columnError);
      } else if (!columnExists) {
        console.log('Status column missing, adding it...');
        
        // Step 3: Add the column
        const { error: alterError } = await supabase.rpc('execute_sql', {
          sql: 'ALTER TABLE public.views ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'active\';'
        });
        
        if (alterError) {
          console.error('Failed to add status column:', alterError);
          console.log('Please run this SQL manually in the Supabase SQL Editor:');
          console.log('\nALTER TABLE public.views ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'active\';\n');
        } else {
          console.log('✅ Status column added successfully!');
        }
      } else {
        console.log('✅ Status column already exists!');
      }
    } else {
      console.log('Views table does not exist, it needs to be created with migrations.');
      console.log('Please run the database migrations first.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixViewsTable(); 