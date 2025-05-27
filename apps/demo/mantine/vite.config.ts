import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import path from 'path'; // Not strictly necessary if not using path.resolve for alias

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This alias should align with tsconfig.json paths for consistency.
      // If your monorepo setup (e.g., via pnpm workspaces or yarn workspaces)
      // handles resolution of "responsive-tab-menu-react" correctly,
      // this explicit alias might not be needed.
      // However, if you encounter issues, uncommenting and correctly
      // pathing this can resolve them.
      // 'responsive-tab-menu-react': path.resolve(__dirname, '../../packages/react/src')
    }
  }
});
