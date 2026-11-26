import { defineConfig } from '@playwright/test'

const port = process.env.E2E_PORT ?? '4173'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  // SwiftShader는 canvas를 CPU로 그리고 한 browser가 여러 core를 쓴다. 기본값(core 절반)이면
  // 서로 굶겨 canvas mount와 재생 대기가 timeout을 넘는다.
  workers: 2,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    headless: true,
    launchOptions: {
      args: ['--use-gl=angle', '--use-angle=swiftshader'],
    },
  },
  webServer: {
    // --force: 새 import(GSAP plugin 등)가 없는 옛 optimizer cache로 시작하면 Vite가 test 도중
    // 다시 최적화하며 페이지를 reload한다(504 Outdated Optimize Dep). 시작할 때 새로 만든다.
    command: `pnpm dev --host 127.0.0.1 --port ${port} --strictPort --force`,
    url: `http://127.0.0.1:${port}/terms.html`,
    reuseExistingServer: !process.env.CI,
  },
})
