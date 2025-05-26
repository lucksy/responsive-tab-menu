import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensure this matches the tsconfig paths for consistency if needed,
      // though Vite often works well with project references for local package linking.
      // 'responsive-tab-menu-react': path.resolve(__dirname, '../../packages/react/src')
    }
  }
})
