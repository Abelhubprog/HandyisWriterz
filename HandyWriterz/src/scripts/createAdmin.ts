import { adminAuth } from '../services/adminAuth';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt for input with optional default value
 */
function prompt(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue || '');
    });
  });
}

/**
 * Create an admin user
 */
async function createAdminUser() {
  console.log('=== HandyWriterz Admin User Creation ===\n');
  
  try {
    // Get admin details, first trying env vars, then prompting
    let email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;
    let name = process.env.ADMIN_NAME;
    
    // If not provided in env vars, prompt for them
    if (!email) {
      email = await prompt('Admin Email');
    }
    
    if (!password) {
      password = await prompt('Admin Password (min 8 characters)');
    }
    
    if (!name) {
      name = await prompt('Admin Name', 'Admin User');
    }
    
    // Validate inputs
    if (!email || !email.includes('@')) {
      console.error('Error: Valid email is required');
      return false;
    }
    
    if (!password || password.length < 8) {
      console.error('Error: Password must be at least 8 characters');
      return false;
    }
    
    console.log('\nCreating admin user...');
    
    // Create admin user
    const result = await adminAuth.createAdminUser(email, password, name);
    
    if (result.success) {
      console.log('\n✅ Admin user created successfully!');
      console.log(`Email: ${email}`);
      console.log(`Name: ${name}`);
      return true;
    } else {
      console.error(`\n❌ Failed to create admin user: ${result.message}`);
      console.error('Please check the error and try again.');
      return false;
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  } finally {
    rl.close();
  }
}

// Run the function directly if this script is executed
if (require.main === module) {
  createAdminUser().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { createAdminUser }; 