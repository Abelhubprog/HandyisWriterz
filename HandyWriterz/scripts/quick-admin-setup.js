/**
 * Quick Admin Setup for Appwrite
 * 
 * This script quickly sets up an admin user and profile in Appwrite
 * without requiring MFA and ensures the admin account is properly configured.
 * 
 * Usage:
 * 1. Install dependencies: npm install node-appwrite
 * 2. Run: node scripts/quick-admin-setup.js
 * 
 * @file scripts/quick-admin-setup.js
 */

const sdk = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Default config
const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: '092025',
  databaseId: '09202502',
  apiKey: '',
  email: 'admin@handywriterz.com',
  password: 'Admin123!',
  name: 'Admin User',
  role: 'admin'
};

// Load environment variables
function loadEnvVars() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          
          // Update config if the key is relevant
          if (key === 'VITE_APPWRITE_ENDPOINT') config.endpoint = value;
          if (key === 'VITE_APPWRITE_PROJECT_ID') config.projectId = value;
          if (key === 'VITE_APPWRITE_DATABASE_ID') config.databaseId = value;
          if (key === 'VITE_APPWRITE_API_KEY') config.apiKey = value;
        }
      }
      
      console.log('Environment variables loaded from .env file');
    }
  } catch (error) {
    console.error('Error loading .env file:', error);
  }
}

// Create Appwrite client
function createClient() {
  const client = new sdk.Client();
  client.setEndpoint(config.endpoint).setProject(config.projectId);
  return client;
}

// Main function
async function setupAdmin() {
  console.log('=== Quick Admin Setup for Appwrite ===');
  
  // Load environment variables
  loadEnvVars();
  
  // Get API key from command line if not in env
  if (!config.apiKey) {
    if (process.argv.length > 2) {
      config.apiKey = process.argv[2];
    } else {
      console.error('No API key found. Please provide it as an argument or in .env file.');
      console.log('Usage: node scripts/quick-admin-setup.js YOUR_API_KEY');
      process.exit(1);
    }
  }
  
  // Initialize client
  const client = createClient();
  
  try {
    // Initialize services
    const users = new sdk.Users(client);
    const databases = new sdk.Databases(client);
    
    // Set API key
    users.setKey(config.apiKey);
    databases.setKey(config.apiKey);
    
    // Step 1: Check if user already exists
    console.log(`Checking if user ${config.email} already exists...`);
    let userId;
    
    try {
      const existingUsers = await users.list([
        sdk.Query.equal('email', config.email)
      ]);
      
      if (existingUsers.total > 0) {
        userId = existingUsers.users[0].$id;
        console.log(`User already exists with ID: ${userId}`);
      } else {
        // Create user if not exists
        console.log('Creating new user...');
        const newUser = await users.create(
          'unique()', 
          config.email, 
          config.password, 
          config.name
        );
        userId = newUser.$id;
        console.log(`User created with ID: ${userId}`);
      }
    } catch (error) {
      console.error('Error checking/creating user:', error);
      if (error.response) {
        console.error('Response:', JSON.stringify(error.response));
      }
      process.exit(1);
    }
    
    // Step 2: Check MFA status and disable if needed
    console.log('Checking MFA status...');
    
    try {
      const mfa = await users.getMfa(userId);
      let mfaDisabled = true;
      
      // Check and disable TOTP
      if (mfa.totp) {
        console.log('Disabling TOTP MFA...');
        await users.deleteMfaAuthenticator(userId, 'totp');
        mfaDisabled = true;
      }
      
      // Check and disable phone
      if (mfa.phone) {
        console.log('Disabling phone MFA...');
        await users.deleteMfaAuthenticator(userId, 'phone');
        mfaDisabled = true;
      }
      
      // Check and disable email
      if (mfa.email) {
        console.log('Disabling email MFA...');
        await users.deleteMfaAuthenticator(userId, 'email');
        mfaDisabled = true;
      }
      
      if (mfaDisabled) {
        console.log('MFA has been disabled for this user');
      } else {
        console.log('No MFA was enabled for this user');
      }
    } catch (error) {
      console.warn('Error checking/disabling MFA:', error);
      console.log('Continuing with admin profile setup...');
      // Continue anyway, this is not critical
    }
    
    // Step 3: Create admin profile
    console.log('Setting up admin profile...');
    
    try {
      // Check if admin profile already exists
      const existingProfiles = await databases.listDocuments(
        config.databaseId,
        'admin_profiles',
        [
          sdk.Query.equal('userId', userId)
        ]
      );
      
      if (existingProfiles.total > 0) {
        console.log('Admin profile already exists');
        
        // Update last login
        const profileId = existingProfiles.documents[0].$id;
        await databases.updateDocument(
          config.databaseId,
          'admin_profiles',
          profileId,
          {
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
        
        console.log('Admin profile updated');
      } else {
        // Create new admin profile
        const newProfile = await databases.createDocument(
          config.databaseId,
          'admin_profiles',
          sdk.ID.unique(),
          {
            userId: userId,
            email: config.email,
            name: config.name,
            role: config.role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }
        );
        
        console.log(`Admin profile created with ID: ${newProfile.$id}`);
      }
      
      console.log('\n==== SETUP COMPLETE ====');
      console.log('You can now log in with these credentials:');
      console.log(`Email: ${config.email}`);
      console.log(`Password: ${config.password}`);
      console.log('MFA: Disabled');
      
    } catch (error) {
      console.error('Error setting up admin profile:', error);
      if (error.response) {
        console.error('Response:', JSON.stringify(error.response));
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
setupAdmin().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 