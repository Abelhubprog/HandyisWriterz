import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'react-hot-toast';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';
const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Function to check if a key is a development key
const isDevKey = (key: string | undefined) => {
  return key?.includes('pk_test_') || key?.includes('clerk.daring-goshawk-70.accounts.dev');
};

if (!publishableKey) {
  console.error('Missing Clerk Publishable Key');
  // Only throw in development, in production we'll show a toast
  if (isDevelopment) {
    throw new Error('Missing Clerk Publishable Key');
  }
}

// Check if using development key in production
if (!isDevelopment && !isLocalhost && isDevKey(publishableKey)) {
  console.warn('Using Clerk development key in production environment');
  // We'll show a toast but not throw an error to avoid breaking the app
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      toast.error(
        'Using development authentication keys in production. This has strict usage limits. Please update to production keys. Learn more: https://clerk.com/docs/deployments/overview', 
        {
          duration: 10000,
          id: 'clerk-dev-key-warning',
        }
      );
    }, 2000);
  }
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90',
          card: 'bg-background',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'bg-muted text-muted-foreground hover:bg-muted/90',
          dividerLine: 'bg-border',
          formFieldLabel: 'text-foreground',
          formFieldInput: 'bg-input border-input',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
