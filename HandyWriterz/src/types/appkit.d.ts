import { ReactNode } from 'react';

export interface AppKitUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  emailVerified: boolean;
  roles?: string[];
  metadata?: Record<string, unknown>;
}

export interface AppKitAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AppKitUser | null;
}

export type AppKitErrorType = 
  | 'auth/cancelled'
  | 'auth/network-error'
  | 'auth/popup-closed'
  | 'auth/invalid-credential'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | string;

export interface AppKitError extends Error {
  code: AppKitErrorType;
  message: string;
}

export interface AppKitContextType extends AppKitAuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  error: AppKitError | null;
  clearError: () => void;
}

export interface AppKitProviderProps {
  children: ReactNode;
  config: {
    apiKey: string;
    projectId: string;
    environment?: 'development' | 'production';
    redirectUri?: string;
  };
}

// Login Button Props
export interface AppKitLoginButtonProps {
  mode?: 'primary' | 'outline' | 'ghost';
  text?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: AppKitError) => void;
}

// Protected Route Props
export interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  roles?: string[];
  fallback?: ReactNode;
}

// Auth Hook Result
export interface UseAppKitResult extends AppKitAuthState {
  error: AppKitError | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  isAuthorized: (requiredRoles?: string[]) => boolean;
}
