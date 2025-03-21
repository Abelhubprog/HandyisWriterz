/**
 * Dynamic Import Error Handler
 * 
 * This utility provides error handling for dynamic imports in the admin dashboard.
 * It handles common issues with webpack and React.lazy imports.
 */

import React from 'react';

/**
 * Creates a safe dynamic import that catches errors and provides a fallback
 * @param importer Function that returns the import promise
 * @param fallback The fallback component to use if import fails
 */
export const createSafeImport = <T extends React.ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  fallback: React.ComponentType
): React.LazyExoticComponent<T> => {
  const wrappedImporter = async () => {
    try {
      // Attempt the dynamic import
      return await importer();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      
      // Create a fake module that exports the fallback as default
      return { 
        default: fallback as unknown as T 
      };
    }
  };
  
  return React.lazy(wrappedImporter);
};

/**
 * Creates a fallback component with a customizable message
 * @param title The title to display
 * @param message The message to display
 * @param retryAction Optional callback when retry button is clicked
 */
export const createFallbackComponent = (
  title: string = 'Component Failed to Load',
  message: string = 'The component could not be loaded. This may be due to network issues or a missing file.',
  retryAction?: () => void
): React.ComponentType => {
  return () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white rounded-lg shadow">
      <div className="w-16 h-16 flex items-center justify-center bg-red-100 text-red-600 rounded-full mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-600 text-center mb-6 max-w-md">{message}</p>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.href = '/admin/dashboard'}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          Go to Dashboard
        </button>
        {retryAction && (
          <button
            onClick={retryAction}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Wraps a React lazy component with a suspense boundary and error fallback
 * @param LazyComponent The lazy-loaded component
 * @param errorFallback The fallback component to use if there's an error 
 */
export const withErrorBoundary = (
  LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>,
  errorFallback: React.ComponentType = createFallbackComponent()
): React.ReactNode => {
  // Custom error boundary component
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    componentDidCatch(error: Error) {
      console.error('Component error caught by boundary:', error);
    }

    render() {
      if (this.state.hasError) {
        return React.createElement(errorFallback);
      }
      return this.props.children;
    }
  }

  return (
    <ErrorBoundary>
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-700">Loading...</p>
          </div>
        }
      >
        <LazyComponent />
      </React.Suspense>
    </ErrorBoundary>
  );
}; 