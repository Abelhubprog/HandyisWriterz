import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Toaster } from '@/components/ui/toaster';
import Footer from '@/components/layouts/Footer';
import { useServices } from '@/hooks/useServices';
import { Linkedin, Twitter, Instagram } from 'lucide-react';
import { AuthProvider } from '@/providers/AuthProvider';
import { ServicesProvider } from '@/providers/ServicesProvider';

const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Wrap content with providers */}
      <AuthProvider>
        <ServicesProvider>
          {/* Main Content */}
          <main className="flex-grow">
            <Outlet />
          </main>

          {/* Toaster for notifications */}
          <Toaster />

          {/* Enhanced Footer */}
          <footer className="bg-[#0F172A] text-gray-300">
            <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
              {/* Logo and Description Section */}
              <div className="mb-16">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">H</span>
                  </div>
                  <span className="ml-4 text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                    HandyWriterz
                  </span>
                </div>
                <p className="mt-4 text-gray-400 text-lg">
                  Your Academic Success Partner
                </p>
                <div className="mt-6 flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Linkedin className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Twitter className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Instagram className="w-6 h-6" />
                  </a>
                </div>
              </div>

              {/* Footer Links Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
                {/* Services Column */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-8">Services</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link to="/services/adult-health-nursing" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                        Adult Health Nursing
                      </Link>
                    </li>
                    <li>
                      <Link to="/services/mental-health-nursing" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                        Mental Health Nursing
                      </Link>
                    </li>
                    <li>
                      <Link to="/services/child-nursing" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                        Child Nursing
                      </Link>
                    </li>
                    <li>
                      <Link to="/services/special-education" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                        Special Education
                      </Link>
                    </li>
                    <li>
                      <Link to="/services/social-work" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                        Social Work
                      </Link>
                    </li>
                    <li>
                      <Link to="/services/advanced-practice-nursing" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                        Advanced Practice Nursing
                      </Link>
                    </li>
                    <li>
                      <Link to="/services/crypto" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
                        Crypto
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Support Column */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-8">Support</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link to="/how-it-works" className="text-gray-400 hover:text-white transition-colors">
                        How It Works
                      </Link>
                    </li>
                    <li>
                      <Link to="/faq" className="text-gray-400 hover:text-white transition-colors">
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                        Contact Us
                      </Link>
                    </li>
                    <li>
                      <Link to="/support" className="text-gray-400 hover:text-white transition-colors">
                        24/7 Support
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Quick Links Column */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-8">Quick Links</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link to="/tools/check-turnitin" className="text-gray-400 hover:text-white transition-colors">
                        Check Turnitin
                      </Link>
                    </li>
                    <li>
                      <Link to="/learning-hub" className="text-gray-400 hover:text-white transition-colors">
                        LearningHub
                      </Link>
                    </li>
                    <li>
                      <Link to="/payment" className="text-gray-400 hover:text-white transition-colors">
                        Payment
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Company Column */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-8">Company</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                        Contact
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="pt-8 mt-8 border-t border-gray-800/50">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} HandyWriterz. All rights reserved.
                  </p>
                  <div className="mt-4 md:mt-0 flex space-x-8">
                    <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                      Privacy Policy
                    </Link>
                    <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                      Terms of Service
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </ServicesProvider>
      </AuthProvider>
    </div>
  );
};

export default RootLayout;