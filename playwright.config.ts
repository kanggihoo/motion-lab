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
    command: `pnpm dev --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/terms.html`,
    reuseExistingServer: !process.env.CI,
  },
})
