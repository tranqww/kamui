import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this project from https://tranqww.github.io/kamui/
// so every asset URL needs the repo name as its base.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/kamui/',
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
