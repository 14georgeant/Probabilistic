import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Robustly capture the API key from environment variables only.
  const apiKey = env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || env.REACT_APP_API_KEY;

  return {
    plugins: [react()],
    define: {
      // Define process.env as a complete object.
      // This ensures 'process.env.API_KEY' resolves correctly in the browser bundle.
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