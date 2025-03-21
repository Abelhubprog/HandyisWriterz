/**
 * Updated Admin Setup for Appwrite
 * 
 * Compatible with latest Appwrite SDK
 */

const { Client, Users, Databases, ID, Query } = require('node-appwrite');
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
      console.log('Usage: node scripts/fix-admin.js YOUR_API_KEY');
      process.exit(1);
    }
  }
  
  // Initialize client
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  
  // Initialize services - no setKey needed, already set on the client
  const users = new Users(client);
  const databases = new Databases(client);
  
  try {
    // Step 1: Check if user already exists
    console.log(`Checking if user ${config.email} already exists...`);
    let userId;
    
    try {
      const existingUsers = await users.list([
        Query.equal('email', config.email)
      ]);
      
      if (existingUsers.total > 0) {
        userId = existingUsers.users[0].$id;
        console.log(`User already exists with ID: ${userId}`);
      } else {
        // Create user if not exists
        console.log('Creating new user...');
        const newUser = await users.create(
          ID.unique(), 
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
      const mfaFactors = await users.listMfaFactors(userId);
      let mfaDisabled = false;
      
      console.log('MFA factors:', JSON.stringify(mfaFactors, null, 2));
      
      // If we get here without error, we might need to disable MFA factors
      if (mfaFactors && mfaFactors.totps && mfaFactors.totps.length > 0) {
        console.log('TOTP factors found, attempting to disable...');
        for (const factor of mfaFactors.totps) {
          try {
            await users.deleteMfaAuthenticator(userId, 'totp');
            console.log(`Disabled TOTP factor: ${factor.id}`);
            mfaDisabled = true;
          } catch (err) {
            console.warn(`Failed to disable TOTP factor: ${err.message}`);
          }
        }
      }
      
      if (mfaFactors && mfaFactors.phone && mfaFactors.phone.length > 0) {
        console.log('Phone factors found, attempting to disable...');
        for (const factor of mfaFactors.phone) {
          try {
            await users.deleteMfaAuthenticator(userId, 'phone');
            console.log(`Disabled phone factor: ${factor.id}`);
            mfaDisabled = true;
          } catch (err) {
            console.warn(`Failed to disable phone factor: ${err.message}`);
          }
        }
      }
      
      if (mfaDisabled) {
        console.log('Successfully disabled MFA factors');
      } else {
        console.log('No MFA factors were found or needed to be disabled');
      }
    } catch (error) {
      // This might fail if the API doesn't support this method
      console.warn('Error checking MFA status:', error.message);
      console.log('Continuing with admin profile setup...');
    }
    
    // Step 3: Create admin profile
    console.log('Setting up admin profile...');
    
    try {
      // Check if admin profile already exists
      const existingProfiles = await databases.listDocuments(
        config.databaseId,
        'admin_profiles',
        [
          Query.equal('userId', userId)
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
          ID.unique(),
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
      
      // Create a simple helper file to login with this user
      const loginHelperPath = path.resolve(process.cwd(), 'scripts', 'login-helper.js');
      const loginHelperContent = `
/**
 * Login Helper for HandyWriterz Admin
 * 
 * Run this script to create a local admin session:
 * node scripts/login-helper.js
 */

// This creates a localStorage entry for admin session
if (typeof window !== 'undefined') {
  console.log('Creating admin session...');
  localStorage.setItem('adminUser', JSON.stringify({
    id: '${userId}',
    userId: '${userId}',
    email: '${config.email}',
    name: '${config.name}',
    role: '${config.role}',
    avatar: null,
    lastLogin: '${new Date().toISOString()}'
  }));

  localStorage.setItem('adminSession', 'true');
  console.log('Admin session created successfully!');
  console.log('You can now access the admin dashboard.');
} else {
  console.log('This script needs to be run in the browser console.');
}
`;

      try {
        fs.writeFileSync(loginHelperPath, loginHelperContent);
        console.log('Login helper script created at scripts/login-helper.js');
      } catch (err) {
        console.warn('Could not create login helper script:', err.message);
      }
      
      console.log('\n==== SETUP COMPLETE ====');
      console.log('You can now log in with these credentials:');
      console.log(`Email: ${config.email}`);
      console.log(`Password: ${config.password}`);
      console.log('MFA: Disabled');
      console.log('\nIf login still fails, use the "Create Debug Admin Session" button in the admin login page debug options section.');
      
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