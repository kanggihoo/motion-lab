import { expect, test, type Page } from '@playwright/test'

const IDS = [
  'rack-focus',
  'bokeh',
  'tilt-shift',
  'fisheye-lens',
  'lens-flare',
  'motion-blur',
  'depth-of-field',
  'focal-length',
]
const TIMED = ['rack-focus', 'lens-flare', 'motion-blur']

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    // shader compile 실패는 console.error로 나온다
    if (msg.type() === 'error' || /WebGL|THREE\.WebGLProgram|GL_INVALID/.test(msg.text())) {
      if (!msg.text().includes('GPU stall due to ReadPixels')) errors.push(`console.${msg.type()}: ${msg.text()}`)
    }
  })
  return errors
}

async function openCard(page: Page, id: string) {
  const card = page.locator(`#${id}`)
  await card.locator('figure').scrollIntoViewIfNeeded()
  await expect(card.locator('canvas')).toHaveCount(1)
  return card
}

test('Lens & Focus 8 cards: order, one canvas each, no auto-play', async ({ page }) => {
  test.setTimeout(90_000)
  const errors = trackErrors(page)
  await page.goto('/terms.html#camera/lens-focus')
  await expect(page.locator('[data-term-card]')).toHaveCount(IDS.length)
  expect(await page.locator('[data-term-card]').evaluateAll((cards) => cards.map((c) => c.id))).toEqual(IDS)

  for (const id of IDS) {
    const card = await openCard(page, id)
    await expect(card.locator('dt', { hasText: '촬영·편집' })).toBeVisible()
    await expect(card.locator('svg[data-view]')).toHaveCount(1)
    await expect(card.getByTestId('lens-status')).toBeVisible()
    await expect(card.getByRole('button', { name: /재생/ })).toHaveCount(TIMED.includes(id) ? 1 : 0)
    expect(await page.locator('[data-term-card]').evaluateAll(
      (cards) => Math.max(...cards.map((c) => c.querySelectorAll('canvas').length)),
    )).toBeLessThanOrEqual(1)
  }

  // 조작 전에는 시간이 흐르지 않는다
  await page.waitForTimeout(800)
  await expect(page.locator('#rack-focus').getByText('앞 꽃 → 주인공 0%')).toBeVisible()
  await expect(page.locator('#lens-flare').getByText('Pan 0°')).toBeVisible()
  await expect(page.locator('#motion-blur').getByTestId('lens-status')).toHaveText(/^프레임 0 \//)
  expect(errors).toEqual([])
})

test('Lens & Focus controls, playback, and section switch during playback', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = trackErrors(page)
  await page.goto('/terms.html#camera/lens-focus')
  const status = (id: string) => page.locator(`#${id}`).getByTestId('lens-status')

  const rack = await openCard(page, 'rack-focus')
  await rack.getByRole('button', { name: '재생', exact: true }).click()
  await expect(status('rack-focus')).toHaveText('앞 꽃 흐림 · 뒤 주인공 선명', { timeout: 20_000 })
  await expect(rack.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 20_000 })
  await rack.getByRole('slider', { name: '초점면 위치' }).fill('0')
  await expect(status('rack-focus')).toHaveText('앞 꽃 선명 · 뒤 주인공 흐림')

  const bokeh = await openCard(page, 'bokeh')
  await expect(status('bokeh')).toContainText('큰 원형 보케')
  await bokeh.getByRole('button', { name: '배경 불빛에 초점' }).click()
  await expect(status('bokeh')).toContainText('작은 점')

  const tilt = await openCard(page, 'tilt-shift')
  await tilt.getByRole('slider', { name: '블러 강도' }).fill('40')
  await tilt.getByRole('slider', { name: '초점 띠 위치' }).fill('60')
  await expect(status('tilt-shift')).toContainText('높이 60% 띠만 선명, 위·아래 흐림 40%')
  await tilt.getByRole('button', { name: '일반 풍경' }).click()
  await expect(status('tilt-shift')).toHaveText('일반 풍경 · 위부터 아래까지 선명')
  await expect(tilt.getByRole('slider', { name: '블러 강도' })).toBeDisabled()
  await expect(tilt.getByTestId('focus-band')).toHaveCount(0)

  const fisheye = await openCard(page, 'fisheye-lens')
  await expect(status('fisheye-lens')).toContainText('직선 유지')
  await fisheye.getByRole('button', { name: 'Fisheye Lens' }).click()
  await expect(status('fisheye-lens')).toContainText('둥글게 휨')
  await fisheye.getByRole('checkbox', { name: '직선 격자' }).uncheck()

  const flare = await openCard(page, 'lens-flare')
  await expect(status('lens-flare')).toHaveText('해 오른쪽 · 고리는 왼쪽으로 뻗음')
  await flare.getByRole('slider', { name: '카메라 Pan 각도' }).fill('30')
  await expect(status('lens-flare')).toHaveText('해 왼쪽 · 고리는 오른쪽으로 뻗음')
  await flare.getByRole('button', { name: 'Flare 끔' }).click()
  await expect(status('lens-flare')).toHaveText('Flare 끔 · 해만 보임')
  await flare.getByRole('button', { name: '재생', exact: true }).click()
  await expect(flare.getByText('Pan 48°')).toBeVisible({ timeout: 20_000 })

  const motion = await openCard(page, 'motion-blur')
  await motion.getByRole('slider', { name: '셔터 각도' }).fill('360')
  await expect(motion.getByText('아래 · Motion Blur 360°')).toBeVisible()
  await expect(motion.getByText('위 · 블러 없음 (끊김)')).toBeVisible()
  await motion.getByRole('button', { name: '재생', exact: true }).click()
  await expect(status('motion-blur')).toHaveText(/^프레임 48 \/ 48/, { timeout: 20_000 })

  const dof = await openCard(page, 'depth-of-field')
  await expect(status('depth-of-field')).toContainText('Shallow DoF · 전경 울타리 흐림 · 중경 주인공 선명 · 원경 나무 흐림')
  const band = dof.getByTestId('focus-band')
  const narrow = Number(await band.getAttribute('width'))
  await dof.getByRole('slider', { name: '조리개' }).fill('7')
  await expect(status('depth-of-field')).toContainText('Deep DoF · 전경 울타리 선명')
  expect(Number(await band.getAttribute('width'))).toBeGreaterThan(narrow)

  const focal = await openCard(page, 'focal-length')
  await focal.getByRole('button', { name: '135mm(망원)' }).click()
  await expect(focal.getByText('카메라 거리 15.8m')).toBeVisible()
  await focal.getByRole('button', { name: '24mm(광각)' }).click()
  await expect(focal.getByText('카메라 거리 2.8m')).toBeVisible()

  // 재생 중에 섹션을 바꿔도 오류가 없어야 한다
  const again = await openCard(page, 'motion-blur')
  await again.getByRole('button', { name: '다시 재생' }).click()
  await page.getByRole('link', { name: 'Look' }).click()
  await expect(page.locator('#color-grading')).toBeVisible()
  expect(errors).toEqual([])
})
