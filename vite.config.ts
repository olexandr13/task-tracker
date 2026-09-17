import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  },
})
