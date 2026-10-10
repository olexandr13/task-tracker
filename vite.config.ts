import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  // Baked in from package.json (MAJOR.MINOR.PATCH), so Settings can show which build is open.
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [
    react(),
    tailwindcss(),
    // The app itself opens offline: a service worker keeps every built file in the
    // browser and answers from it, so a refresh or a cold start with no
    // connection still gets the app. The tasks come from Firestore's own offline
    // copy (src/storage/firebaseApp.ts). Built only — `npm run dev` has none.
    //
    // A new version is fetched in the background and takes over at once, but the
    // page already open keeps running the one it loaded: the new one arrives on
    // the next open or refresh, never by reloading the page mid-edit.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PickMe',
        short_name: 'PickMe',
        description: 'A task tracker that turns getting things done into a game.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // The icon's own background, so the splash screen reads as the icon.
        background_color: '#171717',
        theme_color: '#171717',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // What "takes over at once" above rests on. `autoUpdate` only turns these on
        // with the default `injectRegister`; without them a new version waits until
        // every open copy of the app is closed, which an installed app on a phone
        // may never be.
        skipWaiting: true,
        clientsClaim: true,
        // Firebase's sign-in pages live under `/__/` when served from the app's own
        // domain; they must reach the network rather than get the app instead.
        navigateFallbackDenylist: [/^\/__\//],
      },
    }),
  ],
  // The browser keeps the signed-in session and the offline copy of the tasks per
  // address — port included. Left to itself Vite moves to the next free port when
  // this one is taken, and the app opens there signed out with nothing cached.
  // Failing to start is better.
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // Every test is watched for console output it did not ask for; see the file.
    setupFiles: ['src/test/consoleGuard.ts'],
  },
})
