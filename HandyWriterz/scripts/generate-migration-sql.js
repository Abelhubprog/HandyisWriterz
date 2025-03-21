#!/usr/bin/env node
/**
 * Script to generate the SQL migration for fixing UUID vs bigint type mismatch
 * 
 * This script reads the migration SQL file and outputs it to the console,
 * so you can copy and paste it into the Supabase SQL editor.
 * 
 * Usage:
 *   node scripts/generate-migration-sql.js
 */

const fs = require('fs');
const path = require('path');

// Path to the migration SQL file
const migrationFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20240701_fix_uuid_bigint.sql');

try {
  console.log('Reading migration file...');
  const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
  
  console.log('\n=== MIGRATION SQL ===');
  console.log('Copy the following SQL and run it in the Supabase SQL Editor:');
  console.log('\n' + migrationSQL);
  console.log('\n=== END OF MIGRATION SQL ===');
  
  console.log('\nInstructions:');
  console.log('1. Go to your Supabase dashboard: https://app.supabase.com/');
  console.log('2. Select your project');
  console.log('3. Go to the SQL Editor');
  console.log('4. Create a new query');
  console.log('5. Paste the SQL above');
  console.log('6. Run the query');
  
} catch (error) {
  console.error('Error reading migration file:', error.message);
  process.exit(1);
} 