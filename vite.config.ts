import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // Main process entry file of the Electron App.
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
          },
        },
      },
      {
        entry: 'electron/preload/index.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron/preload',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
}) 