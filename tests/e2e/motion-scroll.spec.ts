import { expect, test, type Locator, type Page } from '@playwright/test'

const CARDS = [
  ['scroll-reveal', 'Scroll Reveal'],
  ['scroll-scrub', 'Scroll Scrub'],
  ['pin', 'Pin'],
  ['scroll-snap', 'Scroll Snap'],
  ['scrollytelling', 'Scrollytelling'],
  ['parallax-scrolling', 'Parallax Scrolling'],
  ['pinned-horizontal-scroll', 'Pinned Horizontal Scroll'],
] as const

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  return errors
}

const scrollerOf = (page: Page, id: string) => page.locator(`#${id} section[aria-label$="내부 스크롤 영역"]`)
const scrollTo = (scroller: Locator, top: number) => scroller.evaluate((el, value) => { el.scrollTop = value }, top)
const scrollTop = (scroller: Locator) => scroller.evaluate((el) => el.scrollTop)
const opacity = (el: Locator) => el.evaluate((node) => Number(getComputedStyle(node).opacity))
const translate = (el: Locator) => el.evaluate((node) => {
  const matrix = new DOMMatrix(getComputedStyle(node).transform)
  return { x: matrix.m41, y: matrix.m42 }
})
/** SVG 요소는 GSAP이 transform attribute로 옮긴다. */
const svgY = (el: Locator) => el.evaluate((node) => (node as SVGGElement).transform.baseVal.consolidate()?.matrix.f ?? 0)

test('Scroll cards: D-16 order, keyboard scroll and escape without moving the page', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/scroll')
  await expect(page.locator('[data-term-card]')).toHaveCount(CARDS.length)
  expect(await page.locator('[data-term-card]').evaluateAll((cards) => cards.map((card) => card.id))).toEqual(CARDS.map(([id]) => id))

  for (const [id] of CARDS) {
    const card = page.locator(`#${id}`)
    await expect(card.getByRole('button', { name: /재생/ })).toHaveCount(0)
    const scroller = scrollerOf(page, id)
    await scroller.scrollIntoViewIfNeeded()
    expect(await scrollTop(scroller)).toBe(0)

    await scroller.focus()
    await expect(scroller).toBeFocused()
    const pageY = await page.evaluate(() => window.scrollY)
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => scrollTop(scroller)).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.scrollY)).toBe(pageY)

    await page.keyboard.press('Tab')
    await expect(scroller).not.toBeFocused()
    // 앞으로 Tab하면 영역 안에 다시 갇히지 않는다.
    expect(await scroller.evaluate((el) => el.contains(document.activeElement))).toBe(false)
    await page.keyboard.press('Shift+Tab')
    await expect(scroller).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(scroller).not.toBeFocused()
  }

  expect(errors).toEqual([])
})

test('Scroll Reveal plays on entry; once keeps it, reverse hides it again', async ({ page }) => {
  await page.goto('/terms.html#motion/scroll')
  const card = page.locator('#scroll-reveal')
  const scroller = scrollerOf(page, 'scroll-reveal')
  const first = card.locator('[data-reveal]').first()

  await page.waitForTimeout(600)
  expect(await opacity(first)).toBe(0)
  await scrollTo(scroller, 120)
  await expect.poll(() => opacity(first)).toBe(1)
  await scrollTo(scroller, 0)
  await page.waitForTimeout(600)
  expect(await opacity(first)).toBe(1)

  await card.getByRole('button', { name: '나갈 때 되돌림' }).click()
  await expect.poll(() => opacity(first)).toBe(0)
  await scrollTo(scroller, 120)
  await expect.poll(() => opacity(first)).toBe(1)
  await scrollTo(scroller, 0)
  await expect.poll(() => opacity(first)).toBe(0)
})

test('Pin stays fixed for 500px and shows the remaining distance, in both directions', async ({ page }) => {
  await page.goto('/terms.html#motion/scroll')
  const card = page.locator('#pin')
  const scroller = scrollerOf(page, 'pin')
  const status = card.locator('output').first()
  const offset = () => card.locator('[data-pinned]').evaluate((el) =>
    Math.round(el.getBoundingClientRect().top - el.closest('section')!.getBoundingClientRect().top))

  await expect(status).toHaveText('고정 전 · 남은 고정 거리 500px')
  await expect(card.getByText('▼ 고정 시작')).toBeAttached()
  await expect(card.getByText('▲ 고정 끝')).toBeAttached()

  await scrollTo(scroller, 296)
  await expect(status).toHaveText('고정 중 · 남은 고정 거리 300px')
  expect(await offset()).toBe(1) // 위 border 1px
  await scrollTo(scroller, 700)
  await expect(status).toHaveText('고정 해제 · 남은 고정 거리 0px')
  expect(await offset()).toBeLessThan(0)
  await scrollTo(scroller, 296)
  await expect(status).toHaveText('고정 중 · 남은 고정 거리 300px')
})

