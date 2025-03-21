// This is a simple script to check if .env variables are loaded
// Run with: node env-test.js
const fs = require('fs');
const path = require('path');

console.log('Checking environment files:');

// Check for .env files
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.fixed',
  '.env.mcp'
];

envFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} exists (${stats.size} bytes)`);
    
    // Read first few lines to verify content
    const content = fs.readFileSync(filePath, 'utf8');
    const firstLines = content.split('\n').slice(0, 3).join('\n');
    console.log(`  Preview: ${firstLines.substring(0, 100)}${firstLines.length > 100 ? '...' : ''}`);
  } catch (err) {
    console.log(`❌ ${file} does not exist or cannot be read`);
  }
});

console.log('\nNote: For Vite to load variables correctly:');
console.log('1. Variables must be prefixed with VITE_');
console.log('2. .env.local has higher priority than .env');
console.log('3. Restart the dev server after changing environment files'); 