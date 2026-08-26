import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { bookingRequestPlugin } from './vite-plugin-booking-request.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    bookingRequestPlugin(),
    {
      name: 'safari-paint-first',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
          const moved: string[] = []
          html = html.replace(
            /<script type="module"[^>]*><\/script>\s*/g,
            (tag) => {
              moved.push(tag.trim())
              return ''
            },
          )
          if (moved.length) {
            html = html.replace('</body>', `    ${moved.join('\n    ')}\n  </body>`)
          }
          return html
        },
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
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Keep this off the public index chunk so CmsApp does not import index
          // (circular lazy load → blank CMS on production).
          if (id.includes('/components/layout/ScrollToTop')) return 'scroll-top'
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('react-router')) return 'router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'react'
        },
      },
    },
  },
})
