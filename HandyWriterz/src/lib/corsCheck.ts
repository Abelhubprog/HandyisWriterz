/**
 * src/lib/corsCheck.ts
 * Utility to diagnose CORS issues with Supabase
 */

import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';

interface CorsCheckResult {
  success: boolean;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  error?: string;
  headers?: Record<string, string>;
}

/**
 * Performs a series of tests to diagnose CORS issues
 */
export async function diagnoseCorsIssues(): Promise<{
  results: CorsCheckResult[];
  summary: string;
  hasCorsIssues: boolean;
}> {
  const results: CorsCheckResult[] = [];
  let hasCorsIssues = false;

  console.log('Starting CORS diagnostics...');
  
  // Test 1: Simple fetch with no credentials
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    results.push({
      success: response.ok,
      method: 'GET',
      url: `${supabaseUrl}/rest/v1/`,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (!response.ok) hasCorsIssues = true;
  } catch (error) {
    results.push({
      success: false,
      method: 'GET',
      url: `${supabaseUrl}/rest/v1/`,
      error: error instanceof Error ? error.message : String(error),
    });
    hasCorsIssues = true;
  }
  
  // Test 2: OPTIONS preflight request
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/service_pages?select=id`, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'apikey,content-type',
      },
      mode: 'cors',
    });
    
    results.push({
      success: response.ok,
      method: 'OPTIONS',
      url: `${supabaseUrl}/rest/v1/service_pages?select=id`,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });
    
    if (!response.ok) hasCorsIssues = true;
  } catch (error) {
    results.push({
      success: false,
      method: 'OPTIONS',
      url: `${supabaseUrl}/rest/v1/service_pages?select=id`,
      error: error instanceof Error ? error.message : String(error),
    });
    hasCorsIssues = true;
  }
  
  // Test 3: Direct Supabase client query
  try {
    const { data, error } = await supabase
      .from('service_pages')
      .select('id')
      .limit(1);
      
    results.push({
      success: !error,
      method: 'Supabase Client',
      url: `${supabaseUrl}/rest/v1/service_pages?select=id&limit=1`,
      error: error ? error.message : undefined,
    });
    
    if (error) hasCorsIssues = true;
  } catch (error) {
    results.push({
      success: false,
      method: 'Supabase Client',
      url: `${supabaseUrl}/rest/v1/service_pages?select=id&limit=1`,
      error: error instanceof Error ? error.message : String(error),
    });
    hasCorsIssues = true;
  }
  
  // Generate summary
  let summary = '';
  if (hasCorsIssues) {
    summary = 'CORS issues detected. Please check the following:\n';
    summary += '1. Ensure your Supabase project has the correct CORS origins set\n';
    summary += '   - Go to Project Settings > API > CORS Origins\n';
    summary += `   - Add http://localhost:5173 and your production URL\n`;
    summary += '2. Check that your browser extensions are not blocking requests\n';
    summary += '3. Verify that your Supabase URL and API keys are correct\n';
  } else {
    summary = 'No CORS issues detected. If you are still experiencing problems, check:\n';
    summary += '1. Authentication state and token expiration\n';
    summary += '2. Row Level Security (RLS) policies\n';
    summary += '3. Network connectivity and firewall settings\n';
  }
  
  return {
    results,
    summary,
    hasCorsIssues,
  };
}

/**
 * Runs the CORS diagnostics and logs the results
 */
export async function runCorsCheck(): Promise<void> {
  console.log('Running CORS diagnostics...');
  
  try {
    const { results, summary, hasCorsIssues } = await diagnoseCorsIssues();
    
    console.log('=== CORS Diagnostics Results ===');
    console.log(`CORS Issues Detected: ${hasCorsIssues ? 'YES' : 'NO'}`);
    console.log('\nTest Results:');
    results.forEach((result, index) => {
      console.log(`\nTest ${index + 1}: ${result.method} ${result.url}`);
      console.log(`Success: ${result.success ? 'YES' : 'NO'}`);
      if (result.status) console.log(`Status: ${result.status} ${result.statusText}`);
      if (result.error) console.log(`Error: ${result.error}`);
      if (result.headers) {
        console.log('Response Headers:');
        Object.entries(result.headers).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    });
    
    console.log('\nSummary:');
    console.log(summary);
  } catch (error) {
    console.error('Error running CORS diagnostics:', error);
  }
}

// Export a function to fix common CORS issues
export async function fixCommonCorsIssues(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Check if we can access the Supabase API
    const { data: healthData, error: healthError } = await supabase.rpc('check_connection');
    
    if (healthError) {
      console.warn('Could not verify connection:', healthError);
    }
    
    // Clear browser storage to reset any problematic tokens
    try {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');
      
      // Clear any other auth-related storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Sign out the current user to reset the session
      await supabase.auth.signOut();
      
      return {
        success: true,
        message: 'Successfully cleared auth tokens and signed out. Please refresh the page and try again.'
      };
    } catch (storageError) {
      console.error('Error clearing storage:', storageError);
      return {
        success: false,
        message: `Failed to clear storage: ${storageError instanceof Error ? storageError.message : String(storageError)}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to fix CORS issues: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 