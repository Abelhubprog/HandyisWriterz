import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy load page components
const Support = lazy(() => import('../pages/Support'));
const HowItWorks = lazy(() => import('../pages/HowItWorks'));
const FAQ = lazy(() => import('../pages/FAQ'));
const Contact = lazy(() => import('../pages/Contact'));
const Support247 = lazy(() => import('../pages/support/Support247'));
const Turnitin = lazy(() => import('../pages/tools/Turnitin'));
const Learning = lazy(() => import('../pages/learning/index'));
const Payment = lazy(() => import('../pages/Payment'));
const About = lazy(() => import('../pages/About'));
const DeepResearch = lazy(() => import('../pages/deepresearch/DeepResearch'));
const Home = lazy(() => import('../pages/Home/Homepage'));

export const pageRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Home />
      </Suspense>
    )
  },
  {
    path: 'deepresearch',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <DeepResearch />
      </Suspense>
    )
  },
  {
    path: 'support',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Support />
      </Suspense>
    )
  },
  {
    path: 'support/24-7',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Support247 />
      </Suspense>
    )
  },
  {
    path: 'how-it-works',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <HowItWorks />
      </Suspense>
    )
  },
  {
    path: 'faq',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <FAQ />
      </Suspense>
    )
  },
  {
    path: 'contact',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Contact />
      </Suspense>
    )
  },
  {
    path: 'tools/turnitin',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Turnitin />
      </Suspense>
    )
  },
  {
    path: 'learning',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Learning />
      </Suspense>
    )
  },
  {
    path: 'payment',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <Payment />
      </Suspense>
    )
  },
  {
    path: 'about',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <About />
      </Suspense>
    )
  }
];

export default pageRoutes;
