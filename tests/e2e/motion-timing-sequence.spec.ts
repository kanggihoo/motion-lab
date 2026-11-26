import { expect, test, type Locator, type Page } from '@playwright/test'

const IDS = ['easing', 'spring', 'bounce', 'duration-delay', 'stagger', 'loop', 'keyframe', 'timeline']
const transform = (target: Locator) => target.evaluate((element) => getComputedStyle(element).transform)

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(`console.${msg.type()}: ${msg.text()}`)
  })
  return errors
}

test('Motion · Timing & Sequence: no autoplay, speed sliders, replay and cleanup', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/timing-sequence')

  for (const id of IDS) {
    const card = page.locator(`#${id}`)
    await expect(card.getByRole('button', { name: '재생', exact: true })).toBeVisible()
    await expect(card.getByRole('slider', { name: '재생 속도' })).toHaveValue('1')
  }

  // 조작 전에는 아무것도 움직이지 않는다.
  const moving = page.locator('#easing .ease-mover-linear, #loop .loop-float, #bounce .bounce-check')
  await page.waitForTimeout(600)
  for (const target of await moving.all()) expect(await transform(target)).toBe('none')
  await expect(page.locator('#easing .ease-dot').first()).toHaveAttribute('cx', '4')

  for (const id of IDS.filter((id) => id !== 'loop')) {
    const card = page.locator(`#${id}`)
    await card.getByRole('slider', { name: '재생 속도' }).fill('2')
    await card.getByRole('button', { name: '재생', exact: true }).click()
    await expect(card.getByRole('button', { name: '다시 재생' })).toBeVisible({ timeout: 10_000 })
  }
  await expect(page.locator('#easing .ease-dot').first()).toHaveAttribute('cx', '96')

  // Spring: 카드 자체를 키보드로 눌러 재생한다.
  const spring = page.locator('#spring')
  await spring.getByRole('slider', { name: 'damping' }).fill('30')
  await expect(spring.getByText('목표를 지나치지 않음')).toBeVisible()
  await spring.getByRole('button', { name: '카드 누르기' }).press('Enter')
  await expect.poll(() => transform(spring.locator('.spring-card'))).toBe('matrix(1.35, 0, 0, 1.35, 0, 0)')

  // 재생 중 범주 전환
  await page.locator('#stagger').getByRole('button', { name: '다시 재생' }).click()
  await page.goto('/terms.html#motion/basics')
  await expect(page.locator('#fade')).toBeVisible()
  await expect(page.locator('#stagger')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('Loop toggles, Keyframe handle drags, Timeline bars drag, scrub and reverse', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#motion/timing-sequence')

  // Loop: 재생 → 일시정지하면 위치가 고정된다.
  const loop = page.locator('#loop')
  await loop.getByRole('button', { name: '다섯 개 동시' }).click()
  await expect(loop.locator('.loop-float')).toHaveCount(5)
  await loop.getByRole('button', { name: '재생', exact: true }).click()
  const first = loop.locator('.loop-float').first()
  await expect.poll(() => transform(first)).not.toBe('none')
  await loop.getByRole('button', { name: '일시정지' }).click()
  const held = await transform(first)
  await page.waitForTimeout(400)
  expect(await transform(first)).toBe(held)

  // Keyframe: 손잡이를 마우스로 끌면 가운데 지점이 옮겨진다.
  const keyframe = page.locator('#keyframe')
  const handle = keyframe.getByRole('slider', { name: '중간 keyframe 위치' })
  await handle.scrollIntoViewIfNeeded()
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  await expect(keyframe.getByText(/^(15|20|25)% · scale 1\.2$/)).toBeVisible()

  // Timeline: 막대를 끌면 겹침이 바뀌고 바로 재생된다.
  const timeline = page.locator('#timeline')
  const bar = timeline.getByRole('button', { name: /부제 막대/ })
  await bar.scrollIntoViewIfNeeded()
  const from = (await bar.boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width, from.y + from.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(timeline.getByRole('button', { name: /부제 막대: .*간격/ })).toBeVisible()
  await expect(timeline.getByRole('button', { name: '다시 재생' })).toBeVisible()

  const scrubber = timeline.getByRole('slider', { name: '타임라인 스크러버' })
  await expect(scrubber).toHaveValue('100')
  await scrubber.fill('0')
  await expect.poll(() => timeline.locator('.tl-title').evaluate((el) => getComputedStyle(el).opacity)).toBe('0')
  await scrubber.fill('100')
  await timeline.getByRole('button', { name: /되감기/ }).click()
  await expect(scrubber).toHaveValue('0')

  // 키보드: 화살표로 막대를 옮기고 Tab으로 다음 컨트롤에 간다.
  await bar.focus()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Tab')
  await expect(timeline.getByRole('button', { name: /버튼 막대/ })).toBeFocused()

  // D-16 · Reverse 검색
  await page.getByRole('button', { name: '전체 용어 검색' }).click()
  const search = page.getByPlaceholder('이름·별칭으로 검색')
  await search.fill('Reverse')
  await expect(page.getByRole('option', { name: /Timeline/ })).toBeVisible()
  await search.fill('Smooth Transition')
  await expect(page.getByRole('option', { name: /Easing/ })).toBeVisible()
  await expect(page.getByRole('option', { name: /Duration \/ Delay/ })).toBeVisible()
  await page.keyboard.press('Escape')

  await page.setViewportSize({ width: 360, height: 800 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)

  // Loop 재생 중 섹션 전환
  await loop.getByRole('button', { name: '재생', exact: true }).click()
  await page.goto('/terms.html#ui/layout')
  await expect(page.locator('#loop')).toHaveCount(0)
  expect(errors).toEqual([])
})