test('Scroll Snap aligns only when snapping is on', async ({ page }) => {
  await page.goto('/terms.html#motion/scroll')
  const card = page.locator('#scroll-snap')
  const scroller = scrollerOf(page, 'scroll-snap')
  await scroller.scrollIntoViewIfNeeded()
  const height = await scroller.evaluate((el) => el.clientHeight)

  await scrollTo(scroller, height * 0.7)
  await expect.poll(() => scrollTop(scroller)).toBe(height)
  await expect(card.getByText(/경계에 정렬됨/)).toBeVisible()

  await card.getByRole('button', { name: 'snap 끔' }).click()
  await scrollTo(scroller, 90)
  await expect(card.getByText('위치 90px · 경계에서 어긋남')).toBeVisible()
})

test('Scrollytelling, Parallax and Pinned Horizontal Scroll follow the scroll position both ways', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/scroll')

  const story = page.locator('#scrollytelling')
  const storyScroller = scrollerOf(page, 'scrollytelling')
  await expect(story.getByText('1 / 3 단계 · 그림 고정')).toBeVisible()
  await scrollTo(storyScroller, 224)
  await expect(story.getByRole('img', { name: /2단계 그림/ })).toBeVisible()
  await scrollTo(storyScroller, 450)
  await expect(story.getByText('3 / 3 단계 · 그림 고정')).toBeVisible()
  await scrollTo(storyScroller, 0)
  await expect(story.getByText('1 / 3 단계 · 그림 고정')).toBeVisible()
  // 중간 위치에서 Pin 없는 구성으로 바꾸면 처음부터 다시 시작한다.
  await scrollTo(storyScroller, 450)
  await story.getByRole('button', { name: 'Pin 없이 순서대로 노출' }).click()
  await expect(story.getByRole('img')).toHaveCount(3)
  expect(await scrollTop(storyScroller)).toBe(0)
  const third = story.locator('[data-story-reveal]').last()
  expect(await opacity(third)).toBe(0)
  await scrollTo(storyScroller, 450)
  await expect.poll(() => opacity(third)).toBe(1)

  const parallax = page.locator('#parallax-scrolling')
  const parallaxScroller = scrollerOf(page, 'parallax-scrolling')
  const layerY = (name: string) => svgY(parallax.locator(`[data-layer="${name}"]`))
  await scrollTo(parallaxScroller, 1000)
  await expect.poll(() => layerY('front')).toBeCloseTo(-80, 0)
  expect(await layerY('back')).toBeCloseTo(-30, 0)
  // 중간 위치에서 강도를 바꿔도 같은 위치의 상태로 다시 계산한다.
  await parallax.getByRole('slider', { name: 'Parallax 강도' }).fill('100')
  await expect.poll(() => layerY('front')).toBeCloseTo(-110, 0)
  await parallax.getByRole('slider', { name: 'Parallax 강도' }).fill('0')
  await expect.poll(() => layerY('front')).toBeCloseTo(-50, 0)
  expect(await layerY('back')).toBeCloseTo(-50, 0)
  await scrollTo(parallaxScroller, 0)
  await expect.poll(() => layerY('front')).toBeCloseTo(0, 0)

  const horizontal = page.locator('#pinned-horizontal-scroll')
  const horizontalScroller = scrollerOf(page, 'pinned-horizontal-scroll')
  const track = horizontal.getByRole('list', { name: '프로젝트 카드' })
  await scrollTo(horizontalScroller, 1000)
  await expect(horizontal.getByText('가로 이동 100%')).toBeVisible()
  // 마지막 카드가 화면 안에 들어온다.
  const gap = await track.evaluate((el) => el.parentElement!.getBoundingClientRect().right - el.lastElementChild!.getBoundingClientRect().right)
  expect(gap).toBeGreaterThanOrEqual(0)
  expect((await translate(track)).x).toBeLessThan(0)
  await scrollTo(horizontalScroller, 0)
  await expect.poll(async () => (await translate(track)).x).toBe(0)
  await scrollTo(horizontalScroller, 200)
  await horizontal.getByRole('button', { name: '모바일' }).click()
  await expect(horizontal.getByText('세로 목록', { exact: true })).toBeVisible()
  expect((await translate(track)).x).toBe(0)
  const boxes = await track.getByRole('listitem').evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top))
  expect([...boxes].sort((a, b) => a - b)).toEqual(boxes)
  expect(new Set(boxes).size).toBe(5)
  await horizontal.getByRole('button', { name: '모바일' }).click()
  await scrollTo(horizontalScroller, 1000)
  await expect(horizontal.getByText('가로 이동 100%')).toBeVisible()

  // 새로고침하면 처음 상태에서 시작하고, 범주를 바꿔도 오류가 없다.
  await page.reload()
  await expect(story.getByText('1 / 3 단계 · 그림 고정')).toBeVisible()
  await page.goto('/terms.html#motion/pointer-event')
  await expect(page.locator('#magnetic-button')).toBeVisible()
  await page.goto('/terms.html#motion/scroll')
  await scrollTo(scrollerOf(page, 'pin'), 296)
  await expect(page.locator('#pin').locator('output').first()).toHaveText('고정 중 · 남은 고정 거리 300px')
  expect(errors).toEqual([])
})
