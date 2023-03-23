import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'rollup-plugin-polyfill-node';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
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
        rollupNodePolyFill(),
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
      { find: 'util$', replacement: path.resolve(__dirname, 'node_modules/util') },
    ]
    /*
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      assert: 'assert',
    }
    */
  },
  optimizeDeps: {
    exclude: ['@ethersproject/hash', 'wrtc'],
    include: ['js-sha3', '@ethersproject/bignumber'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        })
      ]
    }
  },
  envDir: path.resolve(__dirname, "../..")
})
