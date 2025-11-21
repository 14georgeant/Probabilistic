import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Robustly capture the API key from various possible environment variable names
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || env.REACT_APP_API_KEY;

  return {
    plugins: [react()],
    define: {
      // Define process.env as a single object containing the key.
      // This prevents issues where 'process.env' is undefined or empty in browser contexts.
      'process.env': JSON.stringify({
        API_KEY: apiKey,
        NODE_ENV: mode,
      }),
    },
    build: {
      chunkSizeWarningLimit: 1600
    }
  };
});