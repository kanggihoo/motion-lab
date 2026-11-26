import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import motion from '@terms/data/motion'
import {
  CountUpDemo,
  LineDrawingDemo,
  MarqueeDemo,
  MorphingDemo,
  MotionPathDemo,
  SplitTextDemo,
  TextScrambleDemo,
  TypewriterDemo,
} from '@terms/demos/motion-text'
import { formatCount, SCRAMBLE_CHARSETS, typingDuration } from '@terms/lib/motion-text-graphic-math'

const svg = SVGElement.prototype as unknown as Record<string, unknown>

beforeAll(() => {
  // jsdom에는 SVG 기하 API가 없다. DrawSVG가 길이를 읽을 수 있게만 채운다.
  svg.getTotalLength = () => 100
  svg.getBBox = () => ({ x: 0, y: 0, width: 100, height: 100 })
})
afterAll(() => {
  delete svg.getTotalLength
  delete svg.getBBox
})
afterEach(cleanup)

const tweens = () => gsap.globalTimeline.getChildren(true, true, true)
const button = (name: string | RegExp) => screen.getByRole('button', { name })
/** 재생 중인 모든 timeline을 끝으로 보낸다. */
const finish = () => act(() => void gsap.globalTimeline.getChildren(false, true, true).forEach((t) => t.progress(1)))

const DEMOS = {
  typewriter: TypewriterDemo,
  'text-scramble': TextScrambleDemo,
  'split-text': SplitTextDemo,
  'count-up': CountUpDemo,
  'line-drawing': LineDrawingDemo,
  morphing: MorphingDemo,
  marquee: MarqueeDemo,
  'motion-path': MotionPathDemo,
}

describe('Motion · Text & Graphic data', () => {
  const category = motion.categories.find(({ id }) => id === 'text-graphic')!

  it('registers the 8 cards in document order with matching demos', async () => {
    expect(category.terms.map(({ id }) => id)).toEqual(Object.keys(DEMOS))
    expect(await category.loadDemos()).toEqual(DEMOS)
    expect(category.terms.find(({ id }) => id === 'split-text')?.aliases).toEqual(['Text Reveal'])
    expect(category.terms.some(({ repoExample }) => repoExample)).toBe(false)
  })
})

describe('Motion · Text & Graphic math', () => {
  it('derives typing duration, count format, and charsets', () => {
    expect(typingDuration('열두 글자짜리 문장이다', 6)).toBe(2)
    expect(formatCount(12479.6)).toBe('12,480')
    expect(SCRAMBLE_CHARSETS.numbers.chars).toMatch(/^\d{10}$/)
  })
})

