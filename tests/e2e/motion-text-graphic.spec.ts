import { expect, test, type Locator, type Page } from '@playwright/test'

const IDS = ['typewriter', 'text-scramble', 'split-text', 'count-up', 'line-drawing', 'morphing', 'marquee', 'motion-path']

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`console.${msg.type()}: ${msg.text()}`)
  })
  return errors
}

const markup = (card: Locator) => card.evaluate((el) => el.innerHTML)

test('Motion · Text & Graphic: 8 cards stay still until the viewer starts them', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/text-graphic')
  await expect(page.locator('[data-term-card]')).toHaveCount(IDS.length)
  for (const id of IDS) await expect(page.locator(`#${id}`).getByRole('button', { name: '재생', exact: true })).toBeVisible()
  await expect(page.getByRole('slider', { name: '재생 속도' })).toHaveCount(0)

  const before = await Promise.all(IDS.map((id) => markup(page.locator(`#${id}`))))
  await page.waitForTimeout(700)
  expect(await Promise.all(IDS.map((id) => markup(page.locator(`#${id}`))))).toEqual(before)
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0)
  expect(errors).toEqual([])
})

test('Text cards play to their final text and values', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/text-graphic')

  const type = page.locator('#typewriter')
  const target = type.locator('.type-target')
  const sentence = (await target.textContent())!
  await type.getByRole('slider', { name: /타이핑 속도/ }).fill('8')
  await type.getByRole('button', { name: '재생', exact: true }).click()
  await expect.poll(async () => (await target.textContent())!.length).toBeLessThan(sentence.length)
  await expect(type.locator('.sr-only', { hasText: sentence })).toHaveCount(1)
  await expect(type.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 10_000 })
  await expect(target).toHaveText(sentence)
  await type.getByRole('button', { name: '커서 켜짐' }).click()
  await expect(type.getByTestId('type-cursor')).toHaveCount(0)

  const scramble = page.locator('#text-scramble')
  await scramble.getByRole('button', { name: '숫자' }).click()
  // 1초짜리라 부하가 크면 polling이 놓친다. 바뀐 글자를 전부 모아 둔다.
  await scramble.locator('.scramble-target').evaluate((el) => {
    const seen: string[] = []
    Object.assign(window, { scrambled: seen })
    new MutationObserver(() => seen.push(el.textContent ?? '')).observe(el, { childList: true, characterData: true, subtree: true })
  })
  await scramble.getByRole('button', { name: '재생', exact: true }).click()
  // 섞는 동안에는 고른 문자 집합(숫자)이 글자 자리에 나온다.
  await expect.poll(() => page.evaluate(() => (window as unknown as { scrambled: string[] }).scrambled.some((text) => /\d{5}/.test(text)))).toBe(true)
  await expect(scramble.getByRole('heading', { name: 'SYSTEM ONLINE 2026' })).toBeVisible()
  await expect(scramble.locator('.scramble-target')).toHaveText('SYSTEM ONLINE 2026')

  const split = page.locator('#split-text')
  const title = split.locator('.split-target')
  const text = (await title.textContent())!
  for (const unit of ['글자', '단어', '줄']) {
    await split.getByRole('button', { name: unit, exact: true }).click()
    await expect(title.locator('div')).toHaveCount(0)
    await split.getByRole('button', { name: '재생', exact: true }).click()
    await expect(title).toHaveAttribute('aria-label', text)
    await expect.poll(() => title.locator('div').count()).toBeGreaterThan(1)
    await expect(split.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 10_000 })
  }

  const count = page.locator('#count-up')
  const values = count.locator('.count-value')
  await count.getByRole('button', { name: 'linear' }).click()
  await count.getByRole('button', { name: '재생', exact: true }).click()
  await expect(values.first()).not.toHaveText('12,480')
  await expect(values).toHaveText(['12,480', '98,700', '3,254'], { timeout: 10_000 })
  expect(errors).toEqual([])
})

