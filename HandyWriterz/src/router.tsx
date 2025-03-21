import React, { lazy, Suspense } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  createBrowserRouter,
  Outlet
} from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';

// Inline Orders component
const OrdersComponent: React.FC = () => (
  <OrdersComponentFallback />
);

// Fallback component for Orders in case import fails
const OrdersComponentFallback: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-6">My Orders (Fallback)</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-700">
        This is a fallback component for the Orders page. The main component could not be loaded.
      </p>
    </div>
  </div>
);

// Inline Messages component
const MessagesComponent: React.FC = () => (
  <MessagesComponentFallback />
);

// Fallback component for Messages in case import fails
const MessagesComponentFallback: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-6">My Messages (Fallback)</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-700">
        This is a fallback component for the Messages page. The main component could not be loaded.
      </p>
    </div>
  </div>
);

// Inline Profile component
const ProfileComponent: React.FC = () => (
  <ProfileComponentFallback />
);

// Fallback component for Profile in case import fails
const ProfileComponentFallback: React.FC = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-6">My Profile (Fallback)</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-700">
        This is a fallback component for the Profile page. The main component could not be loaded.
      </p>
    </div>
  </div>
);

// Layouts
import RootLayout from './components/layouts/RootLayout';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Auth components
import AuthGuard from './components/auth/AuthGuard';
import AdminGuard from './components/auth/AdminGuard';
import { Loader } from './components/ui/Loader';

// Admin components
import Admin from './admin/Admin';

// Error component
const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="max-w-md w-full space-y-8 bg-white p-6 rounded-xl shadow-md">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
        <p className="mt-2 text-gray-600">{error.message}</p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Wrap components with ErrorBoundary and Suspense
const withSuspenseAndError = (Component: React.ComponentType<any>) => {
  return function WrappedComponent() {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader size="lg" /></div>}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
  };
};

// Root layout with outlet
const RootLayoutWithOutlet = () => {
  return (
    <RootLayout>
      <Outlet />
    </RootLayout>
  );
};

// Lazy load pages
const Homepage = lazy(() => import('./pages/Homepage'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Messages = lazy(() => import('./pages/dashboard/Messages'));
const Orders = lazy(() => import('./pages/dashboard/Orders'));
const AdminRoutes = lazy(() => import('./admin/Routes'));
const CheckTurnitin = lazy(() => import('./pages/tools/check-turnitin'));
const LearningHub = lazy(() => import('./pages/LearningHub'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Pricing = lazy(() => import('./pages/Pricing'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Services = lazy(() => import('./pages/Services'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Support = lazy(() => import('./pages/Support'));
const Blog = lazy(() => import('./pages/Blog'));
const Payment = lazy(() => import('./pages/Payment'));
const Login = lazy(() => import('./pages/auth/login'));
const SignUp = lazy(() => import('./pages/auth/SignUp'));
const AdminLogin = lazy(() => import('./pages/auth/admin-login'));
const MfaChallenge = lazy(() => import('./pages/auth/mfa-challenge'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const AdultHealthNursing = lazy(() => import('./pages/services/adult-health-nursing'));
const MentalHealthNursing = lazy(() => import('./pages/services/mental-health-nursing'));
const ChildNursing = lazy(() => import('./pages/services/child-nursing'));
const SpecialEducation = lazy(() => import('./pages/services/special-education'));
const SocialWork = lazy(() => import('./pages/services/social-work'));
const AdvancedPracticeNursing = lazy(() => import('./pages/services/advanced-practice-nursing'));
const Crypto = lazy(() => import('./pages/services/crypto'));
const NotFound = lazy(() => import('./pages/not-found'));

// Create router for RouterProvider - changed to use createBrowserRouter
// Following Clerk's recommendation for routing to handle multi-page auth correctly
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayoutWithOutlet />,
    children: [
      // Public Routes
      { path: "", element: withSuspenseAndError(Homepage)() },
      { path: "about", element: withSuspenseAndError(About)() },
      { path: "contact", element: withSuspenseAndError(Contact)() },
      { path: "faq", element: withSuspenseAndError(FAQ)() },
      { path: "privacy", element: withSuspenseAndError(Privacy)() },
      { path: "terms", element: withSuspenseAndError(Terms)() },
      { path: "pricing", element: withSuspenseAndError(Pricing)() },
      { path: "services", element: withSuspenseAndError(Services)() },
      { path: "how-it-works", element: withSuspenseAndError(HowItWorks)() },
      { path: "support", element: withSuspenseAndError(Support)() },
      { path: "blog", element: withSuspenseAndError(Blog)() },
      { path: "payment", element: withSuspenseAndError(Payment)() },

      // Service Pages
      { path: "services/adult-health-nursing", element: withSuspenseAndError(AdultHealthNursing)() },
      { path: "services/mental-health-nursing", element: withSuspenseAndError(MentalHealthNursing)() },
      { path: "services/child-nursing", element: withSuspenseAndError(ChildNursing)() },
      { path: "services/special-education", element: withSuspenseAndError(SpecialEducation)() },
      { path: "services/social-work", element: withSuspenseAndError(SocialWork)() },
      { path: "services/advanced-practice-nursing", element: withSuspenseAndError(AdvancedPracticeNursing)() },
      { path: "services/crypto", element: withSuspenseAndError(Crypto)() },

      // Tool Pages
      { path: "tools/check-turnitin", element: withSuspenseAndError(CheckTurnitin)() },
      { path: "learning-hub", element: withSuspenseAndError(LearningHub)() },
      { path: "check-turnitin", element: <Navigate to="/tools/check-turnitin" replace /> },

      // Auth Routes
      { path: "sign-in", element: withSuspenseAndError(Login)() },
      { path: "sign-up", element: withSuspenseAndError(SignUp)() },
      { path: "auth/admin-login", element: withSuspenseAndError(AdminLogin)() },
      { path: "forgot-password", element: withSuspenseAndError(ForgotPassword)() },
      { path: "auth/mfa-challenge", element: withSuspenseAndError(MfaChallenge)() },
      
      // Redirects for old paths - regular user auth
      { path: "auth/login", element: <Navigate to="/sign-in" replace /> },
      { path: "auth/sign-in", element: <Navigate to="/sign-in" replace /> },
      { path: "auth/sign-up", element: <Navigate to="/sign-up" replace /> },
      { path: "auth/forgot-password", element: <Navigate to="/forgot-password" replace /> },
      { path: "login", element: <Navigate to="/sign-in" replace /> },

      // Redirects for admin paths - keep admin paths separate
      { path: "admin/login", element: <Navigate to="/auth/admin-login" replace /> },

      // Clerk additional auth routes needed for hash routing
      { path: "sign-in/*", element: withSuspenseAndError(Login)() },
      { path: "sign-up/*", element: withSuspenseAndError(SignUp)() },

      // Clerk callback routes
      { path: "auth/sso-callback", element: <div className="min-h-screen flex items-center justify-center"><Loader size="lg" /></div> },
    ]
  },

  // Protected Dashboard Routes
  {
    path: "/dashboard",
    element: <AuthGuard><DashboardLayout /></AuthGuard>,
    children: [
      { path: "", element: withSuspenseAndError(Dashboard)() },
      { path: "profile", element: withSuspenseAndError(Profile)() },
      { path: "orders", element: withSuspenseAndError(Orders)() },
      { path: "messages", element: withSuspenseAndError(Messages)() },
    ]
  },

  // Protected Admin Routes - Use the Admin component from admin directory
  {
    path: "/admin/*",
    element: <Admin />
  },

  // 404 Not Found
  { path: "*", element: withSuspenseAndError(NotFound)() },
]);
