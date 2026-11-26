import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterEach, describe, expect, it } from 'vitest'
import motion from '@terms/data/motion'
import * as demos from '@terms/demos/motion-scroll'
import {
  PIN_DISTANCE,
  horizontalShift,
  isSnapAligned,
  parallaxShift,
  pinStateAt,
  storyStepAt,
} from '@terms/lib/motion-scroll-math'

afterEach(cleanup)

const tweens = () => gsap.globalTimeline.getChildren(true, true, true)
const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed')

const scroll = motion.categories.find(({ id }) => id === 'scroll')!

describe('Motion · Scroll data', () => {
  it('registers seven cards in D-16 order', () => {
    expect(scroll.terms.map(({ id }) => id)).toEqual([
      'scroll-reveal', 'scroll-scrub', 'pin', 'scroll-snap',
      'scrollytelling', 'parallax-scrolling', 'pinned-horizontal-scroll',
    ])
  })

  it('puts repoExample only on the three essay-backed cards', () => {
    const examples = scroll.terms.flatMap((term) => ('repoExample' in term ? [[term.id, term.repoExample]] : []))
    expect(examples.map(([id]) => id)).toEqual(['scroll-scrub', 'pin', 'scrollytelling'])
    for (const [, text] of examples) expect(text).toContain('src/connection-pool/Scrolly.tsx:')
  })
})

describe('Motion · Scroll math', () => {
  it('reports pin phase and remaining distance', () => {
    expect(pinStateAt(0)).toEqual({ phase: 'before', remaining: PIN_DISTANCE })
    expect(pinStateAt(0.4)).toEqual({ phase: 'pinned', remaining: 300 })
    expect(pinStateAt(1.2)).toEqual({ phase: 'after', remaining: 0 })
  })

  it('maps progress to story steps, the same in either direction', () => {
    expect([0, 0.2, 0.3, 0.7, 0.8, 1].map((p) => storyStepAt(p, 3))).toEqual([0, 0, 1, 1, 2, 2])
  })

  it('separates parallax layers only when strength is above zero', () => {
    const shifts = (s: number) => (['back', 'middle', 'front'] as const).map((layer) => parallaxShift(layer, s))
    expect(new Set(shifts(0)).size).toBe(1)
    const [back, middle, front] = shifts(1) as [number, number, number]
    expect(back).toBeLessThan(middle)
    expect(middle).toBeLessThan(front)
  })

  it('computes horizontal shift and snap alignment', () => {
    expect(horizontalShift(800, 300)).toBe(-500)
    expect(horizontalShift(200, 300)).toBe(0)
    expect([0, 222, 443.5, 100].map((top) => isSnapAligned(top, 222))).toEqual([true, true, true, false])
  })
})

describe('Motion · Scroll demos', () => {
  const names = [
    'ScrollRevealDemo', 'ScrollScrubDemo', 'PinDemo', 'ScrollSnapDemo',
    'ScrollytellingDemo', 'ParallaxScrollingDemo', 'PinnedHorizontalScrollDemo',
  ] as const

  it.each(names)('%s has a focusable scroller, no replay, and leaves no tween or ScrollTrigger', (name) => {
    const before = tweens().length
    const Demo = demos[name]
    const { unmount } = render(<Demo />)
    expect(screen.getByRole('region', { name: /내부 스크롤 영역/ }).tabIndex).toBe(0)
    expect(screen.queryByRole('button', { name: /재생/ })).toBeNull()
    expect(screen.queryByRole('slider', { name: '재생 속도' })).toBeNull()
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    expect(tweens().length).toBe(before)
  })

  it('recreates triggers instead of piling them up when settings change', () => {
    const { unmount } = render(<demos.ScrollRevealDemo />)
    expect(ScrollTrigger.getAll()).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: '나갈 때 되돌림' }))
    fireEvent.click(screen.getByRole('button', { name: '한 번만' }))
    expect(ScrollTrigger.getAll()).toHaveLength(3)
    unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })

  it('switches Scrollytelling between pinned and flow layouts and links the essay relatively', () => {
    const { container } = render(<demos.ScrollytellingDemo />)
    expect(container.querySelector('[data-story-graphic]')).not.toBeNull()
    expect(screen.getByRole('link', { name: '커넥션 풀 에세이' }).getAttribute('href')).toBe('./connection-pool/')
    fireEvent.click(screen.getByRole('button', { name: 'Pin 없이 순서대로 노출' }))
    expect(container.querySelector('[data-story-graphic]')).toBeNull()
    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(ScrollTrigger.getAll()).toHaveLength(3)
  })

  it('turns Pinned Horizontal Scroll into a vertical list without triggers', () => {
    render(<demos.PinnedHorizontalScrollDemo />)
    expect(ScrollTrigger.getAll()).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: '모바일' }))
    expect(pressed('모바일')).toBe('true')
    expect(screen.getByText('세로 목록')).toBeDefined()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(ScrollTrigger.getAll()).toHaveLength(0)
  })

  it('switches the CSS snap type', () => {
    render(<demos.ScrollSnapDemo />)
    const region = screen.getByRole('region', { name: 'Scroll Snap 내부 스크롤 영역' })
    expect(region.className).toContain('snap-mandatory')
    fireEvent.click(screen.getByRole('button', { name: 'proximity' }))
    expect(region.className).toContain('snap-proximity')
    fireEvent.click(screen.getByRole('button', { name: 'snap 끔' }))
    expect(region.className).toContain('snap-none')
  })
})
