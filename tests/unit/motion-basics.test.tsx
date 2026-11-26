import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import section from '@terms/data/motion'
import { FadeDemo, ScaleDemo, SlideDemo } from '@terms/demos/motion-basics'

afterEach(() => {
  cleanup()
})

const tweens = () => gsap.globalTimeline.getChildren(true, true, true)
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
/** 마지막에 만든 timeline을 time초 위치로 옮긴다. */
const root = () => gsap.globalTimeline.getChildren(false, false, true).at(-1) as gsap.core.Timeline
const jump = (time: number) => act(() => void root().pause().time(time))
const el = (container: HTMLElement, selector: string) => container.querySelector<HTMLElement>(selector)!

describe('Motion · Basics data', () => {
  const basics = section.categories.find(({ id }) => id === 'basics')!

  it('registers Fade, Slide, Scale in document order with matching demos', async () => {
    const ids = ['fade', 'slide', 'scale']
    expect(basics.terms.map(({ id }) => id)).toEqual(ids)
    expect(Object.keys(await basics.loadDemos())).toEqual(ids)
  })

  it('connects the excluded term Zoom In to Scale', () => {
    expect(basics.terms.find(({ id }) => id === 'scale')!.aliases).toEqual(['Pop', 'Zoom In'])
  })
})

describe('Motion · Basics demos', () => {
  it.each([
    ['FadeDemo', FadeDemo],
    ['SlideDemo', SlideDemo],
    ['ScaleDemo', ScaleDemo],
  ])('%s: no tween before 재생, none left after unmount, no speed slider', (_, Demo) => {
    const before = tweens().length
    const { unmount } = render(createElement(Demo))
    expect(tweens().length).toBe(before)
    expect(screen.queryByRole('slider')).toBeNull()
    press('재생')
    expect(tweens().length).toBeGreaterThan(before)
    unmount()
    expect(tweens().length).toBe(before)
  })

  it('Fade shows the backdrop for the chosen duration and hides it again', () => {
    const { container } = render(<FadeDemo />)
    press('0.6s')
    press('재생')
    const backdrop = el(container, '.fade-backdrop')
    expect(root().duration()).toBeCloseTo(0.6 + 1 + 0.6)
    jump(0.6)
    expect([backdrop.style.opacity, backdrop.style.visibility]).toEqual(['1', 'inherit'])
    jump(2.2)
    expect([backdrop.style.opacity, backdrop.style.visibility]).toEqual(['0', 'hidden'])
  })

  it('Slide enters from the chosen side and leaves after 3 seconds', () => {
    const { container } = render(<SlideDemo />)
    press('왼쪽')
    press('Fade와 같이: 끔')
    press('재생')
    const layer = el(container, '.slide-layer')
    jump(0)
    expect(gsap.getProperty(layer, 'xPercent')).toBe(-100)
    expect(layer.style.opacity).toBe('0')
    jump(1)
    expect(gsap.getProperty(layer, 'xPercent')).toBe(0)
    expect(layer.style.opacity).toBe('1')
    expect(root().duration()).toBeCloseTo(0.35 + 3 + 0.35)
    act(() => void root().progress(1))
    expect(layer.style.visibility).toBe('hidden')
  })

  it('Scale compares staying at 1.2 with popping back to 1, from the chosen origin', () => {
    render(<ScaleDemo />)
    const badge = screen.getByTestId('scale-badge')
    press('재생')
    act(() => void root().progress(1))
    expect(gsap.getProperty(badge, 'scaleX')).toBe(1)

    press('scale만')
    press('중심: 왼쪽 위')
    expect(badge.style.transformOrigin).toBe('left top')
    press('재생')
    act(() => void root().progress(1))
    expect(gsap.getProperty(badge, 'scaleX')).toBeCloseTo(1.2)
  })
})
