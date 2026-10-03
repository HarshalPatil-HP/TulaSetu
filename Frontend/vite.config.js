import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // In Phase 0 and early phases the manifest and service worker are
      // minimal. Phase 6 will flesh out the full offline caching strategy.
      manifest: {
        name: 'VerifyChain',
        short_name: 'VerifyChain',
        description: 'Legal Metrology Instrument Verification System',
        theme_color: '#1A56DB',
        background_color: '#F8F9FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache-first strategy for the app shell (HTML, JS, CSS bundles).
        // Network-first for API calls (handled in the frontend via Dexie/IndexedDB
        // for actual offline inspection capture — not via service worker cache).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // API calls — network-first so data is always fresh when online.
            // Falls back to a cached response when offline (for read-only data
            // like application status — not for mutation endpoints).
            urlPattern: /^https?:\/\/.*\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    // Proxy API calls to the backend in development — avoids CORS issues
    // when running both locally.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
