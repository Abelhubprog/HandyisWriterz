/**
 * scripts/fix_sql_files.js
 * 
 * This script attempts to fix SQL files by removing TypeScript code that might have been accidentally mixed in.
 * Run with: node scripts/fix_sql_files.js
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

    return { issues, lines };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return { issues: [], lines: [] };
  }
}

// Function to fix a file by removing TypeScript code
function fixFile(filePath, lines, issues) {
  try {
    // Create a backup of the original file
    const backupPath = `${filePath}.bak`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup at ${backupPath}`);
    
    // Remove the problematic lines
    const linesToRemove = new Set(issues.map(issue => issue.line - 1));
    const fixedLines = lines.filter((_, index) => !linesToRemove.has(index));
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, fixedLines.join('\n'), 'utf8');
    console.log(`Fixed ${filePath} by removing ${linesToRemove.size} lines`);
    
    return true;
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error);
    return false;
  }
}

// Main function
function main() {
  console.log('Fixing SQL files with TypeScript code...');
  
  try {
    // Get all SQL files
    const files = fs.readdirSync(sqlDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(sqlDir, file));
    
    console.log(`Found ${files.length} SQL files to check.`);
    
    let fixedFiles = 0;
    
    // Check and fix each file
    files.forEach(file => {
      const { issues, lines } = checkFileForTypescriptCode(file);
      
      if (issues.length > 0) {
        console.log(`\n⚠️ Found TypeScript code in ${path.basename(file)}:`);
        
        issues.forEach(issue => {
          console.log(`  Line ${issue.line}: ${issue.content}`);
        });
        
        const shouldFix = true; // In a real script, you might want to prompt the user
        
        if (shouldFix) {
          const fixed = fixFile(file, lines, issues);
          if (fixed) {
            fixedFiles++;
          }
        }
      }
    });
    
    if (fixedFiles === 0) {
      console.log('✅ No files needed fixing.');
    } else {
      console.log(`\n✅ Fixed ${fixedFiles} files.`);
    }
  } catch (error) {
    console.error('Error fixing SQL files:', error);
  }
}

// Run the script
main(); 