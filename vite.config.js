import { defineConfig } from 'vite'

export default defineConfig({
  root: 'views',
  publicDir: '../public',
  assetsInclude: ['**/*.glb'],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Add these for better production builds
    minify: 'esbuild',
    sourcemap: false
  },
  server: {
    port: 3000,
    proxy: {
      '/ai_response': 'http://localhost:8080'
    }
  }
})