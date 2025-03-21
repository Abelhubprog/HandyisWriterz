import React, { useEffect } from 'react';

interface DebugRedirectProps {
  to: string;
  timeout?: number;
}

/**
 * A component that redirects the user by manually changing window.location
 * This is useful for debugging issues with React Router redirects
 */
const DebugRedirect: React.FC<DebugRedirectProps> = ({ 
  to, 
  timeout = 1000 
}) => {
  useEffect(() => {
    console.log(`DebugRedirect: Will redirect to ${to} in ${timeout}ms`);
    
    const timer = setTimeout(() => {
      console.log(`DebugRedirect: Redirecting to ${to} now`);
      window.location.href = to;
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [to, timeout]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p className="text-gray-600 mb-6">
          You are being redirected to <code className="bg-gray-100 px-2 py-1 rounded">{to}</code>
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full animate-[progress_1s_ease-in-out]"></div>
        </div>
        <div className="mt-4 text-center">
          <a 
            href={to} 
            className="text-blue-600 hover:underline"
          >
            Click here if you are not redirected automatically
          </a>
        </div>
      </div>
    </div>
  );
};

export default DebugRedirect; 