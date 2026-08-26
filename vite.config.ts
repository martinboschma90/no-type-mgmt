import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { bookingRequestPlugin } from './vite-plugin-booking-request.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [
      react(),
      tailwindcss(),
      bookingRequestPlugin(),
      {
        name: 'preconnect-supabase',
        transformIndexHtml(html) {
          const url = (env.VITE_SUPABASE_URL ?? '').trim()
          if (!url || url.includes('YOUR_PROJECT')) return html
          const origin = url.replace(/\/$/, '')
          return html.replace(
            '<head>',
            `<head>\n    <link rel="preconnect" href="${origin}" crossorigin />`,
          )
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: ['es2019', 'safari14'],
      cssCodeSplit: true,
      modulePreload: {
        resolveDependencies(_filename, deps) {
          return deps.filter(
          (dep) => !/\/(supabase|motion)-[^/]+$/.test(dep),
        )
        },
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
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
