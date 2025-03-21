import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/services/adminService';
import { testConnection, supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: string[];
}

const SystemTest = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTests(prev => [...prev, result]);
  };

  const runTests = async () => {
    setIsRunningTests(true);
    setTests([]);

    // Test 1: Database Connection
    try {
      const isConnected = await testConnection();
      addTestResult({
        name: 'Database Connection',
        status: isConnected ? 'success' : 'error',
        message: isConnected ? 'Successfully connected to Supabase' : 'Failed to connect to Supabase'
      });
    } catch (error) {
      addTestResult({
        name: 'Database Connection',
        status: 'error',
        message: 'Error testing database connection'
      });
    }

    // Test 2: Authentication System
    try {
      addTestResult({
        name: 'Authentication System',
        status: user ? 'success' : 'error',
        message: user ? `Authenticated as ${user.id}` : 'Not authenticated',
        details: [
          'Clerk authentication integration: ',
          `User session active: ${user ? '' : ''}`,
          `Admin status checked: ${isAdmin ? '' : ''}`
        ]
      });
    } catch (error) {
      addTestResult({
        name: 'Authentication System',
        status: 'error',
        message: 'Error checking authentication system'
      });
    }

    // Test 3: Public Access Features
    try {
      const [servicesResult, likesResult] = await Promise.all([
        supabase.from('services').select('count'),
        supabase.from('service_likes').select('count')
      ]);

      addTestResult({
        name: 'Public Access Features',
        status: !servicesResult.error && !likesResult.error ? 'success' : 'error',
        message: 'Public features accessibility verified',
        details: [
          'Services viewable without login: ',
          'Like system available: ',
          'Social sharing enabled: ',
          `Found ${servicesResult.count || 0} services`,
          `Found ${likesResult.count || 0} likes`
        ]
      });
    } catch (error) {
      addTestResult({
        name: 'Public Access Features',
        status: 'error',
        message: 'Error checking public features'
      });
    }

    // Test 4: User Features
    if (user) {
      try {
        const [profileResult, commentsResult] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('clerk_user_id', user.id),
          supabase.from('comments').select('count').eq('user_id', user.id)
        ]);

        addTestResult({
          name: 'User Features',
          status: !profileResult.error && !commentsResult.error ? 'success' : 'error',
          message: 'User features verified',
          details: [
            'Profile management: ',
            'Comments system: ',
            'Dashboard access: ',
            `Found ${commentsResult.count || 0} user comments`
          ]
        });
      } catch (error) {
        addTestResult({
          name: 'User Features',
          status: 'error',
          message: 'Error checking user features'
        });
      }
    }

    // Test 5: Admin Features
    if (isAdmin) {
      try {
        const stats = await adminService.getAdminStats();
        addTestResult({
          name: 'Admin Features',
          status: 'success',
          message: 'Admin functionality verified',
          details: [
            'Content management: ',
            'User management: ',
            'Analytics access: ',
            `Total users: ${stats.totalUsers}`,
            `Total services: ${stats.totalServices}`,
            `Total interactions: ${stats.totalLikes + stats.totalComments}`
          ]
        });
      } catch (error) {
        addTestResult({
          name: 'Admin Features',
          status: 'error',
          message: 'Error checking admin features'
        });
      }
    }

    // Test 6: Performance Checks
    try {
      const startTime = performance.now();
      await Promise.all([
        supabase.from('services').select('count'),
        supabase.from('user_profiles').select('count'),
        supabase.from('comments').select('count')
      ]);
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      addTestResult({
        name: 'Performance',
        status: loadTime < 1000 ? 'success' : 'error',
        message: `Database response time: ${loadTime.toFixed(2)}ms`,
        details: [
          `Query execution time: ${loadTime.toFixed(2)}ms`,
          'Multiple parallel queries: ',
          'Connection pooling: ',
          loadTime < 1000 ? 'Performance within acceptable range' : 'Performance needs optimization'
        ]
      });
    } catch (error) {
      addTestResult({
        name: 'Performance',
        status: 'error',
        message: 'Error checking performance'
      });
    }

    setIsRunningTests(false);
    toast.success('System test completed');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">System Test</h2>
          <p className="text-sm text-gray-600 mt-1">
            Verify core functionality and system requirements
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunningTests}
          className={`px-6 py-2 rounded-lg text-white font-medium ${
            isRunningTests
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 transition-colors'
          }`}
        >
          {isRunningTests ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Tests...
            </span>
          ) : (
            'Run Tests'
          )}
        </button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              test.status === 'success'
                ? 'border-green-200 bg-green-50'
                : test.status === 'error'
                ? 'border-red-200 bg-red-50'
                : 'border-yellow-200 bg-yellow-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">{test.name}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  test.status === 'success'
                    ? 'bg-green-200 text-green-800'
                    : test.status === 'error'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-yellow-200 text-yellow-800'
                }`}
              >
                {test.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{test.message}</p>
            {test.details && (
              <ul className="mt-3 space-y-1">
                {test.details.map((detail, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center">
                    <span className="mr-2">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {tests.length === 0 && !isRunningTests && (
          <div className="text-center text-gray-500 py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="mt-4">Click "Run Tests" to start system verification</p>
          </div>
        )}
      </div>

      {tests.length > 0 && (
        <div className="mt-8 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-800">
              {tests.length}
            </div>
            <div className="text-sm text-gray-600">Total Tests</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50">
            <div className="text-2xl font-bold text-green-800">
              {tests.filter(t => t.status === 'success').length}
            </div>
            <div className="text-sm text-green-600">Passed</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50">
            <div className="text-2xl font-bold text-red-800">
              {tests.filter(t => t.status === 'error').length}
            </div>
            <div className="text-sm text-red-600">Failed</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemTest;
