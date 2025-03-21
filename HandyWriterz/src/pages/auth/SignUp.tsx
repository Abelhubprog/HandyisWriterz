import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SignUp as ClerkSignUp, useClerk, useUser } from '@clerk/clerk-react';
import HandyWriterzLogo from '@/components/HandyWriterzLogo';
import { Shield, UserPlus, CheckSquare, ArrowRight, PenLine, Clock, BadgePercent, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useClerk();
  const { isLoaded } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (isLoaded && session) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        toast.success('Already logged in');
        navigate('/dashboard');
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [session, navigate, isLoaded]);

  // Custom benefits component
  const BenefitItem = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <motion.div 
      whileHover={{ x: 5 }}
      className="flex items-center gap-3"
    >
      <div className="bg-green-500 p-1 rounded-md">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <span className="text-blue-100">{title}</span>
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
          <Link to="/" className="text-white text-3xl font-bold mb-6 block">
            <HandyWriterzLogo className="h-10 w-auto text-white" />
          </Link>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Join HandyWriterz
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-blue-100 text-lg mb-8"
          >
            Create an account to access premium academic writing services. 
            Get personalized assistance from our expert team of writers.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-800/50 backdrop-blur-sm p-6 rounded-xl border border-blue-700/50"
          >
            <h3 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
              <CheckSquare className="h-5 w-5 text-green-400" />
              Benefits of Membership
            </h3>
            <div className="space-y-3 mb-2">
              <BenefitItem icon={Clock} title="Track your orders in real-time" />
              <BenefitItem icon={PenLine} title="Direct communication with writers" />
              <BenefitItem icon={BadgePercent} title="Access to exclusive discounts" />
              <BenefitItem icon={Star} title="Save favorite writers for future projects" />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex gap-4"
          >
            <Link 
              to="/services" 
              className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors"
            >
              <span>Our Services</span>
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
      
      {/* Right side - Clerk SignUp component */}
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
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Create Account</h2>
                </div>
              </div>
              
              {/* Clerk SignUp component */}
              <ClerkSignUp 
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
                path="/sign-up"
                signInUrl="/sign-in"
                redirectUrl="/dashboard"
              />
              
              {/* Add our own sign-in link for consistency with the login page */}
              <div className="p-6 pt-0 border-t border-gray-100">
                <div className="text-center text-gray-600 text-sm">
                  Already have an account?{' '}
                  <Link to="/sign-in" className="text-blue-600 hover:text-blue-800 font-medium">
                    Sign in
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Admin Portal Link */}
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
        </div>
      </div>
    </motion.div>
  );
};

export default SignUp;