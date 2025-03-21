import { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';

// Import service pages
const ServicesIndex = lazy(() => import('../pages/services/index'));
const AssignmentWriting = lazy(() => import('../pages/services/AssignmentWriting'));
const EssayWriting = lazy(() => import('../pages/services/EssayWriting'));
const DissertationWriting = lazy(() => import('../pages/services/DissertationWriting'));
const ResearchWriting = lazy(() => import('../pages/services/ResearchWriting'));
const Proofreading = lazy(() => import('../pages/services/Proofreading'));
const OnlineTutoring = lazy(() => import('../pages/services/OnlineTutoring'));
const CheckTurnitin = lazy(() => import('../pages/services/CheckTurnitin'));

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <svg 
          className="mx-auto h-12 w-12 text-red-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mt-2 text-gray-600">{error.message}</p>
        <div className="mt-6">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Helper to wrap components with suspense and error boundary
const withSuspenseAndError = (Component: React.ComponentType) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          variant="border" 
          showText={true} 
          label="Loading page..." 
        />
      </div>
    }>
      <Component />
    </Suspense>
  </ErrorBoundary>
);

// Service routes configuration
export const servicesRoutes: RouteObject[] = [
  {
    path: 'services',
    children: [
      {
        index: true,
        element: withSuspenseAndError(ServicesIndex)
      },
      {
        path: 'assignment-writing',
        element: withSuspenseAndError(AssignmentWriting)
      },
      {
        path: 'essay-writing',
        element: withSuspenseAndError(EssayWriting)
      },
      {
        path: 'dissertation-writing',
        element: withSuspenseAndError(DissertationWriting)
      },
      {
        path: 'research-writing',
        element: withSuspenseAndError(ResearchWriting)
      },
      {
        path: 'proofreading',
        element: withSuspenseAndError(Proofreading)
      },
      {
        path: 'online-tutoring',
        element: withSuspenseAndError(OnlineTutoring)
      },
      {
        path: 'check-turnitin',
        element: withSuspenseAndError(CheckTurnitin)
      }
    ]
  }
];

// Service page component with Supabase integration
const ServicePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const supabase = getSupabaseClient();

  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['service', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          author:author_id (
            id,
            name,
            avatar_url
          ),
          likes_count,
          comments (
            id,
            comment,
            created_at,
            user:user_id (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          variant="border" 
          showText={true} 
          label="Loading content..." 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{pageData.title} | HandyWriterz</title>
        <meta name="description" content={pageData.meta_description} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose lg:prose-lg mx-auto">
          <h1>{pageData.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: pageData.content }} />
          <div className="mt-8 border-t pt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {pageData.author && (
                  <div className="flex items-center space-x-2">
                    <img 
                      src={pageData.author.avatar_url || '/default-avatar.png'} 
                      alt={pageData.author.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <span className="text-gray-600">{pageData.author.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{pageData.likes_count} likes</span>
                <span className="text-gray-600">{pageData.comments?.length || 0} comments</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
};

export default ServicePage;