import { expect, test, type Locator, type Page } from '@playwright/test'

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  return errors
}

const transform = (el: Locator) => el.evaluate((node) => getComputedStyle(node).transform)
const shift = (el: Locator) => el.evaluate((node) => {
  const matrix = new DOMMatrix(getComputedStyle(node).transform)
  return Math.hypot(matrix.m41, matrix.m42)
})

/** 영역 안의 비율 좌표로 마우스를 옮긴다. */
async function hoverAt(page: Page, area: Locator, px: number, py: number) {
  await area.scrollIntoViewIfNeeded()
  const box = (await area.boundingBox())!
  await page.mouse.move(box.x + box.width * px, box.y + box.height * py, { steps: 3 })
}

test('Magnetic Button follows within the chosen maximum, by pointer and by focus', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/pointer-event')
  const card = page.locator('#magnetic-button')
  const button = card.getByRole('button', { name: '무료로 시작하기' })
  await expect(card.getByRole('button', { name: /재생/ })).toHaveCount(0)
  await expect(card.getByText(/터치 기기에서는 꺼집니다/)).toHaveCount(0)
  expect(await shift(button)).toBe(0)

  await hoverAt(page, card.getByTestId('magnetic-area'), 0.65, 0.5)
  await expect.poll(() => shift(button)).toBeGreaterThan(1)
  expect(await shift(button)).toBeLessThanOrEqual(10)
  await page.mouse.move(0, 0)
  await expect.poll(() => shift(button)).toBeLessThan(0.5)

  const slider = card.getByRole('slider', { name: '끌림 최대값' })
  await slider.fill('2')
  await expect(slider).toHaveAttribute('aria-valuetext', '30px')
  // 컨트롤 줄은 데모 영역 뒤에 있다.
  await slider.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(button).toBeFocused()
  await expect.poll(() => shift(button)).toBeCloseTo(30, 0)
  await page.keyboard.press('Tab')
  await expect(slider).toBeFocused()
  await expect.poll(() => shift(button)).toBeLessThan(0.5)

  await slider.fill('0')
  await hoverAt(page, card.getByTestId('magnetic-area'), 0.65, 0.5)
  await expect(card.getByText(/끌려온 거리 0px/)).toBeVisible()
  expect(errors).toEqual([])
})

test('Custom Cursor stays in its area, grows on links, and never blocks clicks', async ({ page }) => {
  await page.goto('/terms.html#motion/pointer-event')
  const card = page.locator('#custom-cursor')
  const cursor = card.getByTestId('custom-cursor')
  await expect(cursor).toHaveAttribute('data-visible', 'false')
  await expect(cursor).toHaveCSS('pointer-events', 'none')

  await hoverAt(page, card.getByTestId('cursor-area'), 0.8, 0.85)
  await expect(cursor).toHaveAttribute('data-visible', 'true')
  await expect(cursor).toHaveAttribute('data-on-link', 'false')
  // 기본 커서는 숨기지 않는다.
  await expect(card.getByTestId('cursor-area')).not.toHaveCSS('cursor', 'none')

  const link = card.getByRole('button', { name: '작업 보기' })
  await link.hover()
  await expect(cursor).toHaveAttribute('data-on-link', 'true')
  await expect(card.getByText('커서: 링크 위 · 크게')).toBeVisible()
  await link.click()
  expect(page.url()).toContain('#motion/pointer-event')

  await page.mouse.move(0, 0)
  await expect(cursor).toHaveAttribute('data-visible', 'false')
  await card.getByRole('button', { name: '요금 안내' }).focus()
  await page.keyboard.press('Shift+Tab')
  await expect(link).toBeFocused()
  await expect(cursor).toHaveAttribute('data-on-link', 'true')
})

test('3D Tilt tilts toward pointer and focus, with an optional glare', async ({ page }) => {
  await page.goto('/terms.html#motion/pointer-event')
  const card = page.locator('[id="3d-tilt"]')
  const tilt = card.getByTestId('tilt-card')
  const area = card.getByTestId('tilt-area')
  const glare = card.getByTestId('tilt-glare')
  const flat = await transform(tilt)

  await hoverAt(page, area, 0.95, 0.1)
  await expect.poll(() => transform(tilt)).toContain('matrix3d')
  await expect(glare).toHaveCount(1)
  await expect(card.getByText(/rotateX [1-9]° · rotateY [1-9]°/)).toBeVisible()
  await card.getByRole('button', { name: '반사광 켬' }).click()
  await expect(glare).toHaveCount(0)

  await page.mouse.move(0, 0)
  await expect(card.getByText('rotateX 0° · rotateY 0°')).toBeVisible()
  await expect.poll(() => transform(tilt)).toBe(flat === 'none' ? 'matrix(1, 0, 0, 1, 0, 0)' : flat)

  await card.getByRole('slider', { name: '최대 기울기' }).focus()
  await page.keyboard.press('Shift+Tab')
  await expect(card.getByRole('button', { name: 'Pro 선택' })).toBeFocused()
  await expect(card.getByText('rotateX 7° · rotateY 7°')).toBeVisible()
})

test('Confetti starts only on click, finishes, and can replay', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/pointer-event')
  const card = page.locator('#confetti')
  const visible = () => card.locator('[data-confetti]').evaluateAll((nodes) =>
    nodes.filter((node) => Number(getComputedStyle(node).opacity) > 0).length)

  await expect(card.getByRole('button', { name: '재생', exact: true })).toBeVisible()
  await page.waitForTimeout(600)
  expect(await visible()).toBe(0)

  await card.getByRole('button', { name: '첫 결제 완료' }).click()
  await expect.poll(visible).toBeGreaterThan(0)
  await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 10_000 })
  expect(await visible()).toBe(0)
  await card.getByRole('button', { name: '다시 재생' }).click()
  await expect.poll(visible).toBeGreaterThan(0)

  // 재생 중 범주를 바꿔도 오류가 없다.
  await page.goto('/terms.html#motion/scroll')
  await expect(page.locator('#scroll-reveal')).toBeVisible()
  expect(errors).toEqual([])
})

test.describe('touch device', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })

  test('pointer-only demos are off and explained; Confetti still works', async ({ page }) => {
    await page.goto('/terms.html#motion/pointer-event')
    for (const id of ['magnetic-button', 'custom-cursor', '3d-tilt']) {
      await expect(page.locator(`[id="${id}"]`).getByText(/터치 기기에서는 꺼집니다/)).toBeVisible()
    }
    const button = page.getByRole('button', { name: '무료로 시작하기' })
    await button.tap()
    expect(await shift(button)).toBe(0)
    await expect(page.locator('#custom-cursor').getByTestId('custom-cursor')).toHaveAttribute('data-visible', 'false')
    await expect(page.getByRole('slider', { name: '최대 기울기' })).toBeDisabled()
    await page.getByRole('button', { name: '첫 결제 완료' }).tap()
    await expect(page.locator('#confetti').getByRole('button', { name: /재생 중|다시 재생/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