test('Graphic cards: line drawing scrub, morphing, marquee, and motion path', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/text-graphic')

  const line = page.locator('#line-drawing')
  const path = line.locator('.draw-line')
  const dash = () => path.evaluate((el) => getComputedStyle(el).strokeDasharray)
  await line.getByRole('button', { name: '재생', exact: true }).click()
  await expect(line.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 10_000 })

  await line.getByRole('button', { name: 'Scroll Scrub' }).click()
  await expect(line.getByRole('button', { name: /^(재생|다시 재생)$/ })).toHaveCount(0)
  const scroller = line.getByRole('region', { name: 'Line Drawing 내부 스크롤 영역' })
  await expect(line.getByText('선 0%')).toBeVisible()
  const empty = await dash()
  const pageY = await page.evaluate(() => window.scrollY)
  await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight })
  await expect(line.getByText('선 100%')).toBeVisible()
  expect(await dash()).not.toBe(empty)
  // 역스크롤하면 같은 위치에서 같은 상태다.
  await scroller.evaluate((el) => { el.scrollTop = 0 })
  await expect(line.getByText('선 0%')).toBeVisible()
  await expect.poll(dash).toBe(empty)
  expect(await page.evaluate(() => window.scrollY)).toBe(pageY)
  await scroller.focus()
  await page.keyboard.press('ArrowDown')
  await expect(line.getByText('선 0%')).toHaveCount(0)
  await page.keyboard.press('Tab')
  expect(await scroller.evaluate((el) => el.contains(document.activeElement))).toBe(false)

  const morph = page.locator('#morphing')
  const shape = morph.locator('.save-shape')
  const bookmark = await shape.getAttribute('d')
  await morph.getByRole('button', { name: '메뉴 열기' }).click()
  await expect(morph.getByRole('button', { name: '메뉴 닫기' })).toHaveAttribute('aria-expanded', 'true')
  await expect(morph.locator('.bar-middle')).toBeHidden()
  await morph.getByRole('button', { name: '저장', exact: true }).click()
  await expect(shape).not.toHaveAttribute('d', bookmark!)
  await morph.getByRole('button', { name: '메뉴 닫기' }).click()
  await expect(morph.getByRole('button', { name: '메뉴 열기' })).toHaveAttribute('aria-expanded', 'false')
  await expect(morph.getByRole('button', { name: '저장됨' })).toHaveAttribute('aria-pressed', 'true')

  const marquee = page.locator('#marquee')
  const track = marquee.locator('.marquee-track')
  const position = () => track.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)
  await marquee.getByRole('button', { name: '재생', exact: true }).click()
  await page.mouse.move(0, 0)
  await expect.poll(position).toBeLessThan(-5)
  const region = marquee.getByRole('region', { name: /고객사 로고 띠/ })
  for (const hold of [() => region.hover(), () => region.focus()]) {
    await hold()
    const held = await position()
    await page.waitForTimeout(300)
    expect(await position()).toBe(held)
    await page.mouse.move(0, 0)
    await region.blur()
    await expect.poll(position).not.toBe(held)
  }
  await marquee.getByRole('button', { name: '일시정지' }).click()
  const paused = await position()
  await page.waitForTimeout(300)
  expect(await position()).toBe(paused)

  const cart = page.locator('#motion-path')
  const thumb = cart.locator('.cart-thumb')
  await cart.getByRole('button', { name: '경로선 켜짐' }).click()
  await expect(cart.getByTestId('cart-path')).toHaveCount(0)
  await cart.getByRole('button', { name: '경로선 꺼짐' }).click()
  await thumb.scrollIntoViewIfNeeded()
  const start = (await thumb.boundingBox())!
  await cart.getByRole('button', { name: '담기' }).click()
  await expect(cart.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 10_000 })
  await expect(thumb).toBeHidden()
  await expect(cart.locator('.cart-count')).toBeVisible()
  // 끝 위치는 장바구니 아이콘 위(viewBox의 278, 38)다.
  const end = await thumb.evaluate((el) => {
    const matrix = (el as SVGGElement).transform.baseVal.consolidate()!.matrix
    return [Math.round(matrix.e), Math.round(matrix.f)]
  })
  expect(end).toEqual([278, 38])
  expect(start.width).toBeGreaterThan(0)

  // 재생 중 범주를 바꿔도 오류가 남지 않는다.
  await marquee.getByRole('button', { name: '재생', exact: true }).click()
  await cart.getByRole('button', { name: '담기' }).click()
  await page.goto('/terms.html#motion/transition')
  await expect(page.locator('#page-transition')).toBeVisible()
  await page.waitForTimeout(300)
  expect(errors).toEqual([])
})

test('Typewriter is searchable', async ({ page }) => {
  await page.goto('/terms.html#motion/text-graphic')
  await page.getByRole('button', { name: '전체 용어 검색' }).click()
  const search = page.getByPlaceholder('이름·별칭으로 검색')
  await search.fill('Typewriter')
  await expect(page.getByRole('option', { name: /Typewriter/ })).toBeVisible()
  await search.fill('Text Reveal')
  await expect(page.getByRole('option', { name: /Split Text/ })).toBeVisible()
})
