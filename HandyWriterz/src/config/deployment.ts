/**
 * Deployment Configuration
 * 
 * Handles deployment-specific settings and validation for different environments.
 * Similar to Clerk's deployment configuration but customized for our Appwrite setup.
 * 
 * @file src/config/deployment.ts
 */

import { PRODUCTION_URLS, PRODUCTION_APPWRITE, PRODUCTION_SECURITY, PRODUCTION_COLLECTIONS } from './production';

// Deployment Environments
export const ENVIRONMENTS = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  DEVELOPMENT: 'development',
} as const;

// Current Environment
export const CURRENT_ENV = import.meta.env.PROD 
  ? ENVIRONMENTS.PRODUCTION 
  : import.meta.env.MODE === 'staging' 
    ? ENVIRONMENTS.STAGING 
    : ENVIRONMENTS.DEVELOPMENT;

// Environment-specific configurations
export const ENV_CONFIG = {
  [ENVIRONMENTS.PRODUCTION]: {
    urls: PRODUCTION_URLS,
    appwrite: {
      ...PRODUCTION_APPWRITE,
      collections: PRODUCTION_COLLECTIONS,
    },
    security: PRODUCTION_SECURITY,
    features: {
      debugMode: false,
      analytics: true,
      errorReporting: true,
      performanceMonitoring: true,
    },
  },
  [ENVIRONMENTS.STAGING]: {
    urls: {
      APP_URL: import.meta.env.VITE_STAGING_APP_URL || 'https://staging.handywriterz.com',
      API_URL: import.meta.env.VITE_STAGING_API_URL || 'https://staging-api.handywriterz.com',
      ADMIN_URL: import.meta.env.VITE_STAGING_ADMIN_URL || 'https://staging-admin.handywriterz.com',
      ACCOUNTS_URL: import.meta.env.VITE_STAGING_ACCOUNTS_URL || 'https://staging-accounts.handywriterz.com',
    },
    appwrite: {
      ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT_STAGING || 'https://cloud.appwrite.io/v1',
      PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID_STAGING,
      DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID_STAGING,
      API_KEY: import.meta.env.VITE_APPWRITE_API_KEY_STAGING,
      STORAGE_BUCKET: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_STAGING,
      DOCUMENTS_BUCKET: import.meta.env.VITE_APPWRITE_DOCUMENTS_BUCKET_STAGING,
      AVATARS_BUCKET: import.meta.env.VITE_APPWRITE_AVATARS_BUCKET_STAGING,
      collections: {
        ADMIN_PROFILES: import.meta.env.VITE_APPWRITE_ADMIN_COLLECTION_STAGING || 'admin_profiles_staging',
        POSTS: import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_STAGING || 'posts_staging',
        CATEGORIES: import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION_STAGING || 'categories_staging',
        TAGS: import.meta.env.VITE_APPWRITE_TAGS_COLLECTION_STAGING || 'tags_staging',
        MEDIA: import.meta.env.VITE_APPWRITE_MEDIA_COLLECTION_STAGING || 'media_staging',
        COMMENTS: import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_STAGING || 'comments_staging',
        ORDERS: import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION_STAGING || 'orders_staging',
        SERVICES: import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION_STAGING || 'services_staging',
        CUSTOMERS: import.meta.env.VITE_APPWRITE_CUSTOMERS_COLLECTION_STAGING || 'customers_staging',
      },
    },
    security: {
      ...PRODUCTION_SECURITY,
      headers: {
        ...PRODUCTION_SECURITY.headers,
        'Content-Security-Policy': PRODUCTION_SECURITY.headers['Content-Security-Policy']
          .replace('upgrade-insecure-requests', '')
          .replace('strict-dynamic', ''),
      },
    },
    features: {
      debugMode: true,
      analytics: true,
      errorReporting: true,
      performanceMonitoring: true,
    },
  },
  [ENVIRONMENTS.DEVELOPMENT]: {
    urls: {
      APP_URL: 'http://localhost:5173',
      API_URL: 'http://localhost:3000',
      ADMIN_URL: 'http://localhost:5173/admin',
      ACCOUNTS_URL: 'http://localhost:5173/auth',
    },
    appwrite: {
      ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT,
      PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID,
      DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID,
      API_KEY: import.meta.env.VITE_APPWRITE_API_KEY,
      STORAGE_BUCKET: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET,
      DOCUMENTS_BUCKET: import.meta.env.VITE_APPWRITE_DOCUMENTS_BUCKET,
      AVATARS_BUCKET: import.meta.env.VITE_APPWRITE_AVATARS_BUCKET,
      collections: {
        ADMIN_PROFILES: import.meta.env.VITE_APPWRITE_ADMIN_COLLECTION || '0920250011',
        POSTS: import.meta.env.VITE_APPWRITE_POSTS_COLLECTION || 'posts',
        CATEGORIES: import.meta.env.VITE_APPWRITE_CATEGORIES_COLLECTION || 'categories',
        TAGS: import.meta.env.VITE_APPWRITE_TAGS_COLLECTION || 'tags',
        MEDIA: import.meta.env.VITE_APPWRITE_MEDIA_COLLECTION || 'media',
        COMMENTS: import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION || 'comments',
        ORDERS: import.meta.env.VITE_APPWRITE_ORDERS_COLLECTION || 'orders',
        SERVICES: import.meta.env.VITE_APPWRITE_SERVICES_COLLECTION || 'services',
        CUSTOMERS: import.meta.env.VITE_APPWRITE_CUSTOMERS_COLLECTION || 'customers',
      },
    },
    security: {
      headers: {},
      cors: {
        origin: ['http://localhost:5173'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      },
    },
    features: {
      debugMode: true,
      analytics: false,
      errorReporting: true,
      performanceMonitoring: false,
    },
  },
} as const;

// Get current environment configuration
export const getCurrentEnvConfig = () => ENV_CONFIG[CURRENT_ENV];

// Validate environment configuration
export const validateEnvConfig = () => {
  const config = getCurrentEnvConfig();
  const envName = CURRENT_ENV.toUpperCase();

  // Required configuration keys for each environment
  const requiredKeys = {
    appwrite: ['PROJECT_ID', 'DATABASE_ID', 'API_KEY'],
    urls: ['APP_URL', 'API_URL'],
  };

  // Check required Appwrite configuration
  requiredKeys.appwrite.forEach(key => {
    if (!config.appwrite[key]) {
      throw new Error(
        `Missing required Appwrite configuration for ${envName} environment: ${key}\n` +
        'Please check your environment variables.'
      );
    }
  });

  // Check required URLs
  requiredKeys.urls.forEach(key => {
    if (!config.urls[key]) {
      throw new Error(
        `Missing required URL for ${envName} environment: ${key}\n` +
        'Please check your environment variables.'
      );
    }
  });

  return true;
};

// Export current environment configuration
export default getCurrentEnvConfig(); 