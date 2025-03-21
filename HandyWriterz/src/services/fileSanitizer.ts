import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Define allowed file types and their corresponding MIME types
const ALLOWED_FILE_TYPES = new Map([
  ['.pdf', 'application/pdf'],
  ['.doc', 'application/msword'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.txt', 'text/plain']
]);

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Scans a file for security issues
 * @param filePath Path to the file to scan
 * @returns Promise that resolves to true if the file is safe, false otherwise
 */
export async function scanFile(filePath: string): Promise<boolean> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return false;
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      console.error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE} bytes)`);
      return false;
    }
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!ALLOWED_FILE_TYPES.has(ext)) {
      console.error(`Invalid file extension: ${ext}`);
      return false;
    }
    
    // Read file content
    const buffer = fs.readFileSync(filePath);
    
    // Check file signature (magic bytes)
    if (!hasValidFileSignature(buffer, ext)) {
      console.error(`Invalid file signature for extension: ${ext}`);
      return false;
    }
    
    // Calculate file hash for logging/tracking
    const hash = createHash('sha256').update(buffer).digest('hex');
    console.log(`File hash: ${hash}`);
    
    // In a production environment, you would integrate with a virus scanning service here
    // For example: ClamAV, VirusTotal API, etc.
    // For now, we'll just do basic checks
    
    return true;
  } catch (error) {
    console.error('Error scanning file:', error);
    return false;
  }
}

/**
 * Checks if a file has a valid signature (magic bytes) for its extension
 * @param buffer File buffer
 * @param extension File extension
 * @returns True if the file has a valid signature, false otherwise
 */
function hasValidFileSignature(buffer: Buffer, extension: string): boolean {
  // Check first few bytes of file to verify it matches the claimed type
  switch (extension) {
    case '.pdf':
      // PDF signature: %PDF-
      return buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF';
      
    case '.doc':
      // DOC signature: D0 CF 11 E0 A1 B1 1A E1 (MS Compound Document)
      return buffer.length >= 8 && 
        buffer[0] === 0xD0 && 
        buffer[1] === 0xCF && 
        buffer[2] === 0x11 && 
        buffer[3] === 0xE0;
        
    case '.docx':
      // DOCX is a ZIP file with specific contents
      // ZIP signature: PK
      return buffer.length >= 2 && 
        buffer[0] === 0x50 && 
        buffer[1] === 0x4B;
        
    case '.txt':
      // Text files don't have a specific signature
      // Just check if it's valid UTF-8 or ASCII
      try {
        buffer.toString('utf8');
        return true;
      } catch (e) {
        return false;
      }
      
    default:
      return false;
  }
}

/**
 * Validates a file's MIME type
 * @param mimeType MIME type to validate
 * @returns True if the MIME type is allowed, false otherwise
 */
export function isValidMimeType(mimeType: string): boolean {
  return Array.from(ALLOWED_FILE_TYPES.values()).includes(mimeType);
}

/**
 * Sanitizes a filename to make it safe for storage
 * @param filename Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal characters and other potentially dangerous characters
  let sanitized = path.basename(filename);
  
  // Replace any non-alphanumeric characters except for periods, hyphens, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9.-_]/g, '_');
  
  // Ensure the filename isn't empty
  if (!sanitized) {
    sanitized = 'file';
  }
  
  return sanitized;
}

/**
 * Checks if a file extension is allowed
 * @param extension File extension to check (with or without leading dot)
 * @returns True if the extension is allowed, false otherwise
 */
export function isAllowedExtension(extension: string): boolean {
  // Ensure extension has a leading dot
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return ALLOWED_FILE_TYPES.has(ext.toLowerCase());
}
