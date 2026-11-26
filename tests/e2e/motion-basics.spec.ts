import { expect, test, type Locator } from '@playwright/test'

const IDS = ['fade', 'slide', 'scale']
const style = (target: Locator, name: 'opacity' | 'visibility' | 'transform') =>
  target.evaluate((element, key) => getComputedStyle(element)[key], name)

test('Motion · Basics: no autoplay, replay, card controls, search aliases and cleanup', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`console.${msg.type()}: ${msg.text()}`)
  })

  await page.goto('/terms.html#motion/basics')
  for (const id of IDS) {
    const card = page.locator(`#${id}`)
    await expect(card.getByRole('button', { name: '재생', exact: true })).toBeVisible()
    await expect(card.getByRole('slider')).toHaveCount(0)
  }

  const backdrop = page.locator('#fade .fade-backdrop')
  const layer = page.locator('#slide .slide-layer')
  const badge = page.locator('#scale .scale-badge')
  // 조작 전에는 아무것도 움직이지 않는다.
  await page.waitForTimeout(600)
  expect(await style(backdrop, 'visibility')).toBe('hidden')
  expect(await style(layer, 'visibility')).toBe('hidden')
  expect(await style(badge, 'transform')).toBe('none')

  // Fade: 나타났다가 다시 사라진다. 키보드로 시작한다.
  const fade = page.locator('#fade')
  await fade.getByRole('button', { name: '0.6s' }).click()
  await fade.getByRole('button', { name: '재생', exact: true }).press('Enter')
  await expect.poll(() => style(backdrop, 'opacity')).toBe('1')
  await expect.poll(() => style(backdrop, 'visibility')).toBe('hidden')
  await expect(fade.getByRole('button', { name: '다시 재생' })).toBeVisible()

  // Slide: 오른쪽에서 들어와 3초 뒤 돌아간다.
  const slide = page.locator('#slide')
  await slide.getByRole('button', { name: '오른쪽' }).click()
  await slide.getByRole('button', { name: 'Fade와 같이: 끔' }).click()
  await slide.getByRole('button', { name: '재생', exact: true }).click()
  await expect(slide.getByText('새 알림이 도착했습니다')).toBeInViewport()
  await expect.poll(() => style(layer, 'opacity')).toBe('1')
  await expect.poll(() => style(layer, 'visibility'), { timeout: 10_000 }).toBe('hidden')

  // Scale: scale만은 커진 채 남는다.
  const scale = page.locator('#scale')
  await scale.getByRole('button', { name: 'scale만' }).click()
  await scale.getByRole('button', { name: '중심: 왼쪽 위' }).click()
  await scale.getByRole('button', { name: '재생', exact: true }).click()
  await expect.poll(() => style(badge, 'transform')).toBe('matrix(1.2, 0, 0, 1.2, 0, 0)')

  // D-16: 제외 용어 검색
  await page.getByRole('button', { name: '전체 용어 검색' }).click()
  await page.getByPlaceholder('이름·별칭으로 검색').fill('Zoom In')
  await expect(page.getByRole('option', { name: /^Scale/ })).toBeVisible()
  await page.keyboard.press('Escape')

  // 좁은 화면에서도 카드가 가로로 넘치지 않는다.
  await page.setViewportSize({ width: 360, height: 800 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)

  // 재생 중 범주 전환
  await slide.getByRole('button', { name: '다시 재생' }).or(slide.getByRole('button', { name: '재생', exact: true })).click()
  await page.goto('/terms.html#motion/timing-sequence')
  await expect(page.locator('#easing')).toBeVisible()
  await expect(page.locator('#slide')).toHaveCount(0)
  expect(errors).toEqual([])
})
