import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, './', '');
  const apiPort = env.VITE_DEV_API_PORT || '5050';

  return {
    plugins: [react()],

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
            'vendor-charts': ['recharts'],
            'vendor-icons': ['lucide-react'],
            'vendor-misc': ['react-hot-toast', 'canvas-confetti', 'xlsx'],
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'https://practicalbackend.paperless.et',
           changeOrigin: true,
          secure: false,
          headers: {
            'Host': 'practicalbackend.paperless.et',
            'Connection': 'keep-alive',
          },
        },
        '/uploads': {
          target: 'https://practicalbackend.paperless.et',
          changeOrigin: true,
          secure: false,
          headers: {
            'Host': 'practicalbackend.paperless.et',
          },
        },
      },
    },
  };
});
