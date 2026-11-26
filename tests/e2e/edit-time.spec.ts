import { expect, test } from '@playwright/test'

const IDS = ['time-lapse', 'speed-ramp', 'freeze-frame', 'hyperlapse', 'bullet-time', 'stop-motion']

test('Edit · Time cards: no autoplay, max 1 canvas, replay and speed controls', async ({ page }) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })

  await page.goto('/terms.html#edit/time')

  for (const id of IDS) {
    const card = page.locator(`#${id}`)
    await expect(card).toBeVisible()
    await card.locator('figure').scrollIntoViewIfNeeded()
    await expect(card.locator('canvas')).toHaveCount(1)
    await expect(card.getByRole('button', { name: '재생', exact: true })).toBeVisible()
    await expect(card.getByRole('slider', { name: '재생 속도' })).toHaveValue('1')
    await expect(card.getByText(/^0\.0s \//)).toBeVisible()
  }

  // 조작 전에는 시간이 흐르지 않는다.
  await page.waitForTimeout(600)
  for (const id of IDS) {
    await expect(page.locator(`#${id}`).getByText(/^0\.0s \//)).toBeVisible()
  }

  for (const id of IDS) {
    const card = page.locator(`#${id}`)
    await card.locator('figure').scrollIntoViewIfNeeded()
    await card.getByRole('slider', { name: '재생 속도' }).fill('2')
    await card.getByRole('button', { name: '재생', exact: true }).click()
    await expect(card.getByText(/^0\.0s \//)).toHaveCount(0)
    await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 15_000 })
    await expect(card.locator('canvas')).toHaveCount(1)
  }

  // Freeze Frame: 정지 구간에만 이름 라벨이 보인다.
  const freeze = page.locator('#freeze-frame')
  await freeze.locator('figure').scrollIntoViewIfNeeded()
  await expect(freeze.getByText('점퍼 하루')).toHaveCount(0)
  await freeze.getByRole('slider', { name: '재생 속도' }).fill('0.5')
  await freeze.getByRole('button', { name: '다시 재생' }).click()
  await expect(freeze.getByText('점퍼 하루')).toBeVisible({ timeout: 10_000 })

  // Hyperlapse 비교 토글은 처음 상태로 되돌린다.
  const hyper = page.locator('#hyperlapse')
  await hyper.locator('figure').scrollIntoViewIfNeeded()
  await hyper.getByRole('button', { name: 'Time-lapse(고정)' }).click()
  await expect(hyper.getByRole('button', { name: 'Time-lapse(고정)' })).toHaveAttribute('aria-pressed', 'true')
  await expect(hyper.getByText(/^0\.0s \//)).toBeVisible()
  await expect(hyper.getByRole('button', { name: '재생', exact: true })).toBeVisible()

  // 재생 중 섹션 전환
  await hyper.getByRole('button', { name: '재생', exact: true }).click()
  await page.getByRole('link', { name: 'Look' }).click()
  await expect(page.locator('#color-grading')).toBeVisible()
  expect(errors).toEqual([])
})
