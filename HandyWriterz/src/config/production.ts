/**
 * Production Configuration
 * 
 * Centralizes all production-related configuration settings and provides
 * environment-specific validation.
 * 
 * @file src/config/production.ts
 */

// Production URLs
export const PRODUCTION_URLS = {
  APP_URL: import.meta.env.VITE_APP_URL || 'https://handywriterz.com',
  API_URL: import.meta.env.VITE_API_URL || 'https://api.handywriterz.com',
  ADMIN_URL: import.meta.env.VITE_ADMIN_URL || 'https://admin.handywriterz.com',
  ACCOUNTS_URL: import.meta.env.VITE_ACCOUNTS_URL || 'https://accounts.handywriterz.com',
} as const;

// Production Appwrite Configuration
export const PRODUCTION_APPWRITE = {
  ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT_PROD || 'https://cloud.appwrite.io/v1',
  PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID_PROD,
  DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID_PROD,
  API_KEY: import.meta.env.VITE_APPWRITE_API_KEY_PROD,
  STORAGE_BUCKET: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_PROD,
  DOCUMENTS_BUCKET: import.meta.env.VITE_APPWRITE_DOCUMENTS_BUCKET_PROD,
  AVATARS_BUCKET: import.meta.env.VITE_APPWRITE_AVATARS_BUCKET_PROD,
} as const;

// Required environment variables for production
const REQUIRED_PROD_ENV = {
  // Appwrite Production Keys
  APPWRITE_PROJECT_ID: PRODUCTION_APPWRITE.PROJECT_ID,
  APPWRITE_DATABASE_ID: PRODUCTION_APPWRITE.DATABASE_ID,
  APPWRITE_API_KEY: PRODUCTION_APPWRITE.API_KEY,
  
  // Production URLs
  APP_URL: PRODUCTION_URLS.APP_URL,
  API_URL: PRODUCTION_URLS.API_URL,
  ADMIN_URL: PRODUCTION_URLS.ADMIN_URL,
} as const;

/**
 * Validates production environment variables
 * Throws an error if any required variables are missing
 */
export function validateProductionEnv() {
  if (import.meta.env.PROD) {
    const missingVars = Object.entries(REQUIRED_PROD_ENV)
      .filter(([_, value]) => !value)
      .map(([key]) => `VITE_${key}`);

    if (missingVars.length > 0) {
      throw new Error(
        'Missing required production environment variables:\n' +
        missingVars.join('\n') +
        '\n\nPlease check your deployment configuration.'
      );
    }
  }
}

// Production Collection IDs
export const PRODUCTION_COLLECTIONS = {
  ADMIN_PROFILES: import.meta.env.VITE_APPWRITE_ADMIN_COLLECTION_PROD || 'admin_profiles_prod',
  POSTS: import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_PROD || 'posts_prod',
  CATEGORIES: import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_PROD || 'categories_prod',
  TAGS: import.meta.env.VITE_APPWRITE_TAGS_COLLECTION_PROD || 'tags_prod',
  MEDIA: import.meta.env.VITE_APPWRITE_MEDIA_COLLECTION_PROD || 'media_prod',
  COMMENTS: import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_PROD || 'comments_prod',
  ORDERS: import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_PROD || 'orders_prod',
  SERVICES: import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION_PROD || 'services_prod',
  CUSTOMERS: import.meta.env.VITE_APPWRITE_CUSTOMERS_COLLECTION_PROD || 'customers_prod',
} as const;

// Production Security Headers
export const PRODUCTION_SECURITY = {
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' ${PRODUCTION_APPWRITE.ENDPOINT};
    `.replace(/\s+/g, ' ').trim(),
  },
  cors: {
    origin: [
      PRODUCTION_URLS.APP_URL,
      PRODUCTION_URLS.API_URL,
      PRODUCTION_URLS.ADMIN_URL,
      PRODUCTION_URLS.ACCOUNTS_URL,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
} as const; 