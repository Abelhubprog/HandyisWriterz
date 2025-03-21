import { getConnectionStatus, pingSupabase, checkForCorsIssues, checkEnvironmentConfig } from './supabaseClient';

/**
 * Comprehensive diagnostic tool for Supabase connection issues
 * Runs a series of tests to identify common problems
 */
export async function runSupabaseDiagnostics() {
  console.log('🔍 Running Supabase diagnostics...');
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    duration: 0,
    tests: {} as Record<string, any>,
    issues: [] as string[],
    recommendations: [] as string[],
    summary: '',
    success: false
  };

  try {
    // Test 1: Environment configuration
    console.log('📋 Checking environment configuration...');
    const envCheck = checkEnvironmentConfig();
    results.tests.environment = envCheck;
    
    if (envCheck.hasIssues) {
      results.issues.push(...envCheck.issues.map(issue => `Environment: ${issue}`));
      results.recommendations.push('Check your .env file and ensure all Supabase configuration is correct');
    }

    // Test 2: Basic connectivity (ping)
    console.log('🔌 Testing basic connectivity...');
    const pingResult = await pingSupabase();
    results.tests.ping = pingResult;
    
    if (!pingResult.success) {
      results.issues.push(`Connectivity: Cannot ping Supabase - ${pingResult.error}`);
      results.recommendations.push('Check your internet connection and Supabase project status');
    }

    // Test 3: CORS issues
    console.log('🌐 Checking for CORS issues...');
    const corsCheck = await checkForCorsIssues();
    results.tests.cors = corsCheck;
    
    if (corsCheck.hasCorsIssues) {
      results.issues.push('CORS: Cross-Origin Resource Sharing issues detected');
      results.recommendations.push(
        'Add your application origin to the allowed origins in your Supabase project settings',
        'Check that your fetch requests use the correct credentials mode'
      );
    }

    // Test 4: Full connection check
    console.log('🔄 Performing full connection check...');
    const connectionStatus = await getConnectionStatus();
    results.tests.connection = connectionStatus;
    
    if (!connectionStatus.connected) {
      results.issues.push(`Connection: ${connectionStatus.error}`);
      
      if (connectionStatus.details?.apiReachable && !connectionStatus.details?.databaseConnected) {
        results.recommendations.push('API is reachable but database queries are failing. Check your database permissions and RLS policies');
      } else if (!connectionStatus.details?.apiReachable) {
        results.recommendations.push('Cannot reach Supabase API. Check your project URL and API keys');
      }
    }

    // Test 5: Browser compatibility
    if (typeof window !== 'undefined') {
      console.log('🌍 Checking browser compatibility...');
      const isPrivateMode = await detectPrivateBrowsing();
      results.tests.browser = {
        userAgent: window.navigator.userAgent,
        isPrivateMode,
        localStorage: testLocalStorage(),
        indexedDB: await testIndexedDB(),
        cookies: testCookies()
      };
      
      if (isPrivateMode) {
        results.issues.push('Browser: Private/Incognito mode detected');
        results.recommendations.push('Try using a regular browsing window, as some storage features may be limited in private mode');
      }
      
      if (!results.tests.browser.localStorage) {
        results.issues.push('Browser: LocalStorage not available');
        results.recommendations.push('Ensure cookies and site data are enabled in your browser settings');
      }
    }

    // Generate summary
    results.success = results.issues.length === 0;
    results.duration = Date.now() - startTime;
    
    if (results.success) {
      results.summary = 'All Supabase connection tests passed successfully! ✅';
    } else {
      results.summary = `Found ${results.issues.length} issues with your Supabase connection. Check the recommendations for solutions.`;
    }
    
    console.log(`✅ Diagnostics completed in ${results.duration}ms`);
    return results;
  } catch (err) {
    console.error('❌ Error running Supabase diagnostics:', err);
    
    results.duration = Date.now() - startTime;
    results.success = false;
    results.issues.push(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    results.summary = 'Diagnostics failed due to an unexpected error';
    
    return results;
  }
}

/**
 * Detect if the browser is in private/incognito mode
 */
async function detectPrivateBrowsing(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  return new Promise(resolve => {
    const db = window.indexedDB.open('test');
    db.onerror = () => resolve(true);
    db.onsuccess = () => resolve(false);
  });
}

/**
 * Test if localStorage is available
 */
