#!/usr/bin/env node

/**
 * CLI script to set up the Appwrite database for HandyWriterz
 * Run this with: node setupDBCli.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for confirmation
rl.question(`
👋 Welcome to the HandyWriterz Database Setup Script!

This script will:
1. Create required collections in your Appwrite database
2. Set up initial admin user (if credentials are provided)
3. Create default categories for all services

Make sure you have the following environment variables set:
- VITE_APPWRITE_ENDPOINT
- VITE_APPWRITE_PROJECT_ID
- VITE_APPWRITE_API_KEY
- VITE_APPWRITE_DATABASE_ID
- ADMIN_EMAIL (optional)
- ADMIN_PASSWORD (optional)
- ADMIN_NAME (optional)

Continue? (y/n) `, (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🚀 Starting database setup...');
    
    try {
      // Run the setup script using ts-node
      execSync('npx ts-node src/scripts/setupDatabase.ts', { stdio: 'inherit' });
      
      console.log('\n✅ Database setup completed!');
      console.log('\nYou can now start your application.');
      console.log('If you need to create an admin user later, you can use:');
      console.log('npx ts-node src/scripts/createAdmin.ts');
      
    } catch (error) {
      console.error('\n❌ Database setup failed!');
      console.error('Please check the error messages above and try again.');
    }
  } else {
    console.log('\n❌ Setup cancelled.');
  }
  
  rl.close();
}); 