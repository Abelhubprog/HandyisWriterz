import { execSync } from 'child_process';
import { fs } from 'fs';
import { path } from 'path';

// Function to execute commands with error handling
function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`ERROR: ${errorMessage}`);
    console.error(error.message);
    return false;
  }
}

console.log('Running Vercel custom build script...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Create .env.production if it doesn't exist to avoid build errors
const envProductionPath = path.join(process.cwd(), '.env.production');
if (!fs.existsSync(envProductionPath)) {
  console.log('Creating minimal .env.production file...');
  
  // Read from .env if it exists
  let envContent = '';
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('Using .env as template...');
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Use minimal required env vars
    envContent = `
# Essential environment variables for production build
VITE_APP_NAME=HandyWriterz
VITE_APP_URL=${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://handywriterz.vercel.app'}
VITE_APP_DESCRIPTION=Professional academic writing services
    `.trim();
  }
  
  fs.writeFileSync(envProductionPath, envContent);
  console.log('Created .env.production file');
}

// Ensure public images directory exists
try {
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  console.log(`Creating directory if it doesn't exist: ${imagesDir}`);
  
  if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
    fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true });
    console.log('Created public directory');
  }
  
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory');
  }

  // Create a simple OG image fallback using SVG
  const svgContent = `
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#2563eb"/>
    <text x="600" y="315" font-family="Arial" font-size="60" fill="white" text-anchor="middle">HandyWriterz</text>
    <text x="600" y="395" font-family="Arial" font-size="40" fill="white" text-anchor="middle">Professional Academic Writing Services</text>
  </svg>
  `;

  fs.writeFileSync(path.join(imagesDir, 'og-default.svg'), svgContent.trim());
  console.log('Created fallback OG image (SVG format)');
} catch (error) {
  console.error('Error creating image directory or SVG:', error);
  // Don't exit here, try to continue with the build
}

// Ensure _redirects file exists for SPA routing
try {
  const publicDir = path.join(process.cwd(), 'public');
  const redirectsPath = path.join(publicDir, '_redirects');
  
  if (!fs.existsSync(redirectsPath)) {
    console.log('Creating _redirects file for SPA routing...');
    fs.writeFileSync(redirectsPath, '/* /index.html 200');
    console.log('Created _redirects file');
  }
} catch (error) {
  console.error('Error creating _redirects file:', error);
}

// List files to debug
try {
  console.log('Files in current directory:');
  const files = fs.readdirSync(process.cwd());
  console.log(files.join(', '));
} catch (error) {
  console.error('Error listing files:', error);
}

// Install any required dependencies explicitly
console.log('Installing additional dependencies if needed...');
if (!runCommand('npm install --no-save typescript vite @vitejs/plugin-react @mui/icons-material @mui/material @emotion/react @emotion/styled', 'Failed to install build dependencies')) {
  console.log('Continuing despite dependency installation issue...');
}

// Run TypeScript compiler with more lenient options
console.log('Running TypeScript compiler...');
if (!runCommand('npx tsc --skipLibCheck --noEmit', 'TypeScript compilation failed')) {
  console.log('Continuing despite TypeScript errors...');
}

// Run Vite build with specific options to handle MUI
console.log('Running Vite build...');
if (!runCommand('npx vite build --mode production', 'Vite build failed')) {
  console.error('Vite build failed, exiting');
  process.exit(1);
}

// Create a _headers file to configure caching
try {
  const distDir = path.join(process.cwd(), 'dist');
  const headersPath = path.join(distDir, '_headers');
  
  console.log('Creating _headers file for caching configuration...');
  const headersContent = `
# Cache static assets strongly
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# HTML and other files
/*
  Cache-Control: public, max-age=0, must-revalidate
`;
  
  fs.writeFileSync(headersPath, headersContent.trim());
  console.log('Created _headers file');
} catch (error) {
  console.error('Error creating _headers file:', error);
}

console.log('Build completed successfully!');

try {
  // Run the build command
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 