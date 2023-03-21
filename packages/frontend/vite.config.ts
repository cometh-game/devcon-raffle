import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'rollup-plugin-polyfill-node';
import nodeGlobals from 'rollup-plugin-node-globals'
import * as path from 'path'

const production = process.env.NODE_ENV === 'production';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    !production && nodePolyfills({
      include: ['node_modules/**/*.js', new RegExp('node_modules/.vite/.*js')],
    })
  ],
  build: {
    rollupOptions: {
      plugins: [
        nodeGlobals()
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: [
      { find: 'src', replacement: path.resolve(__dirname, 'src') },
      { find: 'test', replacement: path.resolve(__dirname, 'test') },
      { find: 'util$', replacement: path.resolve(__dirname, 'node_modules/util') }
    ]
  },
  envDir: path.resolve(__dirname, "../..")
})
