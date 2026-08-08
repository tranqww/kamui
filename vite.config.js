import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this project from https://tranqww.github.io/kamui/, so
// every asset URL needs the repo name as its base. CI passes the real value
// from actions/configure-pages; the literal is only the local default.
// configure-pages emits "/kamui" without a trailing slash, which Vite needs.
const rawBase = process.env.VITE_BASE || '/kamui/'
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          post: ['postprocessing', '@react-three/postprocessing'],
        },
      },
    },
  },
})
