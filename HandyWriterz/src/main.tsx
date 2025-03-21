/**
 * Main Application Entry
 * 
 * Sets up the React application and all required providers.
 * 
 * @file src/main.tsx
 */

// Load polyfills first
import './polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { SupabaseProvider } from './providers/SupabaseProvider';
import './index.css';
import AdminRoutes from './admin/Routes';
import AdminLogin from './pages/auth/admin-login';
import Login from './pages/auth/login';
import { router as mainRouter } from './router';

// Import Tailwind styles directly
import 'tailwindcss/tailwind.css';

// Initialize React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Get Clerk publishable key
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing Clerk publishable key");
}

// Create a dedicated router for the application
// This combines admin routes with mainRouter routes with unique IDs
const router = createBrowserRouter([
  // Use the main router's routes for most pages, with unique IDs
  ...mainRouter.routes.map((route, index) => ({
    ...route,
    id: `main-${index}`
  })),
  
  // Admin routes with explicit IDs
  {
    path: '/admin/*',
    element: <AdminRoutes />,
    id: 'admin-routes'
  },
  
  // Admin login path - don't redirect this
  {
    path: '/auth/admin-login',
    element: <AdminLogin />,
    id: 'admin-login'
  },
  
  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/" />,
    id: 'catch-all'
  }
]);

// Render the application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ClerkProvider 
        publishableKey={publishableKey}
        appearance={{
          variables: { colorPrimary: '#0369a1' },
        }}
      >
        <SupabaseProvider>
          <QueryClientProvider client={queryClient}>
            <Toaster />
            <RouterProvider router={router} />
          </QueryClientProvider>
        </SupabaseProvider>
      </ClerkProvider>
    </HelmetProvider>
  </React.StrictMode>
);
