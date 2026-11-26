import { expect, test, type Page } from '@playwright/test'

const CARD_IDS = [
  'dolly-in-out',
  'pan-tilt',
  'tracking-shot',
  'crane-shot',
  'dolly-zoom',
  'arc-shot',
  'crash-zoom',
  'handheld',
  'camera-shake',
  'long-take',
  'ken-burns-effect',
]

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  return errors
}

async function openCard(page: Page, id: string) {
  const card = page.locator(`#${id}`)
  await card.locator('figure').scrollIntoViewIfNeeded()
  await expect(card.locator('canvas')).toHaveCount(1)
  return card
}

const maxCanvasPerCard = (page: Page) =>
  page.locator('[data-term-card]').evaluateAll((cards) => Math.max(...cards.map((c) => c.querySelectorAll('canvas').length)))

test('Movement cards appear in order, keep one canvas each, and do not auto-play', async ({ page }) => {
  test.setTimeout(90_000)
  const errors = trackErrors(page)
  await page.goto('/terms.html#camera/movement')

  await expect(page.locator('[data-term-card]')).toHaveCount(CARD_IDS.length)
  expect(await page.locator('[data-term-card]').evaluateAll((cards) => cards.map((c) => c.id))).toEqual(CARD_IDS)

  const initial: Record<string, string> = {}
  for (const id of CARD_IDS) {
    const card = await openCard(page, id)
    await expect(card.locator('dt', { hasText: '촬영·편집' })).toBeVisible()
    await expect(card.getByRole('button', { name: '재생', exact: true })).toBeVisible()
    if (id !== 'dolly-zoom') initial[id] = await card.getByTestId('camera-status').innerText()
    expect(await maxCanvasPerCard(page)).toBeLessThanOrEqual(1)
  }

  // 조작 전에는 상태가 바뀌지 않는다.
  await page.waitForTimeout(600)
  for (const [id, text] of Object.entries(initial)) {
    await expect(page.locator(`#${id}`).getByTestId('camera-status')).toHaveText(text)
    await expect(page.locator(`#${id}`).getByRole('button', { name: '재생', exact: true })).toBeVisible()
  }

  expect(errors).toEqual([])
})

test('Movement controls and playback work', async ({ page }) => {
  test.setTimeout(150_000)
  const errors = trackErrors(page)
  await page.goto('/terms.html#camera/movement')
  const status = (id: string) => page.locator(`#${id}`).getByTestId('camera-status')
  const play = async (id: string) => {
    const card = page.locator(`#${id}`)
    await card.getByRole('button', { name: '재생', exact: true }).click()
    await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 20_000 })
    await expect(card.locator('canvas')).toHaveCount(1)
  }

  const dolly = await openCard(page, 'dolly-in-out')
  await dolly.getByRole('checkbox', { name: 'Zoom과 나란히 비교' }).check()
  await expect(dolly.getByText('Dolly In · 이동')).toBeVisible()
  await expect(dolly.getByText('Zoom In · 화각', { exact: true })).toBeVisible()
  await play('dolly-in-out')
  await expect(status('dolly-in-out')).toHaveText('Dolly In · 거리 3.6m | Zoom In · 화각 20°')
  await dolly.getByRole('button', { name: 'Out (후퇴)' }).click()
  await expect(status('dolly-in-out')).toHaveText(/^Dolly Out · 거리 3\.6m/)

  const panTilt = await openCard(page, 'pan-tilt')
  await expect(panTilt.getByRole('img', { name: 'Pan 평면도' })).toHaveAttribute('data-view', 'top')
  await play('pan-tilt')
  await expect(status('pan-tilt')).toHaveText('Pan 좌우 35°')
  await panTilt.getByRole('button', { name: 'Tilt', exact: true }).click()
  await expect(panTilt.getByRole('img', { name: 'Tilt 측면도' })).toHaveAttribute('data-view', 'side')
  await expect(panTilt.getByText('측면도', { exact: true })).toBeVisible()
  await play('pan-tilt')
  await expect(status('pan-tilt')).toHaveText('Tilt Up 상하 22°')

  await openCard(page, 'tracking-shot')
  await play('tracking-shot')
  await expect(status('tracking-shot')).toHaveText('카메라 이동 4.0m')

  const crane = await openCard(page, 'crane-shot')
  await play('crane-shot')
  await expect(status('crane-shot')).toHaveText('상승 · 높이 6.5m')
  await crane.getByRole('button', { name: '하강' }).click()
  await expect(status('crane-shot')).toHaveText('하강 · 높이 6.5m')

  const arc = await openCard(page, 'arc-shot')
  await arc.getByRole('button', { name: '360°' }).click()
  await play('arc-shot')
  await expect(status('arc-shot')).toHaveText('회전 360° / 360°')

  const crash = await openCard(page, 'crash-zoom')
  await expect(crash.getByText('Zoom In · 2초')).toBeVisible()
  await expect(crash.getByText('Crash Zoom · 0.18초')).toBeVisible()
  await play('crash-zoom')
  await expect(status('crash-zoom')).toContainText('Crash Zoom 11°')

  const handheld = await openCard(page, 'handheld')
  await expect(handheld.getByText('삼각대 고정', { exact: true })).toBeVisible()
  await play('handheld')
  await expect(status('handheld')).toHaveText('4.0s / 4.0s')

  const shake = await openCard(page, 'camera-shake')
  await expect(shake.getByRole('img', { name: 'Camera Shake 흔들림 그래프' })).toBeVisible()
  await play('camera-shake')
  await expect(status('camera-shake')).toHaveText('지면 충돌')

  const longTake = await openCard(page, 'long-take')
  await expect(longTake.getByText('일반 편집 3컷')).toBeVisible()
  await play('long-take')
  await expect(status('long-take')).toHaveText('지금 ③ 나무 숲 · 7.0s')

  const kenBurns = await openCard(page, 'ken-burns-effect')
  await expect(kenBurns.getByText('시작 (점선)')).toBeVisible()
  await expect(kenBurns.getByText('끝 (실선)')).toBeVisible()
  await play('ken-burns-effect')
  await expect(status('ken-burns-effect')).toHaveText('프레임 폭 40%')
  await expect(kenBurns.getByText('끝 (실선)')).toHaveCount(0)
  await kenBurns.getByRole('button', { name: '원본과 프레임 보기' }).click()
  await expect(status('ken-burns-effect')).toHaveText('원본 전체')

  // 재생 중에 섹션을 바꿔도 오류가 없어야 한다.
  const again = await openCard(page, 'long-take')
  await again.getByRole('button', { name: '다시 재생' }).click()
  await page.getByRole('link', { name: 'Look' }).click()
  await expect(page.locator('#color-grading')).toBeVisible()
  await page.waitForTimeout(500)

  expect(errors).toEqual([])
})
