import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.mcp') });

// Supabase configuration
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Testing Supabase Pro connection...');
console.log('Project URL:', supabaseUrl);
console.log('Environment variables loaded:');
console.log('- SUPABASE_PROJECT_REF:', process.env.SUPABASE_PROJECT_REF ? '✓' : '✗');
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓' : '✗');
console.log('- SUPABASE_DB_HOST:', process.env.SUPABASE_DB_HOST ? '✓' : '✗');

// Create Supabase client with Pro configuration
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-client-info': 'supabase-test-script' }
  }
});

// Helper function to add timeout to promises
const withTimeout = (promise, ms, operation) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
};

async function testConnection() {
  try {
    // Test auth service
    console.log('\nTesting auth service...');
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.getSession(),
      10000,
      'Auth service check'
    );
    
    if (authError) {
      console.error('Auth service error:', authError);
    } else {
      console.log('✓ Auth service is working');
    }

    // Test REST API first
    console.log('\nTesting REST API access...');
    try {
      const response = await fetch(`https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/rest/v1/`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'X-Client-Info': 'supabase-test-script'
        }
      });
      
      if (!response.ok) {
        console.error('REST API check failed:', response.status, response.statusText);
        const text = await response.text();
        console.error('Response:', text);
      } else {
        console.log('✓ REST API is accessible');
      }
    } catch (apiErr) {
      console.error('API check error:', apiErr);
    }

    // Test basic database query
    console.log('\nTesting database connection...');
    try {
      // Simple query to check database access
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id')
          .limit(1),
        20000,
        'Database query'
      );

      if (error) {
        console.error('Database query error:', error);
        
        // If table doesn't exist, try creating it
        if (error.code === '42P01') {
          console.log('Profiles table does not exist, attempting to create...');
          const { error: createError } = await withTimeout(
            supabase.rpc('create_profiles_table'),
            20000,
            'Create table'
          );
          
          if (createError) {
            console.error('Failed to create table:', createError);
          } else {
            console.log('✓ Created profiles table successfully');
          }
        }
      } else {
        console.log('✓ Database query successful');
      }

      // Test storage service
      console.log('\nTesting storage service...');
      const { data: buckets, error: storageError } = await withTimeout(
        supabase.storage.listBuckets(),
        10000,
        'Storage check'
      );

      if (storageError) {
        console.error('Storage service error:', storageError);
      } else {
        console.log('✓ Storage service is working');
        if (buckets.length > 0) {
          console.log(`  Found ${buckets.length} bucket(s):`);
          buckets.forEach(bucket => console.log(`  - ${bucket.name}`));
        } else {
          console.log('  No storage buckets found');
        }
      }

    } catch (dbErr) {
      console.error('Database connection error:', dbErr);
    }

    // Print connection details
    console.log('\nConnection Details:');
    console.log('- Project Ref:', process.env.SUPABASE_PROJECT_REF);
    console.log('- Database Host:', process.env.SUPABASE_DB_HOST);
    console.log('- Database Port:', process.env.SUPABASE_DB_PORT);
    console.log('- Database Name:', process.env.SUPABASE_DB_NAME);
    console.log('- Database User:', process.env.SUPABASE_DB_USER);
    console.log('- SSL Mode:', process.env.SUPABASE_DB_SSL_MODE);

  } catch (err) {
    console.error('\nUnexpected error:', err);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
  }
}

// Run the test
console.log('Starting Pro plan connection tests...\n');
testConnection()
  .then(() => {
    console.log('\nTests completed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nTest failed:', err);
    process.exit(1);
  }); 