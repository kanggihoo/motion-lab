import { expect, test, type Page } from '@playwright/test'

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`console.${msg.type()}: ${msg.text()}`)
  })
  return errors
}

test('Page Transition imitates navigation inside the card for every effect', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/transition')
  await expect(page.locator('[data-term-card]')).toHaveCount(2)
  const card = page.locator('#page-transition')
  const home = card.getByText('홈 화면')
  const about = card.getByText('소개 화면')

  await page.waitForTimeout(500)
  await expect(home).toBeVisible()
  await expect(about).toBeHidden()
  await expect(card.getByRole('button', { name: '재생', exact: true })).toBeVisible()
  const hash = await page.evaluate(() => location.hash)

  for (const effect of ['fade', 'slide-up', 'wipe']) {
    await card.getByRole('button', { name: effect, exact: true }).click()
    await card.getByRole('button', { name: '소개', exact: true }).click()
    await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible()
    await expect(about).toBeVisible()
    await expect(home).toBeHidden()
    await card.getByRole('button', { name: '홈', exact: true }).click()
    await expect(home).toBeVisible()
    await expect(about).toBeHidden()
  }
  // 조작 없이 처음 누른 「재생」도 두 번째 화면으로 전환한다.
  await card.getByRole('button', { name: 'fade', exact: true }).click()
  await card.getByRole('button', { name: '재생', exact: true }).click()
  await expect(about).toBeVisible()
  expect(await page.evaluate(() => location.hash)).toBe(hash)
  expect(errors).toEqual([])
})

test('Shared Element Transition grows the image, compares with a page change, and keeps focus', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/transition')
  const card = page.locator('#shared-element-transition')
  const product = card.getByRole('button', { name: '조명' })
  const hero = card.locator('.detail-art')
  const back = card.getByRole('button', { name: '목록으로' })
  await expect(hero).toHaveCount(0)

  await product.focus()
  const thumbWidth = (await card.locator('.thumb-lamp').boundingBox())!.width
  // 전환 중의 너비를 frame마다 모은다.
  await card.evaluate((el) => {
    const widths: number[] = []
    Object.assign(window, { heroWidths: widths })
    const sample = () => {
      const art = el.querySelector('.detail-art')
      if (art) widths.push(art.getBoundingClientRect().width)
      if (widths.length < 300) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.keyboard.press('Enter')
  await expect(back).toBeFocused()
  await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible()
  await expect.poll(async () => Math.round((await hero.boundingBox())!.width)).toBe(144)
  // 썸네일 크기에서 출발해 상세 크기(144px)로 커졌다.
  const smallest = await page.evaluate(() => Math.min(...(window as unknown as { heroWidths: number[] }).heroWidths))
  expect(smallest).toBeLessThan(144)
  expect(smallest).toBeGreaterThanOrEqual(Math.min(thumbWidth, 144) - 2)
  await back.press('Enter')
  await expect(hero).toHaveCount(0)
  await expect(product).toBeFocused()

  await card.getByRole('button', { name: 'Page Transition' }).click()
  await product.press('Enter')
  await expect(back).toBeFocused()
  // 비교 모드는 크기 변화 없이 화면 전체가 바뀐다.
  expect(Math.round((await hero.boundingBox())!.width)).toBe(144)
  await expect(card.getByText(/^Page Transition:/)).toBeVisible()
  await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible()
  await back.click()
  await expect(product).toBeVisible()

  // 재생 중 범주 전환
  await card.getByRole('button', { name: '다시 재생' }).or(card.getByRole('button', { name: '재생', exact: true })).click()
  await page.goto('/terms.html#motion/scroll')
  await expect(page.locator('#scroll-scrub')).toBeVisible()
  expect(errors).toEqual([])
})
