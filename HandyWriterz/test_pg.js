import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import postgres from 'postgres';
import dns from 'dns/promises';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.mcp') });

async function testConnection() {
  try {
    console.log('Checking available environment variables...');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error('Missing required Supabase configuration');
    }

    console.log('\nTesting Supabase client connection...');
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Test authentication
    console.log('Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError.message);
    } else {
      console.log('Authentication successful');
    }

    // Test database query using Supabase client
    console.log('\nTesting database query...');
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Query error:', error.message);
    } else {
      console.log('Query successful');
      console.log('Data:', data);
    }

    // Test direct connection using pooler URL
    console.log('\nTesting direct PostgreSQL connection...');
    const sql = postgres(`postgresql://${process.env.SUPABASE_DB_USER}:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:${process.env.SUPABASE_DB_PORT}/${process.env.SUPABASE_DB_NAME}?options=project%3D${process.env.SUPABASE_PROJECT_REF}`, {
      ssl: { rejectUnauthorized: true },
      connection: {
        application_name: 'handywriterz_test'
      },
      idle_timeout: 20,
      connect_timeout: 30
    });

    const result = await sql`SELECT current_database() as database, current_user as user;`;
    console.log('Direct connection successful:', result[0]);

    await sql.end();
    
    console.log('\n✅ All connection tests completed successfully');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Verify Supabase project is running');
    console.log('2. Check network connectivity');
    console.log('3. Verify environment variables');
    console.log('4. Try using the Supabase dashboard to test connections');
    console.log('\nDebug information:');
    console.log('Node.js version:', process.version);
    console.log('Error details:', err);
  }
}

testConnection();