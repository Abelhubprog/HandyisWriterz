/**
 * Utility functions for formatting data
 */

/**
 * Format a service name by capitalizing each word and replacing hyphens with spaces
 * @param serviceName - The service name to format (e.g., 'adult-health-nursing')
 * @returns The formatted service name (e.g., 'Adult Health Nursing')
 */
export const formatServiceName = (serviceName: string): string => {
  if (!serviceName) return '';
  
  return serviceName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format a date string into a readable format
 * @param dateString - The date string to format
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns The formatted date string
 */
export const formatDate = (dateString: string | null, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return 'N/A';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return new Date(dateString).toLocaleDateString(undefined, options || defaultOptions);
};

/**
 * Format a number as a file size with appropriate units
 * @param bytes - The number of bytes
 * @param decimals - Number of decimal places to show
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format a number with thousand separators
 * @param num - The number to format
 * @returns The formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Calculate and format read time based on content length
 * @param content - The content text
 * @param wordsPerMinute - Reading speed in words per minute
 * @returns Formatted read time string
 */
export const calculateReadTime = (content: string, wordsPerMinute = 200): string => {
  if (!content) return '< 1 min read';
  
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return `${minutes} min read`;
};

/**
 * Format duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}; 