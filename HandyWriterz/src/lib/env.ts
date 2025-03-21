import { z } from 'zod';

// Define environment variable schema
const envSchema = z.object({
  // Supabase
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_SUPABASE_SERVICE_KEY: z.string().optional(),

  // Clerk
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  VITE_CLERK_SECRET_KEY: z.string().optional(),
});

// Parse and validate environment variables
const parseEnvVariables = () => {
  const parsed = envSchema.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY,
    VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    VITE_CLERK_SECRET_KEY: import.meta.env.VITE_CLERK_SECRET_KEY,
  });

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
};

// Export validated environment variables
export const env = parseEnvVariables();

// Export individual variables for convenience
export const {
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
  VITE_SUPABASE_SERVICE_KEY: supabaseServiceKey,
  VITE_CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
  VITE_CLERK_SECRET_KEY: clerkSecretKey,
} = env;
