// scripts/universal-admin-fix.js
/**
 * Universal Admin Fix
 * Works with any version of the Appwrite SDK
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const config = {
    email: 'admin@handywriterz.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin',
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '092025',
    databaseId: '09202502'
};

// Load environment variables
function loadConfig() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                if (line.trim() && !line.startsWith('#')) {
                    const [key, ...values] = line.split('=');
                    const value = values.join('=').trim().replace(/^["']|["']$/g, '');
                    
                    if (key === 'VITE_APPWRITE_ENDPOINT') config.endpoint = value;
                    if (key === 'VITE_APPWRITE_PROJECT_ID') config.projectId = value;
                    if (key === 'VITE_APPWRITE_DATABASE_ID') config.databaseId = value;
                }
            });
            
            console.log('Environment variables loaded');
        }
    } catch (error) {
        console.warn('Error loading .env:', error.message);
    }
}

// Create a helper file that can be run in browser console
function createLoginHelper() {
    const timestamp = Date.now();
    const userId = `admin-${timestamp}`;
    
    const helperContent = `
/**
 * Admin Login Helper for HandyWriterz
 * Copy and paste this code in your browser console when on the login page
 */
try {
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
    console.log('Redirecting to dashboard...');
    
    // Try to navigate to dashboard
    if (location.href.includes('/auth/')) {
        location.href = '/admin/dashboard';
    }
} catch (e) {
    console.error('Error creating admin session:', e);
}
`;

    const helperPath = path.resolve(process.cwd(), 'scripts', 'admin-login-helper.js');
    fs.writeFileSync(helperPath, helperContent);
    console.log(`Login helper created at ${helperPath}`);
    
    return helperPath;
}

// Main function
async function main() {
    console.log('== Universal Admin Fix for HandyWriterz ==');
    loadConfig();
    
    try {
        // Check if node-appwrite is installed
        try {
            require('node-appwrite');
            console.log('node-appwrite is installed');
        } catch (e) {
            console.log('Installing node-appwrite...');
            execSync('npm install node-appwrite', { stdio: 'inherit' });
        }
        
        // Dynamically load Appwrite to ensure we use the correct version
        const sdk = require('node-appwrite');
        
        // Create Appwrite client
        console.log('Initializing Appwrite client...');
        const client = new sdk.Client();
        client.setEndpoint(config.endpoint);
        client.setProject(config.projectId);
        
        // Get the API key
        const apiKey = process.argv[2];
        if (!apiKey) {
            console.error('API key is required. Please provide it as an argument.');
            console.log('Usage: node scripts/universal-admin-fix.js YOUR_API_KEY');
            
            // Create the helper file anyway
            const helperPath = createLoginHelper();
            console.log(`\nAlternatively, you can use the helper file at ${helperPath} to create an admin session directly.`);
            
            process.exit(1);
        }
        
        client.setKey(apiKey);
        
        // Initialize services
        console.log('Initializing services...');
        const users = new sdk.Users(client);
        
        // Create a user
        console.log(`Creating/checking user ${config.email}...`);
        let userId;
        
        try {
            // Try Users API approach
            const userList = await users.list(typeof sdk.Query !== 'undefined' 
                ? [sdk.Query.equal('email', config.email)] 
                : [`email=${config.email}`]);
            
            if (userList.total > 0) {
                userId = userList.users[0].$id;
                console.log(`User found: ${userId}`);
            } else {
                // Create user
                const newUser = await users.create(
                    typeof sdk.ID !== 'undefined' ? sdk.ID.unique() : 'unique()', 
                    config.email, 
                    config.password, 
                    config.name
                );
                userId = newUser.$id;
                console.log(`User created: ${userId}`);
            }
        } catch (error) {
            console.error('Error with user operations:', error);
            console.log('Creating login helper as fallback...');
            createLoginHelper();
            process.exit(1);
        }
        
        // Handle MFA if possible
        console.log('Checking for MFA...');
        try {
            // Try different API methods depending on SDK version
            if (typeof users.listMfaFactors === 'function') {
                console.log('Using listMfaFactors method...');
                const factors = await users.listMfaFactors(userId);
                console.log('MFA factors found:', JSON.stringify(factors, null, 2));
                
                if (factors.totps?.length > 0) {
                    console.log('Disabling TOTP factors...');
                    await users.deleteMfaAuthenticator(userId, 'totp');
                }
                
                if (factors.phone?.length > 0) {
                    console.log('Disabling phone factors...');
                    await users.deleteMfaAuthenticator(userId, 'phone');
                }
            } else if (typeof users.getMfa === 'function') {
                console.log('Using getMfa method...');
                const mfa = await users.getMfa(userId);
                
                if (mfa.totp) {
                    console.log('Disabling TOTP factors...');
                    await users.deleteMfaAuthenticator(userId, 'totp');
                }
                
                if (mfa.phone) {
                    console.log('Disabling phone factors...');
                    await users.deleteMfaAuthenticator(userId, 'phone');
                }
            } else {
                console.warn('No MFA methods found in SDK');
            }
        } catch (error) {
            console.warn('Error handling MFA:', error.message);
        }
        
        // Create the login helper
        const helperPath = createLoginHelper();
        
        console.log('\n=== SETUP COMPLETE ===');
        console.log(`User: ${config.email}`);
        console.log(`Password: ${config.password}`);
        console.log(`Helper script: ${helperPath}`);
        
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();