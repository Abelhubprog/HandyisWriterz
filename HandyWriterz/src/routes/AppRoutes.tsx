import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorFallback from '@/components/ui/ErrorFallback';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RootLayout from '@/components/layouts/RootLayout';

// Main routes
import AdminRoutes from './AdminRoutes';

// Auth pages
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import ForgotPassword from '@/pages/auth/forgot-password';

// Lazy load page components
const Homepage = lazy(() => import('@/pages/Homepage'));
const About = lazy(() => import('@/pages/About'));
const Contact = lazy(() => import('@/pages/Contact'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const NotFound = lazy(() => import('@/pages/not-found'));
const LearningHub = lazy(() => import('@/pages/learning-hub'));
const Payment = lazy(() => import('@/pages/Payment'));
const CheckTurnitin = lazy(() => import('@/pages/tools/check-turnitin'));

// Lazy load service pages
const Services = lazy(() => import('@/pages/services/Services'));
const ServiceDetails = lazy(() => import('@/pages/services/ServiceDetails'));

// Helper for wrapping components with Suspense and ErrorBoundary
const withSuspenseAndError = (Component: React.ComponentType) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto my-8" />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

/**
 * DEPRECATED: This file is no longer used. Routes are now managed in src/router.tsx
 * Keeping this file temporarily for reference only.
 */
const DeprecatedAppRoutes = () => {
  console.warn('DEPRECATED: AppRoutes in src/routes/AppRoutes.tsx is no longer used. Routes are now managed in src/router.tsx');
  return null;
};

export default DeprecatedAppRoutes;
