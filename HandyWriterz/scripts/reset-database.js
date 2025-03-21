import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

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

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function confirmReset() {
  return new Promise((resolve) => {
    rl.question('\n⚠️  WARNING: This will delete all data in the database. Are you sure? (yes/no) ', (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function resetDatabase() {
  try {
    console.log('Database Reset Utility');
    console.log('=====================\n');

    const confirmed = await confirmReset();
    if (!confirmed) {
      console.log('\nDatabase reset cancelled.');
      process.exit(0);
    }

    console.log('\nStarting database reset...');
    console.log('Waiting 5 seconds before proceeding...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Drop all tables and recreate schema
    console.log('\n1. Resetting database schema...');
    const dropSchema = `
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSchema });
    if (dropError) {
      throw new Error(`Failed to reset database: ${dropError.message}`);
    }
    console.log('✓ Schema reset complete');

    // Read and apply migrations
    console.log('\n2. Applying migrations...');
    
    // First migration - Auth setup
    console.log('  - Applying 01_supabase_auth.sql');
    const migration1 = readFileSync(join(__dirname, '..', 'migrations', '01_supabase_auth.sql'), 'utf8');
    const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });
    if (error1) throw new Error(`Migration 1 failed: ${error1.message}`);
    console.log('  ✓ Auth setup complete');

    // Second migration - Admin setup
    console.log('  - Applying 02_create_admin.sql');
    const migration2 = readFileSync(join(__dirname, '..', 'migrations', '02_create_admin.sql'), 'utf8');
    const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });
    if (error2) throw new Error(`Migration 2 failed: ${error2.message}`);
    console.log('  ✓ Admin setup complete');

    // Create admin user
    console.log('\n3. Creating admin user...');
    const adminEmail = process.env.VITE_ADMIN_EMAIL || 'admin@handywriterz.com';
    const adminPassword = process.env.VITE_ADMIN_PASSWORD || 'Admin123!';

    const { error: signUpError } = await supabase.auth.signUp({
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
    console.log('✓ Admin user created/verified');

    console.log('\n✅ Database reset completed successfully!');
    console.log('\nAdmin account details:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\nIMPORTANT: Change the admin password after first login.');

  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Check if your Supabase project is accessible');
    console.log('2. Verify your service role key has necessary permissions');
    console.log('3. Try running the reset manually in the Supabase dashboard');
    console.log('4. Check the migration files for syntax errors');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run reset
resetDatabase();
