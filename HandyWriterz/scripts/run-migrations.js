const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service key for migrations
const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

// Check if environment variables are set
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.');
  process.exit(1);
}

// Get all migration files
const getMigrationFiles = () => {
  try {
    return fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure migrations run in order
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    process.exit(1);
  }
};

// Run a single migration
const runMigration = (migrationFile) => {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`Running migration: ${migrationFile}`);
  
  try {
    // Use the Supabase CLI to run the migration
    // This assumes you have the Supabase CLI installed and configured
    execSync(`supabase db execute --file ${migrationPath}`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        SUPABASE_URL,
        SUPABASE_KEY
      }
    });
    
    console.log(`Migration ${migrationFile} completed successfully.`);
    return true;
  } catch (error) {
    console.error(`Error running migration ${migrationFile}:`, error.message);
    return false;
  }
};

// Run all migrations
const runAllMigrations = () => {
  const migrationFiles = getMigrationFiles();
  
  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    return;
  }
  
  console.log(`Found ${migrationFiles.length} migration files.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const file of migrationFiles) {
    const success = runMigration(file);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log('\nMigration Summary:');
  console.log(`Total migrations: ${migrationFiles.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (failCount > 0) {
    process.exit(1);
  }
};

// Alternative: Run a specific migration
const runSpecificMigration = (migrationName) => {
  const migrationFiles = getMigrationFiles();
  const matchingFile = migrationFiles.find(file => file.includes(migrationName));
  
  if (!matchingFile) {
    console.error(`No migration file found matching: ${migrationName}`);
    process.exit(1);
  }
  
  const success = runMigration(matchingFile);
  if (!success) {
    process.exit(1);
  }
};

// Main execution
const main = () => {
  const specificMigration = process.argv[2];
  
  if (specificMigration) {
    runSpecificMigration(specificMigration);
  } else {
    runAllMigrations();
  }
};

main(); 