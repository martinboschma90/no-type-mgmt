import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { bookingRequestPlugin } from './vite-plugin-booking-request.js'
import { cmsUsersPlugin } from './vite-plugin-cms-users.ts'
import { publicBootPlugin } from './vite-plugin-public-boot.ts'
import { siteLivePlugin } from './vite-plugin-site-live.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
      bookingRequestPlugin(),
      cmsUsersPlugin(env),
      publicBootPlugin(env),
      siteLivePlugin(env),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api/analytics': {
          target: 'https://no-type-mgmt.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      target: ['es2019', 'safari14'],
      cssCodeSplit: true,
      modulePreload: {
        polyfill: false,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/components/layout/ScrollToTop')) return 'scroll-top'
            if (!id.includes('node_modules')) return
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          },
        },
      },
    },
  }
})
