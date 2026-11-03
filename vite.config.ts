import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works from any subpath (e.g. GitHub Pages /<repo>/).
// Libraries go in their own chunks: they download in parallel and stay cached across deploys.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: { output: { manualChunks: { three: ['three'], r3f: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'] } } },
  },
});
