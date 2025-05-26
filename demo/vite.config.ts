import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'responsive-tab-menu': path.resolve(__dirname, '../package/index.ts')
    },
    dedupe: ['@emotion/react']
  },
  optimizeDeps: {
    include: ['responsive-tab-menu', '@emotion/react']
  }
});
