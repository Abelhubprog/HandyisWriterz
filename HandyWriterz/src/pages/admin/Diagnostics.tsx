/**
 * src/pages/admin/Diagnostics.tsx
 * Admin page for database diagnostics and troubleshooting
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import DatabaseDiagnostics from '../../components/DatabaseDiagnostics';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminDiagnostics from './AdminDiagnostics';

const DiagnosticsPage: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  
  // Redirect non-admin users
  if (!isLoading && (!user || !isAdmin)) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Database Diagnostics | HandyWriterz Admin</title>
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Database Diagnostics</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Advanced Diagnostics</h2>
            <DatabaseDiagnostics />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Node Environment:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{import.meta.env.MODE}</code>
              </div>
              <div>
                <span className="font-medium">Base URL:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{import.meta.env.BASE_URL}</code>
              </div>
              <div>
                <span className="font-medium">Browser:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{navigator.userAgent}</code>
              </div>
              <div>
                <span className="font-medium">Supabase URL:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">{import.meta.env.VITE_SUPABASE_URL || 'Not set in environment'}</code>
              </div>
              <div>
                <span className="font-medium">API Key Status:</span>{' '}
                <code className="bg-gray-100 px-2 py-1 rounded">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set in environment' : 'Not set in environment'}
                </code>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>
            <div className="prose max-w-none">
              <h3>Common Issues and Solutions</h3>
              
              <h4>1. CORS Errors</h4>
              <p>
                If you're seeing CORS errors in the console, you need to add your application's URL to the allowed origins in Supabase.
              </p>
              <ol className="list-decimal list-inside pl-4">
                <li>Go to the Supabase dashboard</li>
                <li>Navigate to Project Settings → API → CORS</li>
                <li>Add <code>http://localhost:5173</code> to the allowed origins</li>
                <li>Add your production URL if deploying to production</li>
              </ol>
              
              <h4>2. Database Connection Issues</h4>
              <p>
                If you're having trouble connecting to the database:
              </p>
              <ol className="list-decimal list-inside pl-4">
                <li>Verify your Supabase URL and API keys in the environment variables</li>
                <li>Check if your Supabase project is active and not in maintenance mode</li>
                <li>Run the SQL migration scripts in the correct order (see README-SERVICES.md)</li>
                <li>Check if your IP is allowed in Supabase's network restrictions</li>
              </ol>
              
              <h4>3. Authentication Problems</h4>
              <p>
                If you're experiencing authentication issues:
              </p>
              <ol className="list-decimal list-inside pl-4">
                <li>Clear your browser's local storage and cookies</li>
                <li>Sign out and sign in again</li>
                <li>Check if your user has the correct permissions in Supabase</li>
                <li>Verify that the auth configuration in supabaseClient.ts is correct</li>
              </ol>
              
              <h4>4. Missing Tables or Columns</h4>
              <p>
                If you're seeing errors about missing tables or columns:
              </p>
              <ol className="list-decimal list-inside pl-4">
                <li>Run all migration scripts in the correct order</li>
                <li>Check the SQL Editor in Supabase to verify the tables exist</li>
                <li>Run the check_tables.sql script to verify the database structure</li>
                <li>If tables exist but columns are missing, run the add_missing_columns.sql script</li>
              </ol>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Admin-Specific Diagnostics</h2>
            <AdminDiagnostics />
          </div>
        </div>
      </div>
    </>
  );
};

export default DiagnosticsPage; 