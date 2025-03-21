import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.development') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  try {
    console.log('Starting database migrations...');

    // Read migration files
    const migration1 = readFileSync(join(__dirname, '..', 'migrations', '01_supabase_auth.sql'), 'utf8');
    const migration2 = readFileSync(join(__dirname, '..', 'migrations', '02_create_admin.sql'), 'utf8');

    // Apply first migration
    console.log('\nApplying migration 1: Supabase auth setup...');
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    if (error1) {
      throw new Error(`Migration 1 failed: ${error1.message}`);
    }
    console.log('Migration 1 completed successfully');

    // Create admin user in Supabase Auth
    console.log('\nCreating admin user in Supabase Auth...');
    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'admin@handywriterz.com';
    const adminPassword = process.env.VITE_ADMIN_PASSWORD || 'Admin123!';

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw new Error(`Admin user creation failed: ${signUpError.message}`);
    }
    
    // Apply second migration
    console.log('\nApplying migration 2: Creating admin account...');
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    if (error2) {
      throw new Error(`Migration 2 failed: ${error2.message}`);
    }
    console.log('Migration 2 completed successfully');

    console.log('\n✅ All migrations completed successfully!');
    console.log('\nAdmin account details:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\nPlease change the admin password after first login.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if the Supabase project is accessible');
    console.log('2. Verify your service role key has necessary permissions');
    console.log('3. Check if the migrations have any syntax errors');
    console.log('4. Try running the migrations manually in the Supabase dashboard');
    process.exit(1);
  }
}

// Run migrations
applyMigrations();
