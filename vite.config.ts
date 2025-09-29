import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      // 禁用SRI检查以避免本地Pyodide文件的完整性验证问题
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // 将Pyodide相关文件放在pyodide目录下
          if (assetInfo.name?.includes('pyodide')) {
            return 'pyodide/[name][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['php-wasm', 'pyodide'],
  },
  assetsInclude: ['**/*.wasm'],
})
