import { z } from 'zod';

const envSchema = z.object({
  // API
  VITE_API_URL: z.string().url(),

  // Supabase
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),

  // Clerk
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // Appwrite
  VITE_APPWRITE_PROJECT_ID: z.string().default('092025'),
  VITE_APPWRITE_ENDPOINT: z.string().url().default('https://cloud.appwrite.io/v1'),
  VITE_APPWRITE_DATABASE_ID: z.string().default('09202502'),
  VITE_APPWRITE_ADMIN_COLLECTION: z.string().default('0920250011'),

  // Service configuration
  VITE_TURNITIN_MAX_FILE_SIZE: z.string().transform((val) => parseInt(val, 10)),
  VITE_TURNITIN_ALLOWED_TYPES: z.string(),

  // Feature flags
  VITE_ENABLE_TURNITIN: z.string().transform((val) => val === 'true'),
  VITE_ENABLE_TELEGRAM: z.string().transform((val) => val === 'true')
});

function getEnvVars() {
  const envVars = {
    VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://thvgjcnrlfofioagjydk.supabase.co',
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmdqY25ybGZvZmlvYWdqeWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNjYzMDAsImV4cCI6MjA1Njg0MjMwMH0.OmWI-itN_xok_fKFxfID1ew7sKO843-jsylapBCqvvg',
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZGFyaW5nLWdvc2hhd2stNzAuY2xlcmsuYWNjb3VudHMuZGV2JA',
    VITE_APPWRITE_PROJECT_ID: import.meta.env.VITE_APPWRITE_PROJECT_ID || '092025',
    VITE_APPWRITE_ENDPOINT: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    VITE_APPWRITE_DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID || '09202502',
    VITE_APPWRITE_ADMIN_COLLECTION: import.meta.env.VITE_APPWRITE_ADMIN_COLLECTION || '0920250011',
    VITE_TURNITIN_MAX_FILE_SIZE: import.meta.env.VITE_TURNITIN_MAX_FILE_SIZE || '20971520',
    VITE_TURNITIN_ALLOWED_TYPES: import.meta.env.VITE_TURNITIN_ALLOWED_TYPES || 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    VITE_ENABLE_TURNITIN: import.meta.env.VITE_ENABLE_TURNITIN || 'true',
    VITE_ENABLE_TELEGRAM: import.meta.env.VITE_ENABLE_TELEGRAM || 'true'
  };

  const result = envSchema.safeParse(envVars);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = getEnvVars();
