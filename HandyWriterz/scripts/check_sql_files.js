/**
 * scripts/check_sql_files.js
 * 
 * This script checks SQL files for TypeScript code that might have been accidentally mixed in.
 * Run with: node scripts/check_sql_files.js
 */

const fs = require('fs');
const path = require('path');

// Directory containing SQL files
const sqlDir = path.join(__dirname, '..', 'supabase', 'migrations');

// TypeScript patterns to look for
const typescriptPatterns = [
  /import\s+{.*}\s+from/,
  /import\s+.*\s+from/,
  /export\s+(default\s+)?function/,
  /export\s+(default\s+)?const/,
  /export\s+(default\s+)?interface/,
  /export\s+(default\s+)?class/,
  /React\./,
  /useState/,
  /useEffect/,
  /className=/,
  /<div>/,
  /<\/div>/,
  /tailwind/,
  /cn\(/
];

// Function to check a file for TypeScript code
function checkFileForTypescriptCode(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
      typescriptPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.toString()
          });
        }
      });
    });

    return issues;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Main function
function main() {
  console.log('Checking SQL files for TypeScript code...');
  
  try {
    // Get all SQL files
    const files = fs.readdirSync(sqlDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(sqlDir, file));
    
    console.log(`Found ${files.length} SQL files to check.`);
    
    let hasIssues = false;
    
    // Check each file
    files.forEach(file => {
      const issues = checkFileForTypescriptCode(file);
      
      if (issues.length > 0) {
        hasIssues = true;
        console.log(`\n⚠️ Found TypeScript code in ${path.basename(file)}:`);
        
        issues.forEach(issue => {
          console.log(`  Line ${issue.line}: ${issue.content}`);
        });
        
        console.log(`\n  To fix this file, open it in a text editor and remove the TypeScript code.`);
      }
    });
    
    if (!hasIssues) {
      console.log('✅ No TypeScript code found in SQL files.');
    } else {
      console.log('\n⚠️ Please fix the issues above before running the SQL migrations.');
    }
  } catch (error) {
    console.error('Error checking SQL files:', error);
  }
}

// Run the script
main(); 