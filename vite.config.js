import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serve o site em /<repo>/; o workflow define VITE_BASE. Local e dev continuam em '/'.
  base: process.env.VITE_BASE || '/',
  server: { port: 5173, strictPort: true },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Three.js em chunk proprio (carregado so com o Prism3D lazy)
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'react';
          return undefined;
        },
      },
      input: {
        main: resolve(__dirname, 'index.html'),
        preview: resolve(__dirname, 'preview.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
