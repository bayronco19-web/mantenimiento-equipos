import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-*.png'],
      manifest: {
        name: 'CMMS - Mantenimiento Industrial',
        short_name: 'CMMS',
        description: 'Sistema de Gestión de Mantenimiento de Equipos',
        theme_color: '#1e3a5f',
        background_color: '#1e3a5f',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          { src: '/icon-72.png',  sizes: '72x72',   type: 'image/png' },
          { src: '/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: '/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['business', 'productivity', 'utilities'],
        shortcuts: [
          {
            name: 'Escanear equipo',
            short_name: 'Escanear',
            description: 'Abrir cámara para escanear QR de equipo',
            url: '/scan',
            icons: [{ src: '/icon-96.png', sizes: '96x96' }],
          },
          {
            name: 'Órdenes de trabajo',
            short_name: 'OT',
            description: 'Ver órdenes de trabajo pendientes',
            url: '/work-orders',
            icons: [{ src: '/icon-96.png', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/equipment/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'equipment-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/static\/photos/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photos-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/static\/qr/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'qr-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/static': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
