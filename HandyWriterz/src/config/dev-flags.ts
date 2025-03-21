/**
 * Development Flags & Configuration
 * 
 * These flags are set to false for production use.
 * No debugging features should be enabled in production.
 * 
 * @file src/config/dev-flags.ts
 */

// Environment detection - all forced to production
export const IS_DEVELOPMENT = false;
export const IS_PRODUCTION = true;
export const CURRENT_ENV = 'production';

// Appwrite MFA bypass - disabled for production
export const BYPASS_MFA = false; 

// Authentication bypass - disabled for production
export const BYPASS_AUTH = false;

// Debug mode - disabled for production
export const DEBUG_MODE = false;

// Log level - set to error only for production
export const LOG_LEVEL = 'error';

// Log function that only logs errors
export const logger = {
  debug: (...args: any[]) => {
    // No debug logging in production
  },
  info: (...args: any[]) => {
    // No info logging in production
  },
  warn: (...args: any[]) => {
    // No warn logging in production
  },
  error: (...args: any[]) => {
    // Only log critical errors
    console.error('[ERROR]', ...args);
  }
};

// Export default config object
export default {
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  CURRENT_ENV,
  BYPASS_MFA,
  BYPASS_AUTH,
  DEBUG_MODE,
  LOG_LEVEL,
  logger
}; 