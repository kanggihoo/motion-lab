import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 에피소드마다 HTML 진입점 하나 (MPA). 에피소드 추가 = input 한 줄.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  appType: 'mpa', // dev에서도 SPA fallback 없이 배포와 같게 404
  resolve: {
    alias: { '@terms': fileURLToPath(new URL('./src/terms', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        terms: 'terms.html',
        'connection-pool': 'connection-pool/index.html',
      },
    },
  },
})
