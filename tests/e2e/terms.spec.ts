import { expect, test, type Page } from '@playwright/test'

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  return errors
}

test('Look 7 cards expose controls, max 1 canvas per card, and context-loss recovery', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#look/color-light')

  const colorLightIds = ['color-grading', 'selective-color', 'day-for-night', 'volumetric-light']
  for (const id of colorLightIds) {
    const card = page.locator(`#${id}`)
    await expect(card).toBeVisible()
    await expect(card.locator('dt', { hasText: '촬영·편집' })).toBeVisible()
    await expect(card.locator('dt', { hasText: '웹 데모 구현' })).toBeVisible()
    await expect(card.getByRole('button', { name: /재생/ })).toHaveCount(0)

    await card.scrollIntoViewIfNeeded()
    await expect(card.locator('canvas')).toHaveCount(1)
  }

  // Color Grading presets
  const cg = page.locator('#color-grading')
  await cg.getByRole('button', { name: '원본', exact: true }).click()
  await expect(cg.getByRole('slider', { name: '전/후 분할 위치' })).toHaveValue('100')
  await cg.getByRole('button', { name: '차가운 블루' }).click()
  await expect(cg.getByRole('button', { name: '차가운 블루' })).toHaveAttribute('aria-pressed', 'true')
  await expect(cg.getByRole('slider', { name: '전/후 분할 위치' })).toHaveValue('50')

  // Day for Night 3 checkboxes
  const dfn = page.locator('#day-for-night')
  const step1 = dfn.getByRole('checkbox', { name: '1. 전체 어둡게' })
  await expect(step1).toBeChecked()
  await step1.uncheck()
  await expect(step1).not.toBeChecked()

  // Volumetric Light density slider
  const vol = page.locator('#volumetric-light')
  await vol.getByRole('slider', { name: '안개/먼지 농도' }).fill('80')
  await expect(vol.getByText('80%')).toBeVisible()

  // Scroll back to #color-grading: scroll-out -> scroll-in must NOT trigger false context loss
  await cg.locator('figure').scrollIntoViewIfNeeded()
  const firstCanvas = page.locator('#color-grading canvas')
  await expect(cg.getByText('3D 화면이 일시 중단되었습니다')).toHaveCount(0)
  await expect(firstCanvas).toHaveCount(1)

  // Genuine WebGL context loss recovery
  await firstCanvas.evaluate((el) => {
    el.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
  })
  await expect(cg.getByText('3D 화면이 일시 중단되었습니다')).toBeVisible()
  await cg.getByRole('button', { name: '다시 불러오기' }).click()
  await expect(firstCanvas).toHaveCount(1)

  // Texture & Frame 3 cards
  await page.goto('/terms.html#look/texture-frame')
  for (const id of ['film-grain', 'letterbox', 'vignette']) {
    const card = page.locator(`#${id}`)
    await expect(card).toBeVisible()
    await expect(card.getByRole('button', { name: /재생/ })).toHaveCount(0)
    await card.scrollIntoViewIfNeeded()
    await expect(card.locator('canvas')).toHaveCount(1)
  }

  // Letterbox ratio buttons
  const lb = page.locator('#letterbox')
  await lb.getByRole('button', { name: '1.85:1' }).click()
  await expect(lb.getByRole('button', { name: '1.85:1' })).toHaveAttribute('aria-pressed', 'true')

  expect(errors).toEqual([])
})

test('No auto-play, representative controls, section switch cleanup, and keyboard escape', async ({ page }) => {
  const errors = trackErrors(page)

  // Motion · Scroll · Scroll Scrub
  await page.goto('/terms.html#motion/scroll')
  const scrubCard = page.locator('#scroll-scrub')
  await expect(scrubCard).toBeVisible()
  await scrubCard.getByRole('button', { name: '0 (즉시)' }).click()
  await expect(scrubCard.getByRole('button', { name: '0 (즉시)' })).toHaveAttribute('aria-pressed', 'true')

  const scroller = scrubCard.locator('section[aria-label="Scroll Scrub 내부 스크롤 영역"]')
  await scroller.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Tab')
  const stillInsideScroller = await scroller.evaluate((el) => el === document.activeElement)
  expect(stillInsideScroller).toBe(false)

  // Camera · Movement · Dolly Zoom (starts paused, not auto-playing)
  await page.goto('/terms.html#camera/movement')
  const dolly = page.locator('#dolly-zoom')
  await dolly.scrollIntoViewIfNeeded()
  await expect(dolly.getByRole('button', { name: '재생', exact: true })).toBeVisible()
  await dolly.getByRole('button', { name: '전진 + 줌아웃' }).click()
  await dolly.getByRole('button', { name: '재생', exact: true }).click()

  // Edit · Transition · Dissolve (starts paused, then switch section)
  await page.goto('/terms.html#edit/transition')
  const dissolve = page.locator('#dissolve')
  await dissolve.scrollIntoViewIfNeeded()
  await expect(dissolve.getByRole('button', { name: '재생', exact: true })).toBeVisible()
  await dissolve.getByRole('button', { name: '0.3s' }).click()
  await dissolve.getByRole('button', { name: '재생', exact: true }).click()

  await page.getByRole('link', { name: 'Look' }).click()
  await expect(page.locator('#color-grading')).toBeVisible()
  expect(errors).toEqual([])
})

test('Existing UI/Style hashes, Reduced Motion isolation, and Search filtering', async ({ page }) => {
  const errors = trackErrors(page)

  await page.goto('/terms.html#ui/layout/hero-section')
  await expect(page.locator('#hero-section')).toBeVisible()

  await page.goto('/terms.html#style/surface-contrast/glassmorphism')
  await expect(page.locator('#glassmorphism')).toBeVisible()

  // Reduced Motion toggle works and does not break new sections
  const rmToggle = page.getByRole('checkbox', { name: /Reduced Motion 미리보기/ })
  await rmToggle.check()
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true')

  await page.goto('/terms.html#look/color-light')
  await expect(page.locator('#color-grading')).toBeVisible()

  // Search finds registered Look cards and hides unimplemented ones
  await page.getByRole('button', { name: '전체 용어 검색' }).click()
  const searchInput = page.getByPlaceholder('이름·별칭으로 검색')
  await searchInput.fill('Letterbox')
  await expect(page.getByRole('option', { name: /Letterbox/ })).toBeVisible()

  await searchInput.fill('Interpolation')
  await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible()

  expect(errors).toEqual([])
})
