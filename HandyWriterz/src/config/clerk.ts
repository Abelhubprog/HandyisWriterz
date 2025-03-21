/**
 * Clerk Authentication Configuration
 * 
 * Centralizes all Clerk-related configuration settings and provides
 * type-safe access to Clerk services.
 * 
 * @file src/config/clerk.ts
 */

// Environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_SIGN_IN_URL = import.meta.env.VITE_CLERK_SIGN_IN_URL;
const CLERK_SIGN_UP_URL = import.meta.env.VITE_CLERK_SIGN_UP_URL;
const CLERK_AFTER_SIGN_IN_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL;
const CLERK_AFTER_SIGN_UP_URL = import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL;

// Validate required environment variables
if (!CLERK_PUBLISHABLE_KEY || !CLERK_SIGN_IN_URL || !CLERK_SIGN_UP_URL) {
  throw new Error(
    'Missing required Clerk environment variables. Please check your configuration:\n' +
    '- VITE_CLERK_PUBLISHABLE_KEY\n' +
    '- VITE_CLERK_SIGN_IN_URL\n' +
    '- VITE_CLERK_SIGN_UP_URL'
  );
}

// Clerk configuration
export const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
  signInUrl: CLERK_SIGN_IN_URL,
  signUpUrl: CLERK_SIGN_UP_URL,
  afterSignInUrl: CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  afterSignUpUrl: CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  appearance: {
    layout: {
      socialButtonsPlacement: 'bottom',
      socialButtonsVariant: 'iconButton',
      termsPageUrl: '/terms',
      privacyPageUrl: '/privacy',
    },
    variables: {
      colorPrimary: '#2563eb',
      colorTextOnPrimaryBackground: '#ffffff',
      borderRadius: '0.5rem',
    },
    elements: {
      formButtonPrimary: 
        'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg',
      formFieldLabel: 'text-gray-700 font-medium',
      formFieldInput: 
        'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg',
      card: 'shadow-none border-none',
      header: 'hidden',
      footer: 'text-center text-gray-600',
      dividerLine: 'bg-gray-200',
      dividerText: 'text-gray-500 px-2',
    },
  },
} as const;

// Export configuration
export default clerkConfig; 