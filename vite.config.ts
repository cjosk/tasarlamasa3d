import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Vite configuration tuned for the "index.html in project root" layout (Option 2).
// The react plugin powers the JSX transform and fast refresh, while the alias
// lets us import modules from `src` using the conventional `@/` prefix.
export default defineConfig({
  root: '.',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  optimizeDeps: {
    include: ['three/examples/jsm/loaders/GLTFLoader']
  }
});
