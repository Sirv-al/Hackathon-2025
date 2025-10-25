import { defineConfig } from 'vite'

export default defineConfig({
  root: 'views', // <-- point to the folder containing index.html
  publicDir: '../public',
  assetsInclude: ['**/*.glb'],  // Add GLB files to the asset include list
  build: {
    outDir: '../dist', // optional: where build output goes
    emptyOutDir: true,
  },
  server: {
    port: 3000, // Vite dev server port
    proxy: {
      '/ai_response': 'http://localhost:8080'  // Proxy API requests to Node.js server
    }
  }
})