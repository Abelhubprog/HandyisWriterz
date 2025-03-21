import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.mcp') });

const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Attempting to wake up database...');
console.log('Project URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to add timeout to promises
async function withTimeout(promise, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      promise,
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        });
      })
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Simple function to retry with delay
async function retryWithDelay(fn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`\nAttempt ${i + 1}/${retries}...`);
      const result = await fn();
      console.log('Success!');
      return result;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`Waiting ${delay/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('All retry attempts failed');
}

async function wakeDatabase() {
  try {
    // Try a series of increasingly complex queries
    await retryWithDelay(async () => {
      try {
        // First try a simple system table query
        console.log('Trying system table query...');
        const { data: sysData, error: sysError } = await withTimeout(
          supabase.from('pg_stat_database').select('count').limit(1)
        );

        if (!sysError) {
          return sysData;
        }

        // If that fails, try creating and using a simple function
        console.log('Trying RPC call...');
        const { data, error } = await withTimeout(
          supabase.rpc('get_timestamp')
        );

        if (error) {
          if (error.message?.includes('function does not exist')) {
            console.log('\nTimestamp function not found. Please run this SQL in the Supabase dashboard:');
            console.log(`
              create or replace function get_timestamp()
              returns timestamptz as $$
              begin
                return current_timestamp;
              end;
              $$ language plpgsql;
            `);
            
            // Try a simple table query instead
            console.log('Trying profiles table query...');
            const { data: tableData, error: tableError } = await withTimeout(
              supabase.from('profiles').select('count').limit(1)
            );
            
            if (tableError && tableError.code === '42P01') {
              console.log('Note: Profiles table does not exist yet (this is okay)');
              return null;
            } else if (tableError) {
              throw tableError;
            }
            return tableData;
          }
          throw error;
        }
        return data;
      } catch (error) {
        if (error.message.includes('timeout')) {
          throw new Error('Database connection timed out. The database might be in sleep mode.');
        }
        throw error;
      }
    });

    console.log('\n✅ Database appears to be responding!');
    console.log('\nNext steps:');
    console.log('1. Try accessing your project in the Supabase dashboard');
    console.log('2. Run a simple query in the SQL editor');
    console.log('3. Check if you can access the database through your application');
    
  } catch (err) {
    console.error('\n❌ Failed to wake up database:', err.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if your project is paused in the Supabase dashboard');
    console.log('2. Verify your project URL:', supabaseUrl);
    console.log('3. Verify your service role key is correct');
    console.log('4. Try manually resuming the database from the dashboard');
    console.log('5. If the issue persists, contact Supabase support');
  }
}

// Run wake up sequence
wakeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 