/**
 * File: scripts/deploy.js
 * Description: Deployment script for HandyWriterz application
 * 
 * This script automates the deployment process by:
 * 1. Building the application
 * 2. Setting up backend services (Appwrite collections and buckets)
 * 3. Preparing the application for deployment
 */

require('dotenv').config({ path: '.env.production' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Executes a shell command and returns the output
 * @param {string} command - Command to execute
 * @param {boolean} printOutput - Whether to print the command output to console
 * @returns {string} Command output
 */
function executeCommand(command, printOutput = true) {
  console.log(`${colors.blue}> ${command}${colors.reset}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    if (printOutput && output) {
      console.log(output);
    }
    return output;
  } catch (error) {
    console.error(`${colors.red}Failed to execute command: ${command}${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    if (error.stdout) {
      console.error(`${colors.yellow}STDOUT: ${error.stdout}${colors.reset}`);
    }
    if (error.stderr) {
      console.error(`${colors.yellow}STDERR: ${error.stderr}${colors.reset}`);
    }
    throw error;
  }
}

/**
 * Checks if all required environment variables are set
 * @returns {boolean} True if all required variables are set
 */
function checkEnvironmentVariables() {
  const requiredVariables = [
    'VITE_APPWRITE_ENDPOINT_PROD',
    'VITE_APPWRITE_PROJECT_ID_PROD',
    'VITE_APPWRITE_DATABASE_ID_PROD',
    'VITE_APPWRITE_API_KEY_PROD',
    'VITE_APPWRITE_STORAGE_BUCKET_PROD'
  ];

  const missingVariables = requiredVariables.filter(variable => !process.env[variable]);
  
  if (missingVariables.length > 0) {
    console.error(`${colors.red}Missing required environment variables:${colors.reset}`);
    missingVariables.forEach(variable => {
      console.error(`${colors.red}- ${variable}${colors.reset}`);
    });
    return false;
  }
  
  return true;
}

/**
 * Builds the application
 */
function buildApplication() {
  console.log(`\n${colors.bright}${colors.magenta}Building the application...${colors.reset}\n`);
  
  // Clean previous build
  if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
    console.log(`${colors.yellow}Cleaning previous build...${colors.reset}`);
    fs.rmSync(path.join(process.cwd(), 'dist'), { recursive: true, force: true });
  }
  
  // Build the application
  executeCommand('pnpm build');
  
  console.log(`\n${colors.green}Build completed successfully!${colors.reset}\n`);
}

/**
 * Sets up backend services (Appwrite)
 */
function setupBackendServices() {
  console.log(`\n${colors.bright}${colors.magenta}Setting up backend services...${colors.reset}\n`);
  
  try {
    // Setup Appwrite collections and buckets
    console.log(`${colors.blue}Setting up Appwrite database...${colors.reset}`);
    executeCommand('pnpm run setup-appwrite-db-ultimate');
    executeCommand('pnpm run create-final-collections');
    
    console.log(`${colors.blue}Setting up Appwrite storage...${colors.reset}`);
    executeCommand('pnpm run setup-appwrite-storage');
    executeCommand('pnpm run create-buckets');
    
    console.log(`\n${colors.green}Backend services setup completed successfully!${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Failed to set up backend services:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Creates an example .htaccess file for Apache servers
 */
function createHtaccessFile() {
  console.log(`\n${colors.blue}Creating .htaccess file for Apache servers...${colors.reset}\n`);
  
  const htaccessContent = `# Redirect all requests to index.html for SPA routing
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, apikey"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType application/x-font-woff "access plus 1 year"
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript application/json
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
`;

  fs.writeFileSync(path.join(process.cwd(), 'dist', '.htaccess'), htaccessContent);
  console.log(`${colors.green}.htaccess file created successfully!${colors.reset}\n`);
}

/**
 * Creates a _redirects file for Netlify
 */
function createNetlifyRedirectsFile() {
  console.log(`\n${colors.blue}Creating _redirects file for Netlify...${colors.reset}\n`);
  
  const redirectsContent = `# Netlify redirects file
# Handle SPA routing by redirecting all requests to index.html
/*    /index.html   200
`;

  fs.writeFileSync(path.join(process.cwd(), 'dist', '_redirects'), redirectsContent);
  console.log(`${colors.green}_redirects file created successfully!${colors.reset}\n`);
}

/**
 * Creates a vercel.json file for Vercel deployment
 */
function createVercelConfig() {
  console.log(`\n${colors.blue}Creating vercel.json file for Vercel...${colors.reset}\n`);
  
  const vercelConfig = {
    "version": 2,
    "routes": [
      {
        "src": "^/assets/(.*)",
        "headers": { "cache-control": "public, max-age=31536000, immutable" },
        "dest": "/assets/$1"
      },
      { "src": "^/favicon.ico", "dest": "/favicon.ico" },
      { "src": "^/robots.txt", "dest": "/robots.txt" },
      { "src": "^/sitemap.xml", "dest": "/sitemap.xml" },
      { "src": "^/(.*)", "dest": "/index.html" }
    ],
    "github": {
      "silent": true
    }
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'vercel.json'), 
    JSON.stringify(vercelConfig, null, 2)
  );
  console.log(`${colors.green}vercel.json file created successfully!${colors.reset}\n`);
}

/**
 * Creates a simple health check endpoint
 */
function createHealthCheckFile() {
  console.log(`\n${colors.blue}Creating health check endpoint...${colors.reset}\n`);
  
  const healthCheckContent = JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    environment: 'production'
  }, null, 2);

  if (!fs.existsSync(path.join(process.cwd(), 'dist', 'api'))) {
    fs.mkdirSync(path.join(process.cwd(), 'dist', 'api'), { recursive: true });
  }

  fs.writeFileSync(
    path.join(process.cwd(), 'dist', 'api', 'health.json'), 
    healthCheckContent
  );
  console.log(`${colors.green}Health check endpoint created successfully!${colors.reset}\n`);
}

/**
 * Main function to run the deployment
 */
async function main() {
  console.log(`\n${colors.bright}${colors.magenta}=== HandyWriterz Deployment Script ===${colors.reset}\n`);
  
  // Check environment variables
  if (!checkEnvironmentVariables()) {
    console.error(`${colors.red}Deployment aborted due to missing environment variables.${colors.reset}`);
    process.exit(1);
  }
  
  try {
    // Build the application
    buildApplication();
    
    // Setup backend services
    setupBackendServices();
    
    // Create deployment files for different hosting providers
    createHtaccessFile();
    createNetlifyRedirectsFile();
    createVercelConfig();
    createHealthCheckFile();
    
    console.log(`\n${colors.bright}${colors.green}=== Deployment preparation completed successfully! ===${colors.reset}`);
    console.log(`\n${colors.bright}${colors.green}The application is ready to be deployed.${colors.reset}`);
    console.log(`${colors.bright}${colors.green}Please upload the contents of the 'dist' directory to your hosting provider.${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}Deployment failed:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the deployment script
main().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
}); 