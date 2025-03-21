import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';

// Maximum file size in bytes (20MB)
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',
    'application/zip',
    'application/x-zip-compressed'
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  video: [
    'video/mp4',
    'video/webm', 
    'video/ogg'
  ],
  audio: [
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm'
  ]
};

// File type categories
export type FileCategory = 'document' | 'image' | 'video' | 'audio';

// File validation result
interface FileValidationResult {
  valid: boolean;
  error?: string;
  category?: FileCategory;
}

// Function to validate file before upload
export function validateFile(file: File, allowedCategories?: FileCategory[]): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }

  // Determine file category
  let fileCategory: FileCategory | undefined = undefined;
  
  // Check file type
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(file.type)) {
      fileCategory = category as FileCategory;
      break;
    }
  }

  // If no category found, file type is not allowed
  if (!fileCategory) {
    return {
      valid: false,
      error: 'File type not allowed. Please upload a valid document, image, video, or audio file.'
    };
  }

  // If allowedCategories is provided, check if the file's category is allowed
  if (allowedCategories && allowedCategories.length > 0) {
    if (!allowedCategories.includes(fileCategory)) {
      return {
        valid: false,
        error: `Only ${allowedCategories.join(', ')} files are allowed.`
      };
    }
  }

  return {
    valid: true,
    category: fileCategory
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Interface for upload result
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  file?: File;
}

// Upload a file to Supabase storage
export async function uploadFile(
  file: File,
  bucket: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        file
      };
    }

    // Create file path
    const fileExt = file.name.split('.').pop();
    const filePath = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        // Mock progress updates - Supabase currently doesn't support progress monitoring
        onUploadProgress: (progress) => {
          if (onProgress) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            onProgress(percent);
          }
        }
      });

    // Handle error
    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
        file
      };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      file
    };
  } catch (error) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
      file
    };
  }
}

// Upload multiple files with batch processing
export async function uploadFiles(
  files: File[],
  bucket: string,
  path: string,
  onProgress?: (progress: number, file: File, index: number) => void,
  onFileComplete?: (result: UploadResult, index: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Upload file with progress tracking
    const result = await uploadFile(
      file, 
      bucket, 
      path,
      (progress) => {
        if (onProgress) {
          onProgress(progress, file, i);
        }
      }
    );
    
    // Add to results
    results.push(result);
    
    // Notify of completion
    if (onFileComplete) {
      onFileComplete(result, i);
    }
    
    // Show toast notification for each file
    if (result.success) {
      toast.success(`Uploaded ${file.name} successfully`);
    } else {
      toast.error(`Failed to upload ${file.name}: ${result.error}`);
    }
  }
  
  return results;
}

// Delete a file from storage
export async function deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) {
      return {
        success: false,
        error: error.message
      };
    }
    
    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting file'
    };
  }
}

// Download a file
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export the functions
export default {
  validateFile,
  formatFileSize,
  uploadFile,
  uploadFiles,
  deleteFile,
  downloadFile,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES
}; 