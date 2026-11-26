import { expect, test, type Locator, type Page } from '@playwright/test'

const IDS = [
  'high-low-angle',
  'birds-eye-view',
  'dutch-angle',
  'shot-size',
  'pov-shot',
  'over-the-shoulder',
  'establishing-shot',
]

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })
  return errors
}

async function show(page: Page, id: string): Promise<Locator> {
  const card = page.locator(`#${id}`)
  await card.locator('figure').scrollIntoViewIfNeeded()
  await expect(card.locator('canvas')).toHaveCount(1)
  return card
}

async function press(card: Locator, name: string) {
  const button = card.getByRole('button', { name, exact: true })
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
}

test('Camera · Angle & Framing cards: one canvas, no replay, controls update diagram and labels', async ({ page }) => {
  test.setTimeout(90_000)
  const errors = trackErrors(page)
  await page.goto('/terms.html#camera/angle-framing')

  for (const id of IDS) {
    const card = await show(page, id)
    await expect(card.getByRole('button', { name: /재생/ })).toHaveCount(0)
    await expect(card.locator('svg[data-view]')).toHaveCount(1)
  }

  const angle = await show(page, 'high-low-angle')
  const height = angle.getByRole('slider', { name: '카메라 높이' })
  await expect(height).toHaveValue('1')
  await expect(angle.getByText('배경: 지평선 · 인상: 대등함')).toBeVisible()
  await height.fill('0')
  await expect(angle.getByText('배경: 하늘 · 인상: 크고 위압적')).toBeVisible()
  await height.fill('2')
  await expect(angle.getByText('배경: 바닥 · 인상: 작고 고립됨')).toBeVisible()
  await expect(height).toHaveAttribute('aria-valuetext', 'High Angle · 4.8m')

  const bird = await show(page, 'birds-eye-view')
  await press(bird, "Bird's-eye View (수직 90°)")
  await expect(bird.getByText('수직 90° · 지도 같은 배치')).toBeVisible()

  const dutch = await show(page, 'dutch-angle')
  await expect(dutch.getByText('수평 0°')).toBeVisible()
  await dutch.getByRole('slider', { name: '기울기' }).fill('25')
  await expect(dutch.getByText('Dutch Angle 25°')).toBeVisible()
  await expect(dutch.getByTestId('level-guide')).toBeVisible()
  await expect(dutch.getByTestId('tilted-horizon')).toHaveCSS('rotate', '25deg')

  const shot = await show(page, 'shot-size')
  await expect(shot.getByTestId('frame-box')).toHaveCount(3)
  await press(shot, 'Medium')
  await expect(shot.getByTestId('frame-box')).toHaveCount(2)
  await press(shot, 'Close-up')
  await expect(shot.getByTestId('frame-box')).toHaveCount(1)
  await press(shot, 'Extreme Close-up')
  await expect(shot.getByTestId('frame-box')).toHaveCount(0)
  await expect(shot.getByText('현재 화면: Extreme Close-up · 두 눈')).toBeVisible()

  const pov = await show(page, 'pov-shot')
  await expect(pov.getByText('3인칭 · 뒤에서')).toBeVisible()
  await expect(pov.getByText('POV Shot · 앉은 눈')).toBeVisible()

  const ots = await show(page, 'over-the-shoulder')
  await press(ots, 'B 시점')
  await expect(ots.getByText('B 시점 · 앞 어깨 B(파랑) → 상대 A(주황)')).toBeVisible()

  const establishing = await show(page, 'establishing-shot')
  const strip = establishing.getByRole('list', { name: '컷 순서' })
  await expect(strip.getByText('1컷 Establishing Shot', { exact: true })).toBeVisible()
  await press(establishing, 'Establishing Shot 없음')
  await expect(strip.getByText('1컷 Establishing Shot (빠짐)')).toBeVisible()
  await expect(establishing.getByText('첫 컷부터 Medium Shot · 어디인지 알 수 없음')).toBeVisible()
  await press(establishing, 'Establishing Shot 있음')

  for (const id of IDS) await show(page, id)

  // 섹션 전환 후에도 오류 없이 다음 섹션이 뜬다.
  await page.getByRole('link', { name: 'Look' }).click()
  await expect(page.locator('#color-grading')).toBeVisible()
  await expect(page.locator('#establishing-shot')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('Camera · Angle & Framing aliases are searchable and keyboard operates a toggle', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/terms.html#camera/angle-framing/over-the-shoulder')
  const ots = page.locator('#over-the-shoulder')
  await ots.getByRole('button', { name: 'B 시점' }).focus()
  await page.keyboard.press('Space')
  await expect(ots.getByRole('button', { name: 'B 시점' })).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: '전체 용어 검색' }).click()
  const search = page.getByPlaceholder('이름·별칭으로 검색')
  for (const [alias, name] of [
    ['Canted Angle', /Dutch Angle/],
    ['First-person', /POV Shot/],
    ['Top-down', /Bird's-eye View/],
  ] as const) {
    await search.fill(alias)
    await expect(page.getByRole('option', { name })).toBeVisible()
  }
  expect(errors).toEqual([])
})
