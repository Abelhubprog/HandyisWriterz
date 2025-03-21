import { supabase } from '../lib/supabaseClient';
import { FiFileText, FiImage, FiVideo, FiMusic, FiFile } from 'react-icons/fi';

// File categories
export type FileCategory = 'document' | 'image' | 'video' | 'audio' | 'other';

// Maximum file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types by category
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
    'application/zip'
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp',
    'image/tiff'
  ],
  video: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm'
  ],
  audio: [
    'audio/mpeg',
    'audio/x-wav',
    'audio/ogg',
    'audio/aac',
    'audio/webm'
  ]
};

// Validate file
export const validateFile = (file: File, allowedCategories: FileCategory[] = ['document', 'image', 'video', 'audio']): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`
    };
  }

  // Check file type
  const fileCategory = getFileCategory(file.type);
  
  if (fileCategory === 'other' || !allowedCategories.includes(fileCategory)) {
    return {
      valid: false,
      error: `File type not supported. Allowed types: ${allowedCategories.join(', ')}`
    };
  }

  return { valid: true };
};

// Get file category from mime type
export const getFileCategory = (mimeType: string): FileCategory => {
  if (ALLOWED_FILE_TYPES.document.includes(mimeType)) return 'document';
  if (ALLOWED_FILE_TYPES.image.includes(mimeType)) return 'image';
  if (ALLOWED_FILE_TYPES.video.includes(mimeType)) return 'video';
  if (ALLOWED_FILE_TYPES.audio.includes(mimeType)) return 'audio';
  return 'other';
};

// Format file size
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Get file icon based on category
export const getFileIcon = (category: FileCategory) => {
  switch (category) {
    case 'document':
      return FiFileText;
    case 'image':
      return FiImage;
    case 'video':
      return FiVideo;
    case 'audio':
      return FiMusic;
    default:
      return FiFile;
  }
};

// Upload a file to Supabase storage
export const uploadFile = async (
  file: File, 
  bucket: string, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> => {
  try {
    // Create a unique file name to avoid collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    // Upload file with progress tracking
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onProgress) {
            const percent = (progress.loaded / progress.total) * 100;
            onProgress(Math.round(percent));
          }
        }
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

// Download a file
export const downloadFile = (url: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Delete a file from storage
export const deleteFile = async (bucket: string, path: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

// Upload multiple files with progress tracking
export const uploadFiles = async (
  files: File[],
  bucket: string,
  path: string,
  onProgress?: (progress: number, file: File, index: number) => void
): Promise<Array<{
  success: boolean;
  file?: File;
  url?: string;
  path?: string;
  error?: string;
}>> => {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(file, bucket, path, 
      (progress) => onProgress && onProgress(progress, file, i)
    );
    
    results.push({
      ...result,
      file: result.success ? file : undefined
    });
  }

  return results;
};

// Default export
const fileUploadService = {
  uploadFile,
  uploadFiles,
  downloadFile,
  deleteFile,
  validateFile,
  getFileCategory,
  formatFileSize,
  getFileIcon
};

export default fileUploadService;
