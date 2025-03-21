// Admin setup script
require('dotenv').config();
const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');

// Create interface for reading input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAdmin() {
  try {
    console.log('🔧 HandyWriterz Admin Setup Tool 🔧');
    console.log('-----------------------------------');
    console.log('This utility will help you create an admin user for your application.\n');
    
    // Check if the user wants to use custom credentials
    const useCustom = await askQuestion('Do you want to use custom credentials? (y/n): ');
    
    if (useCustom.toLowerCase() === 'y') {
      // Create a temporary file with custom credentials
      console.log('\nPlease provide the admin user details:');
      const email = await askQuestion('Email: ');
      const password = await askQuestion('Password (min 8 chars, include uppercase, number, and special char): ');
      const fullName = await askQuestion('Full Name: ');
      
      console.log('\nCreating admin user with custom credentials...');
      
      // Modify the createAdmin.ts file with these credentials
      const tempScriptPath = path.join(__dirname, 'temp-create-admin.js');
      const fs = require('fs');
      
      // Read the original script
      const scriptContent = `
      // Temporary script - will be deleted after execution
      require('dotenv').config();
      const { createClient } = require('@supabase/supabase-js');
      
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('⛔ Supabase credentials missing! Check your .env file.');
        process.exit(1);
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      async function createAdminUser() {
        console.log('Starting admin user creation process...');
        
        const adminEmail = '${email}';
        const adminPassword = '${password}';
        const adminName = '${fullName}';
        
        try {
          // Check if admin user already exists
          const { data: existingUser, error: checkError } = await supabase
            .from('admin_users')
            .select('id')
            .eq('email', adminEmail)
            .maybeSingle();
            
          if (checkError) {
            throw new Error(\`Error checking for existing admin: \${checkError.message}\`);
          }
          
          if (existingUser) {
            console.log(\`Admin user with email \${adminEmail} already exists!\`);
            return;
          }
          
          // 1. Create the auth user
          console.log('Creating auth user...');
          const { data: authUser, error: authError } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: {
              data: {
                full_name: adminName,
                is_admin: true
              }
            }
          });
          
          if (authError) {
            throw new Error(\`Error creating auth user: \${authError.message}\`);
          }
          
          if (!authUser.user) {
            throw new Error('Failed to create auth user: no user returned');
          }
          
          const userId = authUser.user.id;
          console.log(\`Auth user created with ID: \${userId}\`);
          
          // 2. Create admin record in admin_users table
          console.log('Creating admin record...');
          const { error: adminError } = await supabase
            .from('admin_users')
            .insert([
              {
                id: userId,
                email: adminEmail,
                full_name: adminName,
                role: 'admin',
                status: 'active',
                created_at: new Date().toISOString()
              }
            ]);
          
          if (adminError) {
            throw new Error(\`Error creating admin record: \${adminError.message}\`);
          }
          
          // 3. Create profile record
          console.log('Creating profile record...');
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: userId,
                email: adminEmail,
                full_name: adminName,
                role: 'admin',
                avatar_url: null
              }
            ]);
          
          if (profileError) {
            throw new Error(\`Error creating profile record: \${profileError.message}\`);
          }
          
          console.log('✅ Admin user created successfully!');
          console.log(\`Email: \${adminEmail}\`);
          console.log('Please check your email to verify your account.');
          console.log('After verification, you can log in at /admin/login');
          
        } catch (error) {
          console.error('❌ Error creating admin user:', error.message);
        }
      }
      
      createAdminUser()
        .then(() => {
          console.log('Script finished executing');
          process.exit(0);
        })
        .catch(err => {
          console.error('Script failed:', err);
          process.exit(1);
        });
      `;
      
      // Write the temporary script
      fs.writeFileSync(tempScriptPath, scriptContent);
      
      // Execute the script
      try {
        execSync(`node ${tempScriptPath}`, { stdio: 'inherit' });
        console.log('\n✅ Admin user creation process completed.');
      } catch (err) {
        console.error('\n❌ Error executing admin creation script:', err.message);
      } finally {
        // Clean up the temporary file
        fs.unlinkSync(tempScriptPath);
      }
    } else {
      // Run the default script
      console.log('\nCreating admin user with default credentials...');
      
      try {
        // Run the TypeScript script using ts-node
        execSync('npx ts-node -r tsconfig-paths/register src/scripts/createAdmin.ts', { stdio: 'inherit' });
        console.log('\n✅ Admin user creation process completed.');
      } catch (err) {
        console.error('\n❌ Error executing admin creation script:', err.message);
      }
    }
    
    console.log('\nNow you can log in to the admin panel at:');
    console.log('http://localhost:5173/admin/login');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setupAdmin(); 