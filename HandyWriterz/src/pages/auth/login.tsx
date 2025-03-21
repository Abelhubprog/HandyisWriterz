import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { SignIn as ClerkSignIn, useClerk, useUser } from '@clerk/clerk-react';
import HandyWriterzLogo from '@/components/HandyWriterzLogo';
import { Shield, User, ArrowRight, Check, BookOpen, Sparkles, UserPlus, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useClerk();
  const { isLoaded } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Get redirect path from location state or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (isLoaded && session) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        toast.success('Already logged in');
        navigate(from);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [session, navigate, from, isLoaded]);

  // Custom features component
  const FeatureItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className="flex items-start gap-3 p-4 rounded-lg hover:bg-blue-800/40 transition-colors"
    >
      <div className="bg-blue-500 p-2 rounded-md mt-1">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h3 className="text-white font-medium mb-1">{title}</h3>
        <p className="text-blue-200 text-sm">{description}</p>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:flex-row"
    >
      {/* Left side - Branding and information */}
      <div className="md:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-800 p-8 flex flex-col justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-blue-900/20 bg-grid-white/5 mix-blend-multiply" />
        
        <div className="max-w-lg mx-auto relative z-10">
          <div className="mb-6">
            <HandyWriterzLogo className="text-white" />
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Welcome to HandyWriterz
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-blue-100 text-lg mb-8"
          >
            Sign in to access your account and manage your writing projects. 
            Get professional academic assistance from our expert team.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2 mb-8"
          >
            <FeatureItem 
              icon={BookOpen} 
              title="Expert Academic Writers" 
              description="Specialized in nursing, social work, education and more"
            />
            <FeatureItem 
              icon={Sparkles} 
              title="Plagiarism-Free Content" 
              description="High-quality, original academic writing every time"
            />
            <FeatureItem 
              icon={Check} 
              title="On-time Delivery" 
              description="We respect your deadlines and deliver as promised"
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4"
          >
            <Link 
              to="/how-it-works" 
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors"
            >
              <span>How it works</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link 
              to="/pricing" 
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors"
            >
              <span>Pricing</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>
      
      {/* Right side - Clerk SignIn component */}
      <div className="md:w-1/2 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Back to home link for mobile - Keep this at top */}
          <div className="md:hidden mb-6">
            <Link to="/" className="text-gray-800 font-semibold hover:text-blue-600 transition-colors">
              Back to Home
            </Link>
          </div>
          
          {isRedirecting ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
            >
              <div className="py-4 px-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Sign In</h2>
                </div>
              </div>
              
              {/* Clerk SignIn component */}
              <ClerkSignIn 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-none p-6",
                    header: "hidden",
                    headerTitle: "text-2xl font-bold text-gray-900",
                    headerSubtitle: "text-gray-600",
                    formButtonPrimary: 
                      "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg",
                    formFieldLabel: "text-gray-700 font-medium",
                    formFieldInput: 
                      "border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg",
                    footer: "hidden",
                    footerActionLink: "text-blue-600 hover:text-blue-800 font-medium",
                    formFieldAction: "text-blue-600 hover:text-blue-800 font-medium",
                    dividerLine: "bg-gray-200",
                    dividerText: "text-gray-500 px-2",
                    identityPreview: "bg-gray-50 border border-gray-200"
                  }
                }}
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                redirectUrl="/dashboard"
              />
              
              {/* Add our own link to sign up */}
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="text-center text-gray-600 text-sm">
                  Don't have an account yet?{' '}
                  <Link to="/sign-up" className="text-blue-600 hover:text-blue-800 font-medium">
                    Sign up
                  </Link>
                </div>
              </div>
              
              {/* Admin Portal Link - Moved to BOTTOM as requested */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 flex flex-col items-center gap-4"
              >
                <Link 
                  to="/auth/admin-login"
                  className="inline-flex items-center px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                  aria-label="Admin login"
                  title="Admin login"
                  onClick={(e) => {
                    // Prevent any potential redirects by clearing stored redirect paths
                    sessionStorage.removeItem('redirect_after_login');
                    sessionStorage.removeItem('last_admin_redirect');
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Portal
                </Link>
                
                <div className="flex gap-6 text-sm text-gray-500">
                  <Link to="/terms" className="hover:text-gray-700">Terms</Link>
                  <Link to="/privacy" className="hover:text-gray-700">Privacy</Link>
                  <Link to="/contact" className="hover:text-gray-700">Help</Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Login;
