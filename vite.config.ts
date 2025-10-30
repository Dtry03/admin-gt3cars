import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // CORRECCIÓN: Añadido 'base' para compatibilidad con Capacitor
  base: './', 
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },
})

