import { expect, test, type Page } from '@playwright/test'

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  return errors
}

const IDS = ['montage', 'cross-cutting', 'split-screen', 'insert-shot', 'flashback']
const TIMED = ['montage', 'cross-cutting', 'insert-shot']

let errors: string[]

// 재생을 실제 시간만큼 기다리므로 카드별 test로 나눠 한 test가 한 재생만 기다리게 한다.
test.beforeEach(async ({ page }) => {
  errors = trackErrors(page)
  await page.goto('/terms.html#edit/structure')
})

test.afterEach(() => {
  expect(errors).toEqual([])
})

/** 모든 카드를 차례로 화면에 넣는다. 카드마다 canvas가 1개이고 재생 버튼은 시간 재생 카드에만 있다. */
async function exposeCards(page: Page) {
  await expect(page.locator('[data-term-card]')).toHaveCount(IDS.length)

  for (const id of IDS) {
    const card = page.locator(`#${id}`)
    await expect(card).toBeVisible()
    await expect(card.locator('dt', { hasText: '촬영·편집' })).toBeVisible()
    await expect(card.locator('dt', { hasText: '웹 데모 구현' })).toBeVisible()
    await card.locator('figure').scrollIntoViewIfNeeded()
    await expect(card.locator('canvas')).toHaveCount(1)
    await expect(card.getByRole('button', { name: /재생/ })).toHaveCount(TIMED.includes(id) ? 1 : 0)
  }
}

test('Edit Structure 5 cards: exposure, max 1 canvas, no auto-play', async ({ page }) => {
  await exposeCards(page)

  // 조작 전에는 시간이 흐르지 않는다
  await page.waitForTimeout(1200)
  await expect(page.locator('#montage').getByText('0.0s / 4.0s (일주일을 압축)')).toBeVisible()
  await expect(page.locator('#cross-cutting').getByText('컷 1/8 · A · 달리는 캐릭터').last()).toBeVisible()
  await expect(page.locator('#insert-shot').getByText('0.0s / 4.0s')).toBeVisible()
  await expect(page.locator('#flashback').getByText('현재 · 선명한 색')).toBeVisible()
  await expect(page.locator('#flashback').getByText('과거 · 바랜 톤 + 흐린 가장자리')).toBeVisible()
})

test('Montage: play, replay, and section switch during playback', async ({ page }) => {
  const montage = page.locator('#montage')
  await montage.getByRole('button', { name: '재생', exact: true }).click()
  await expect(montage.getByText('클립 4/4 · 일요일 성공')).toBeVisible({ timeout: 10_000 })
  await expect(montage.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 10_000 })
  await montage.getByRole('button', { name: '다시 재생' }).click()
  await expect(montage.getByText(/클립 1\/4/)).toBeVisible()

  // 재생 중 섹션 전환
  await page.getByRole('link', { name: 'Look' }).click()
  await expect(page.locator('#color-grading')).toBeVisible()
})

test('Cross-cutting: play reaches the last cut', async ({ page }) => {
  const cross = page.locator('#cross-cutting')
  await cross.getByRole('button', { name: '재생', exact: true }).click()
  await expect(cross.getByText(/컷 8\/8 · B/)).toBeVisible({ timeout: 12_000 })
})

test('Insert Shot: insert appears during playback and the off toggle resets', async ({ page }) => {
  const insert = page.locator('#insert-shot')
  await insert.getByRole('button', { name: '재생', exact: true }).click()
  await expect(insert.getByText('INSERT · 시계 5시')).toBeVisible({ timeout: 10_000 })
  await insert.getByRole('button', { name: 'Insert Shot 끔' }).click()
  await expect(insert.getByRole('button', { name: 'Insert Shot 끔' })).toHaveAttribute('aria-pressed', 'true')
  await expect(insert.getByText('끔: 뒤쪽 시계가 작아 시각을 놓치기 쉽다')).toBeVisible()
  await expect(insert.locator('[data-clip="insert"]')).toHaveCount(0)
  await expect(insert.getByRole('button', { name: '재생', exact: true })).toBeVisible()
})

test('Split Screen: axis toggle keeps one canvas', async ({ page }) => {
  const split = page.locator('#split-screen')
  await expect(split.getByRole('button', { name: '좌우' })).toHaveAttribute('aria-pressed', 'true')
  await split.getByRole('button', { name: '상하' }).click()
  await expect(split.getByRole('button', { name: '상하' })).toHaveAttribute('aria-pressed', 'true')
  await expect(split.getByText('상하 분할: A 위 · B 아래')).toBeVisible()
  await split.locator('figure').scrollIntoViewIfNeeded()
  await expect(split.locator('canvas')).toHaveCount(1)
})
