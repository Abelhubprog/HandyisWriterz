import React, { useState, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { usePostQueries } from '@/hooks/usePostQueries';
import BlogPostsList from './BlogPostsList';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy load components that aren't needed for initial render
const ServiceHero = React.lazy(() => import('./ServiceHero'));
const ServiceOverview = React.lazy(() => import('./ServiceOverview'));

interface StandardServicePageProps {
  serviceType: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  heroImage?: string;
  featuredPostId?: string;
  keywords?: string[];
}

/**
 * StandardServicePage - A reusable component for service pages
 * 
 * This component handles:
 * 1. SEO optimization with proper meta tags
 * 2. Fetching service-related posts from Supabase
 * 3. Displaying a hero section, service overview, and blog posts
 * 4. Performance optimization with code splitting and lazy loading
 * 
 * @param props - Component properties
 */
const StandardServicePage: React.FC<StandardServicePageProps> = ({
  serviceType,
  title,
  description,
  icon,
  heroImage,
  featuredPostId,
  keywords = []
}) => {
  // Fetch popular posts for this service type
  const { data: popularPosts, isLoading: isLoadingPosts } = usePostQueries.usePosts({
    serviceType,
    limit: 3,
    sortBy: 'views_count',
    sortOrder: 'desc'
  });

  // Fetch service details from Supabase
  const { data: serviceDetails, isLoading: isLoadingService } = useQuery({
    queryKey: ['service', serviceType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', serviceType)
        .single();
      
      if (error) {
        console.error('Error fetching service details:', error);
        return null;
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Format service name for display
  const formattedServiceName = serviceType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <>
      {/* SEO Optimization */}
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        
        {/* Open Graph / Social Media */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {heroImage && <meta property="og:image" content={heroImage} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {heroImage && <meta name="twitter:image" content={heroImage} />}
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://handywriterz.com/services/${serviceType}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Breadcrumb Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link to="/" className="hover:text-blue-600">Home</Link>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <Link to="/services" className="hover:text-blue-600">Services</Link>
              </li>
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="font-medium text-gray-900">{formattedServiceName}</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Hero Section - Lazy loaded */}
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse"></div>}>
          <ServiceHero 
            title={serviceDetails?.title || formattedServiceName}
            description={serviceDetails?.description || description}
            icon={icon}
            heroImage={serviceDetails?.hero_image || heroImage}
          />
        </Suspense>

        {/* Service Overview - Lazy loaded */}
        <Suspense fallback={<div className="h-64 bg-gray-50 animate-pulse"></div>}>
          <ServiceOverview 
            serviceType={serviceType}
            features={serviceDetails?.features || []}
            benefits={serviceDetails?.benefits || []}
          />
        </Suspense>

        {/* Blog Posts Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Latest Resources</h2>
              <Link 
                to={`/blog?service=${serviceType}`}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                View all resources
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
            
            {isLoadingPosts ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <BlogPostsList 
                serviceType={serviceType}
                limit={6}
                showFilters={false}
                showSearch={false}
                showHeader={false}
                className="mt-8"
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default StandardServicePage; 