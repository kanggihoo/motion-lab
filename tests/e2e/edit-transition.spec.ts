import { expect, test, type Page } from '@playwright/test'

const CARD_IDS = [
  'jump-cut',
  'dissolve',
  'wipe',
  'match-cut',
  'whip-pan',
  'smash-cut',
  'iris',
  'fade-to-black',
  'j-cut-l-cut',
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

test('Transition cards appear in order, keep one canvas each, and do not auto-play', async ({ page }) => {
  test.setTimeout(60_000)
  const errors = trackErrors(page)
  await page.goto('/terms.html#edit/transition')

  await expect(page.locator('[data-term-card]')).toHaveCount(CARD_IDS.length)
  expect(await page.locator('[data-term-card]').evaluateAll((cards) => cards.map((c) => c.id))).toEqual(CARD_IDS)

  for (const id of CARD_IDS) {
    const card = await openCard(page, id)
    await expect(card.locator('dt', { hasText: '촬영·편집' })).toBeVisible()
    await expect(card.getByRole('button', { name: '재생', exact: true })).toBeVisible()
    await expect(card.getByText(/^0\.0s \//)).toBeVisible()
    expect(await page.locator('[data-term-card]').evaluateAll(
      (cards) => Math.max(...cards.map((c) => c.querySelectorAll('canvas').length)),
    )).toBeLessThanOrEqual(1)
  }

  // 잠시 기다려도 조작 전에는 시간이 흐르지 않는다.
  await page.waitForTimeout(600)
  for (const id of CARD_IDS) {
    await expect(page.locator(`#${id}`).getByText(/^0\.0s \//)).toBeVisible()
  }

  expect(errors).toEqual([])
})

test('Transition controls and playback work', async ({ page }) => {
  test.setTimeout(90_000)
  const errors = trackErrors(page)
  await page.goto('/terms.html#edit/transition')
  const status = (id: string) => page.locator(`#${id}`).getByTestId('timeline-status')
  const play = async (id: string) => {
    const card = page.locator(`#${id}`)
    await card.getByRole('button', { name: '재생', exact: true }).click()
    await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 15_000 })
  }

  const jump = await openCard(page, 'jump-cut')
  await play('jump-cut')
  await expect(status('jump-cut')).toHaveText('조각 3 / 3 · 원본 7.0s')
  await jump.getByRole('button', { name: '다시 재생' }).click()
  await expect(status('jump-cut')).toHaveText(/조각 1 \/ 3/)

  const wipe = await openCard(page, 'wipe')
  await wipe.getByRole('button', { name: '대각선' }).click()
  await expect(wipe.getByRole('button', { name: '대각선' })).toHaveAttribute('aria-pressed', 'true')
  await wipe.getByRole('button', { name: '원형' }).click()
  await play('wipe')
  await expect(status('wipe')).toHaveText('Wipe 진행 100%')
  await wipe.getByRole('button', { name: 'Dissolve' }).click()
  await expect(status('wipe')).toHaveText('Dissolve 진행 0%')
  await expect(wipe.getByText(/겹침 있음/)).toBeVisible()
  await expect(wipe.getByRole('button', { name: '원형' })).toBeDisabled()

  const match = await openCard(page, 'match-cut')
  await expect(match.getByTestId('match-guide')).toBeVisible()
  await match.getByRole('checkbox', { name: '정렬 가이드 원' }).uncheck()
  await expect(match.getByTestId('match-guide')).toHaveCount(0)
  await play('match-cut')
  await expect(status('match-cut')).toHaveText('클립 B · 둥근 캐릭터')

  await openCard(page, 'whip-pan')
  await play('whip-pan')
  await expect(status('whip-pan')).toHaveText('클립 B · 노을 측면')

  await openCard(page, 'smash-cut')
  await expect(status('smash-cut')).toHaveText('조용한 밤 · 오디오 0 근처')
  await play('smash-cut')
  await expect(status('smash-cut')).toHaveText('알람 아침 · 오디오 최대')

  const iris = await openCard(page, 'iris')
  const irisMask = iris.locator('figure canvas').locator('xpath=../..')
  await expect(irisMask).toHaveAttribute('style', /circle\(75(\.00)?% at 50% 50%\)/)
  await iris.getByRole('button', { name: 'Iris In' }).click()
  await expect(irisMask).toHaveAttribute('style', /circle\(0(\.00)?% at 50% 50%\)/)
  await play('iris')
  await expect(status('iris')).toHaveText('원형 구멍 100% 열림')

  const fade = await openCard(page, 'fade-to-black')
  await fade.getByRole('button', { name: '재생', exact: true }).click()
  await expect(status('fade-to-black')).toHaveText('밝기 0%')
  await expect(status('fade-to-black')).toHaveText('밝기 100%', { timeout: 15_000 })
  await fade.getByRole('button', { name: 'Dissolve' }).click()
  await expect(fade.getByText(/검정 없이 두 장면이 겹칩니다/)).toBeVisible()

  const split = await openCard(page, 'j-cut-l-cut')
  for (const [name, cut] of [['J-Cut', '1.0s'], ['L-Cut', '3.0s'], ['직선 컷', '2.0s']] as const) {
    await split.getByRole('button', { name, exact: true }).click()
    await expect(split.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(split.getByText(`소리 컷 ${cut}`)).toBeVisible()
  }
  await play('j-cut-l-cut')
  await expect(status('j-cut-l-cut')).toHaveText('지금 화면 B · 소리 B')

  // 재생 중에 섹션을 바꿔도 오류가 없어야 한다.
  await split.getByRole('button', { name: '다시 재생' }).click()
  await page.getByRole('link', { name: 'Look' }).click()
  await expect(page.locator('#color-grading')).toBeVisible()

  expect(errors).toEqual([])
})