function testLocalStorage(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '_supabase_test_';
    window.localStorage.setItem(testKey, 'test');
    const result = window.localStorage.getItem(testKey) === 'test';
    window.localStorage.removeItem(testKey);
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Test if IndexedDB is available
 */
async function testIndexedDB(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.indexedDB) return false;
  
  return new Promise(resolve => {
    try {
      const request = window.indexedDB.open('_supabase_test_', 1);
      request.onerror = () => resolve(false);
      request.onsuccess = () => {
        const db = request.result;
        db.close();
        window.indexedDB.deleteDatabase('_supabase_test_');
        resolve(true);
      };
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Test if cookies are available
 */
function testCookies(): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    const testKey = '_supabase_test_';
    document.cookie = `${testKey}=test; path=/; max-age=60`;
    const result = document.cookie.indexOf(testKey) !== -1;
    document.cookie = `${testKey}=; path=/; max-age=0`;
    return result;
  } catch (e) {
    return false;
  }
}

/**
 * Generate a troubleshooting guide based on diagnostic results
 */
export function generateTroubleshootingGuide(diagnosticResults: any): string {
  if (diagnosticResults.success) {
    return `
# Supabase Connection Troubleshooting

✅ Good news! All Supabase connection tests passed successfully.

## Connection Details
- API Reachable: ${diagnosticResults.tests.connection?.details?.apiReachable ? 'Yes ✅' : 'No ❌'}
- Database Connected: ${diagnosticResults.tests.connection?.details?.databaseConnected ? 'Yes ✅' : 'No ❌'}
- Latency: ${diagnosticResults.tests.ping?.latency || 'N/A'} ms
- Supabase URL: ${diagnosticResults.tests.environment?.config?.supabaseUrl || 'N/A'}

If you're still experiencing issues, please check your application code for logical errors.
    `;
  }
  
  // Generate guide for issues
  let guide = `
# Supabase Connection Troubleshooting

❌ Found ${diagnosticResults.issues.length} issues with your Supabase connection.

## Issues Detected
${diagnosticResults.issues.map((issue: string) => `- ${issue}`).join('\n')}

## Recommendations
${diagnosticResults.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## Detailed Diagnostics

`;

  // Add environment section
  if (diagnosticResults.tests.environment) {
    guide += `
### Environment Configuration
- Supabase URL: ${diagnosticResults.tests.environment.config.supabaseUrl || 'Not set ❌'}
- Anon Key: ${diagnosticResults.tests.environment.config.hasAnonKey ? 'Set ✅' : 'Not set ❌'}
- Service Role Key: ${diagnosticResults.tests.environment.config.hasServiceKey ? 'Set ✅' : 'Not set ❌'}
- Mode: ${diagnosticResults.tests.environment.config.mode}
- Environment: ${diagnosticResults.tests.environment.config.isDevelopment ? 'Development' : 'Production'}
`;
  }

  // Add CORS section
  if (diagnosticResults.tests.cors) {
    guide += `
### CORS Check
- CORS Issues Detected: ${diagnosticResults.tests.cors.hasCorsIssues ? 'Yes ❌' : 'No ✅'}
- Any Successful Tests: ${diagnosticResults.tests.cors.anySuccessful ? 'Yes ✅' : 'No ❌'}
- Recommendation: ${diagnosticResults.tests.cors.recommendation}
`;
  }

  // Add connection section
  if (diagnosticResults.tests.connection) {
    guide += `
### Connection Status
- API Reachable: ${diagnosticResults.tests.connection.details?.apiReachable ? 'Yes ✅' : 'No ❌'}
- Database Connected: ${diagnosticResults.tests.connection.details?.databaseConnected ? 'Yes ✅' : 'No ❌'}
- Error: ${diagnosticResults.tests.connection.error || 'None'}
`;
  }

  // Add browser section
  if (diagnosticResults.tests.browser) {
    guide += `
### Browser Environment
- User Agent: ${diagnosticResults.tests.browser.userAgent}
- Private/Incognito Mode: ${diagnosticResults.tests.browser.isPrivateMode ? 'Yes (may cause issues) ⚠️' : 'No ✅'}
- LocalStorage Available: ${diagnosticResults.tests.browser.localStorage ? 'Yes ✅' : 'No ❌'}
- IndexedDB Available: ${diagnosticResults.tests.browser.indexedDB ? 'Yes ✅' : 'No ❌'}
- Cookies Available: ${diagnosticResults.tests.browser.cookies ? 'Yes ✅' : 'No ❌'}
`;
  }

  guide += `
## Next Steps

1. Review the recommendations above
2. Check the Supabase status page: https://status.supabase.com/
3. Verify your project settings in the Supabase dashboard
4. Check browser console for additional error messages
5. If issues persist, try the following:
   - Clear browser cache and cookies
   - Try a different browser
   - Check if your network blocks any required connections
   - Verify your database is online and accessible

Diagnostic run completed at: ${diagnosticResults.timestamp}
`;

  return guide;
} 