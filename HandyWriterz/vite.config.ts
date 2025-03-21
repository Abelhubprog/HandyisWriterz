import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure Vite to use .env.local file with higher priority
export default defineConfig(({ mode }) => {
  // Explicitly load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log env loading process (debug only)
  console.log(`Loading environment for mode: ${mode}`);
  
  // Check for .env files
  const envFiles = ['.env', '.env.local', `.env.${mode}`];
  envFiles.forEach(file => {
    try {
      if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`Found ${file}`);
      }
    } catch (e) {
      console.log(`Error checking for ${file}:`, e);
    }
  });

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/utils': path.resolve(__dirname, './src/lib/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/styles': path.resolve(__dirname, './src/styles'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/contexts': path.resolve(__dirname, './src/contexts'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/assets': path.resolve(__dirname, './src/assets')
      },
    },
    // Define environment variables
    define: {
      // Expose loaded env vars to the client
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || 'https://thvgjcnrlfofioagjydk.supabase.co'
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodmdqY25ybGZvZmlvYWdqeWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNjYzMDAsImV4cCI6MjA1Njg0MjMwMH0.OmWI-itN_xok_fKFxfID1ew7sKO843-jsylapBCqvvg'
      ),
    },
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-components': [
              '@/components/ui/button',
              '@/components/ui/card',
              '@/components/ui/input',
              '@/components/ui/textarea',
              '@/components/ui/label',
            ],
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'class-variance-authority',
        'clsx',
        'tailwind-merge'
      ],
    },
  };
});
