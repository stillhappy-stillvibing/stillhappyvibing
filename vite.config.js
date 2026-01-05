import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'Happiness Tracker',
        short_name: 'Happiness Tracker',
        description: 'Track what makes you smile with gratitude journaling and mindfulness',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Quick Check-in',
            short_name: 'Check In',
            description: 'Record what makes you happy right now',
            url: '/?action=checkin',
            icons: [{ src: 'pwa-512x512.svg', sizes: '512x512' }]
          },
          {
            name: 'Gratitude Journal',
            short_name: 'Journal',
            description: 'View your gratitude entries',
            url: '/?action=journal',
            icons: [{ src: 'pwa-512x512.svg', sizes: '512x512' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Don't cache API calls
        navigateFallbackDenylist: [/^\/api/],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting - activate new SW immediately
        skipWaiting: true,
        clientsClaim: true
      },
      // Check for updates more frequently
      devOptions: {
        enabled: false
      }
    })
  ]
})
