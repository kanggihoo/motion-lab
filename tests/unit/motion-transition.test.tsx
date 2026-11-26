import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { afterEach, describe, expect, it } from 'vitest'
import motion from '@terms/data/motion'
import { PageTransitionDemo, SharedElementTransitionDemo } from '@terms/demos/motion-transition'

afterEach(cleanup)

const tweens = () => gsap.globalTimeline.getChildren(true, true, true)
const button = (name: string | RegExp) => screen.getByRole('button', { name })
const finish = () => act(() => void gsap.globalTimeline.getChildren(false, true, true).forEach((t) => t.progress(1)))

describe('Motion · Transition', () => {
  it('registers the 2 cards with matching demos', async () => {
    const category = motion.categories.find(({ id }) => id === 'transition')!
    expect(category.terms.map(({ id }) => id)).toEqual(['page-transition', 'shared-element-transition'])
    expect(await category.loadDemos()).toEqual({
      'page-transition': PageTransitionDemo,
      'shared-element-transition': SharedElementTransitionDemo,
    })
  })

  it.each([PageTransitionDemo, SharedElementTransitionDemo])('%o is idle until played and cleans up', (Demo) => {
    const before = tweens().length
    const { unmount } = render(<Demo />)
    expect(tweens().length).toBe(before)
    fireEvent.click(button('재생'))
    expect(tweens().length).toBeGreaterThan(before)
    unmount()
    expect(tweens().length).toBe(before)
  })

  it.each(['fade', 'slide-up', 'wipe'])('Page Transition %s swaps pages both ways without touching the hash', (effect) => {
    const { container } = render(<PageTransitionDemo />)
    const style = (index: number) => container.querySelector<HTMLElement>(`.page-${index}`)!.style
    const hash = window.location.hash
    fireEvent.click(button(effect))
    fireEvent.click(button('소개'))
    expect(button('소개').getAttribute('aria-current')).toBe('page')
    finish()
    expect([style(0).visibility, style(1).visibility]).toEqual(['hidden', 'inherit'])
    fireEvent.click(button('홈'))
    finish()
    expect([style(0).visibility, style(1).visibility]).toEqual(['inherit', 'hidden'])
    expect(window.location.hash).toBe(hash)
  })

  it.each(['Shared Element', 'Page Transition'])('%s opens the detail, moves focus, and returns', (mode) => {
    const before = tweens().length
    render(<SharedElementTransitionDemo />)
    fireEvent.click(button(mode))
    fireEvent.click(button('조명'))
    finish()
    expect(screen.getByRole('region', { name: '조명 상세' })).toBeDefined()
    expect(document.activeElement).toBe(button('목록으로'))
    fireEvent.click(button('목록으로'))
    expect(screen.queryByRole('region')).toBeNull()
    expect(document.activeElement).toBe(button('조명'))
    expect(tweens().length).toBe(before)
  })
})