describe('Motion · Text & Graphic demos', () => {
  it.each(Object.entries(DEMOS))('%s creates no tween before interaction and leaves none after unmount', (id, Demo) => {
    const before = tweens().length
    const { unmount } = render(<Demo />)
    expect(tweens().length).toBe(before)

    fireEvent.click(button(id === 'motion-path' ? '담기' : /^재생$/))
    expect(tweens().length).toBeGreaterThan(before)
    unmount()
    expect(tweens().length).toBe(before)
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })

  it('Typewriter keeps the sentence for screen readers and toggles the cursor', () => {
    const { container } = render(<TypewriterDemo />)
    const sentence = container.querySelector('.sr-only:not(legend)')!.textContent!
    expect(screen.getByTestId('type-cursor').className).not.toContain('animate-')
    fireEvent.click(button('재생'))
    expect(screen.getByTestId('type-cursor').className).toContain('animate-')
    expect(container.querySelector('.sr-only')!.textContent).toBe(sentence)
    finish()
    expect(container.querySelector('.type-target')!.textContent!.replaceAll(' ', ' ')).toBe(sentence)
    fireEvent.click(button('커서 켜짐'))
    expect(screen.queryByTestId('type-cursor')).toBeNull()
    expect(screen.getByRole('slider', { name: /타이핑 속도/ })).toBeDefined()
    expect(screen.queryByRole('slider', { name: '재생 속도' })).toBeNull()
  })

  it('Text Scramble names the final title and ends on it', () => {
    const { container } = render(<TextScrambleDemo />)
    fireEvent.click(button('기호'))
    fireEvent.click(button('재생'))
    expect(screen.getByRole('heading', { name: 'SYSTEM ONLINE 2026' })).toBeDefined()
    finish()
    expect(container.querySelector('.scramble-target')!.textContent).toBe('SYSTEM ONLINE 2026')
  })

  it('Split Text splits by the chosen unit and restores the title on unit change', () => {
    const { container } = render(<SplitTextDemo />)
    const title = container.querySelector('.split-target')!
    const original = title.innerHTML
    fireEvent.click(button('재생'))
    expect(title.children.length).toBeGreaterThan(1)
    expect(title.getAttribute('aria-label')).toBe(original)
    fireEvent.click(button('글자'))
    expect(title.innerHTML).toBe(original)
    expect(title.hasAttribute('aria-label')).toBe(false)
  })

  it('Count-up keeps final values readable and restores them when easing changes', () => {
    const { container } = render(<CountUpDemo />)
    const shown = () => Array.from(container.querySelectorAll('.count-value'), (el) => el.textContent)
    const final = ['12,480', '98,700', '3,254']
    expect(shown()).toEqual(final)
    fireEvent.click(button('재생'))
    expect(shown()).toEqual(['0', '0', '0'])
    expect(Array.from(container.querySelectorAll('dd .sr-only'), (el) => el.textContent)).toEqual(final)
    finish()
    expect(shown()).toEqual(final)
    fireEvent.click(button('다시 재생'))
    fireEvent.click(button('linear'))
    expect(shown()).toEqual(final)
    expect(screen.getByText(/^linear:/)).toBeDefined()
  })

  it('Line Drawing scrub mode drops the replay button and cleans up its ScrollTrigger', () => {
    const before = tweens().length
    const { unmount } = render(<LineDrawingDemo />)
    fireEvent.click(button('Scroll Scrub'))
    expect(screen.queryByRole('button', { name: /재생$/ })).toEqual(button('시간 재생'))
    expect(screen.getByRole('region', { name: 'Line Drawing 내부 스크롤 영역' }).tabIndex).toBe(0)
    expect(ScrollTrigger.getAll()).toHaveLength(1)
    fireEvent.click(button('시간 재생'))
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    fireEvent.click(button('Scroll Scrub'))
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    expect(tweens().length).toBe(before)
  })

  it('Morphing updates aria state, shapes, and the plain-swap comparison', () => {
    const { container } = render(<MorphingDemo />)
    const menu = button('메뉴 열기')
    expect(menu.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(menu)
    expect(menu.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByTestId('swap-menu').textContent).toBe('X 아이콘')
    expect(screen.getByTestId('swap-save').textContent).toBe('저장 아이콘')
    finish()
    const shape = container.querySelector('.save-shape')!
    const bookmark = shape.getAttribute('d')
    fireEvent.click(button('저장'))
    finish()
    expect(shape.getAttribute('d')).not.toBe(bookmark)
    expect(button('저장됨').getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector<SVGElement>('.bar-middle')!.style.visibility).toBe('hidden')
  })

  it('Marquee starts stopped, hides the clone, and holds on focus', () => {
    const before = tweens().length
    const { container } = render(<MarqueeDemo />)
    expect(screen.getAllByRole('list')).toHaveLength(1)
    expect(container.querySelectorAll('ul')).toHaveLength(2)
    expect(tweens().length).toBe(before)
    fireEvent.click(button('재생'))
    const loop = gsap.globalTimeline.getChildren(false, false, true).at(-1)!
    expect(loop.paused()).toBe(false)
    const region = screen.getByRole('region', { name: /고객사 로고 띠/ })
    fireEvent.focus(region)
    expect(loop.paused()).toBe(true)
    fireEvent.blur(region)
    expect(loop.paused()).toBe(false)
    fireEvent.click(button('일시정지'))
    expect(loop.paused()).toBe(true)
  })

  it('Motion Path toggles the path line', () => {
    render(<MotionPathDemo />)
    expect(screen.getByTestId('cart-path')).toBeDefined()
    fireEvent.click(button('경로선 켜짐'))
    expect(screen.queryByTestId('cart-path')).toBeNull()
  })
})
