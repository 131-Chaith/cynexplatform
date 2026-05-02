import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: false,
        proxy: {
            '/api': {
                target: 'http://localhost:5002',
                changeOrigin: true,
            }
        }
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react')) return 'vendor-react';
                        if (id.includes('lucide-react')) return 'vendor-icons';
                        if (id.includes('recharts')) return 'vendor-charts';
                        if (id.includes('framer-motion')) return 'vendor-animation';
                        return 'vendor';
                    }
                }
            }
        },
        sourcemap: false
    }
})
