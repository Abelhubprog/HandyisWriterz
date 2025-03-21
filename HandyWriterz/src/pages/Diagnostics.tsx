/**
 * src/pages/Diagnostics.tsx
 * Standalone diagnostics page for troubleshooting database issues
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/context/SupabaseContext';

const Diagnostics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { supabase, isInitialized } = useSupabase();

  React.useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  const runDiagnostics = async () => {
    try {
      // Test database connection
      const { data, error } = await supabase
        .from('health_check')
        .select('*')
        .limit(1);

      if (error) {
        throw error;
      }

      toast.success('All systems operational');
    } catch (error) {
      toast.error('System check failed. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">System Diagnostics</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Database Connection:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${isInitialized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isInitialized ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Authentication:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${user ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {user ? 'Authenticated' : 'Not Authenticated'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={runDiagnostics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Run System Check
          </button>
        </div>
      </div>
    </div>
  );
};

export default Diagnostics;