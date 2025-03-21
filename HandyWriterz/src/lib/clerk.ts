import { ClerkProvider, SignIn, SignUp } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

// Clerk publishable key (from environment variables)
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if we have a valid key
if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY === 'YOUR_PUBLISHABLE_KEY') {
  console.error('Missing or invalid Clerk publishable key. Please check your environment variables.');
}

// Provide Clerk configuration
export const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
  appearance: {
    baseTheme: dark,
    elements: {
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
      footerActionLink: 'text-blue-600 hover:text-blue-700',
      card: 'bg-white shadow-xl rounded-lg',
    },
  },
  // Redirect paths
  signInUrl: import.meta.env.VITE_CLERK_SIGN_IN_URL || '/sign-in',
  signUpUrl: import.meta.env.VITE_CLERK_SIGN_UP_URL || '/sign-up',
  afterSignInUrl: import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  afterSignUpUrl: import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
  fallbackRedirectUrl: '/dashboard',
};

// Clerk authentication components with customized appearance
export default clerkConfig;
