import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from './Dashboard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { pingSupabase } from '@/lib/supabaseClient';

const DashboardWrapper = () => {
  const { user, loading, isAdmin, userRole } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [loadingMessage, setLoadingMessage] = useState('Initializing dashboard...');
  const navigate = useNavigate();

  // Check connection status immediately
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setLoadingMessage('Checking connection...');
        const result = await pingSupabase();
        setConnectionStatus(result.success ? 'connected' : 'disconnected');
        
        if (!result.success) {
          setLoadingMessage('Connection issue detected. Retrying...');
          // Try one more time after a short delay
          setTimeout(async () => {
            const retryResult = await pingSupabase();
            setConnectionStatus(retryResult.success ? 'connected' : 'disconnected');
            setLoadingMessage(retryResult.success ? 'Loading your dashboard...' : 'Connection failed. Please refresh.');
          }, 1500);
        } else {
          setLoadingMessage('Loading your dashboard...');
        }
      } catch (error) {
        console.error('Connection check error:', error);
        setConnectionStatus('disconnected');
        setLoadingMessage('Connection failed. Please refresh.');
      }
    };
    
    checkConnection();
  }, []);

  // Handle user authentication and redirection
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user, redirect to login
        navigate('/auth/login', { replace: true, state: { from: '/dashboard' } });
      } else if (isAdmin) {
        // User is admin, redirect to admin dashboard
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, loading, isAdmin, navigate]);

  // Show optimized loading state
  if (loading || connectionStatus === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{loadingMessage}</p>
        {connectionStatus === 'disconnected' && (
          <div className="mt-4 max-w-md text-center">
            <p className="text-red-600 font-medium">Connection issue detected</p>
            <p className="text-gray-600 mt-2">
              We're having trouble connecting to our servers. This might be due to:
            </p>
            <ul className="text-gray-600 mt-2 list-disc list-inside text-left">
              <li>Your internet connection</li>
              <li>Our servers may be under maintenance</li>
              <li>Temporary network issues</li>
            </ul>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              aria-label="Refresh page"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    );
  }

  // Handle no user case (will redirect in useEffect)
  if (!user) {
    return null;
  }

  // Render dashboard for regular users
  return <Dashboard />;
};

export default DashboardWrapper; 