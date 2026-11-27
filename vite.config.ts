import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works from any subpath (e.g. GitHub Pages /<repo>/).
// Libraries go in their own chunks: they download in parallel and stay cached across deploys.
export default defineConfig({
  plugins: [react()],
  base: './',
  // stars.json / sky.json ship as JSON.parse('…'): parses faster than the same data as a JS object literal
  json: { stringify: true },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: { output: { manualChunks: { three: ['three'], r3f: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'] } } },
  },
});
