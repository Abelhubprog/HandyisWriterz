import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.mcp') });

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or anon key in environment variables');
    return false;
  }

  try {
    console.log('Initializing Supabase client...');
    console.log('URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Test auth service
    console.log('\nTesting authentication service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    console.log('Auth service is working');

    // Test database query
    console.log('\nTesting database query...');
    const { data: dbData, error: dbError } = await supabase
      .from('_schema_migrations')
      .select('*')
      .limit(1);
    
    if (dbError) {
      console.log('Trying alternative table query...');
      const { data: altData, error: altError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (altError) throw altError;
    }
    
    console.log('Database query successful');

    // Test storage
    console.log('\nTesting storage service...');
    const { data: buckets, error: storageError } = await supabase
      .storage
      .listBuckets();
    
    if (storageError) throw storageError;
    console.log('Storage service is working');
    console.log('Available buckets:', buckets.map(b => b.name).join(', '));

    console.log('\nAll Supabase services are working correctly!');
    return true;

  } catch (error) {
    console.error('\nConnection test failed:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify your Supabase project is active (not paused)');
    console.log('2. Check if the project URL is correct');
    console.log('3. Ensure your anon key is valid');
    console.log('4. Try accessing the Supabase dashboard');
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then(success => {
    if (!success) {
      console.log('\nPlease check your Supabase project status and credentials.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 