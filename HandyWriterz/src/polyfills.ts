// Global process polyfill
if (typeof window !== 'undefined') {
  // Ensure process exists
  if (!window.process) {
    window.process = {} as any;
  }
  
  // Ensure process.env exists
  if (!window.process.env) {
    window.process.env = {
      NODE_ENV: import.meta.env.MODE,
      VITE_DYNAMIC_ENVIRONMENT_ID: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID
    };
  }

  // Copy all VITE_ prefixed env variables
  Object.keys(import.meta.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      window.process.env[key] = import.meta.env[key];
    }
  });
}

// Add globalThis polyfill
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

export {};
