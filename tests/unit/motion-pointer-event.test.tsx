import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { afterEach, describe, expect, it } from 'vitest'
import motion from '@terms/data/motion'
import { ConfettiDemo, CustomCursorDemo, MagneticButtonDemo, ThreeDTiltDemo } from '@terms/demos/motion-pointer'
import { FINE_POINTER_QUERY } from '@terms/hooks/use-fine-pointer'
import { magneticOffset, tiltAt } from '@terms/lib/motion-pointer-event-math'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  cleanup()
  window.matchMedia = originalMatchMedia
})

function useMousePointer() {
  window.matchMedia = ((query: string) => ({
    matches: query === FINE_POINTER_QUERY,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
}

const tweens = () => gsap.globalTimeline.getChildren(true, true, true)

const pointerDemos = [
  ['Magnetic Button', MagneticButtonDemo, 'magnetic-area'],
  ['Custom Cursor', CustomCursorDemo, 'cursor-area'],
  ['3D Tilt', ThreeDTiltDemo, 'tilt-area'],
] as const

describe('Motion · Pointer & Event data', () => {
  it('registers four cards and the Cursor Follow alias', () => {
    const terms = motion.categories.find(({ id }) => id === 'pointer-event')!.terms
    expect(terms.map(({ id }) => id)).toEqual(['magnetic-button', 'custom-cursor', '3d-tilt', 'confetti'])
    expect(terms[1]!.aliases).toEqual(['Cursor Follow'])
  })
})

describe('Motion · Pointer & Event math', () => {
  it('pulls toward the pointer, never beyond max, and ignores far pointers', () => {
    expect(magneticOffset(0, 0, 10)).toEqual({ x: 0, y: 0 })
    expect(magneticOffset(500, 0, 30)).toEqual({ x: 0, y: 0 })
    for (const [dx, dy] of [[110, 0], [60, -80], [-30, 40]] as const) {
      const { x, y } = magneticOffset(dx, dy, 10, 110)
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(10)
      expect(Math.sign(x)).toBe(Math.sign(dx))
    }
    expect(magneticOffset(50, 0, 0).x).toBe(0)
  })

  it('tilts within max and stays flat at the centre', () => {
    expect(tiltAt(0.5, 0.5, 20)).toMatchObject({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 })
    expect(tiltAt(1, 0, 10)).toMatchObject({ rotateX: 10, rotateY: 10 })
    expect(tiltAt(-3, 9, 10)).toMatchObject({ rotateX: -10, rotateY: -10 })
  })
})

describe('Motion · pointer-only demos', () => {
  it.each(pointerDemos)('%s is off on touch and explains why', (_, Demo, testId) => {
    const before = tweens().length
    render(<Demo />)
    expect(screen.getByText(/터치 기기에서는 꺼집니다/)).toBeDefined()
    fireEvent.pointerMove(screen.getByTestId(testId), { clientX: 30, clientY: 10 })
    expect(tweens().length).toBe(before)
  })

  it.each(pointerDemos)('%s follows a mouse and leaves no tween after unmount', (_, Demo, testId) => {
    useMousePointer()
    const before = tweens().length
    const { unmount } = render(<Demo />)
    expect(screen.queryByText(/터치 기기에서는 꺼집니다/)).toBeNull()
    expect(tweens().every((tween) => tween.paused())).toBe(true)
    fireEvent.pointerMove(screen.getByTestId(testId), { clientX: 30, clientY: 10 })
    expect(tweens().length).toBeGreaterThan(before)
    unmount()
    expect(tweens().length).toBe(before)
  })
})

describe('Confetti', () => {
  it('creates particles only on click, ends within 2 seconds, and cleans up', () => {
    const before = tweens().length
    const { container, unmount } = render(<ConfettiDemo />)
    const particles = container.querySelectorAll('[data-confetti]')
    expect(particles.length).toBeGreaterThan(0)
    expect(particles.length).toBeLessThanOrEqual(50)
    expect(tweens().length).toBe(before)

    act(() => void fireEvent.click(screen.getByRole('button', { name: '첫 결제 완료' })))
    const timeline = gsap.globalTimeline.getChildren(false, false, true)[0] as gsap.core.Timeline
    expect(timeline.duration()).toBeCloseTo(2, 1)
    expect(screen.getByRole('button', { name: /재생 중/ })).toBeDefined()

    unmount()
    expect(tweens().length).toBe(before)
  })
})
