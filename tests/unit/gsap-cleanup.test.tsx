import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterEach, describe, expect, it } from 'vitest'
import { DollyZoomDemo } from '@terms/demos/camera-movement'
import { DissolveDemo } from '@terms/demos/edit-transition'
import { ScrollScrubDemo } from '@terms/demos/motion-scroll'

afterEach(() => {
  cleanup()
})

describe('GSAP cleanup on unmount', () => {
  it('cleans up ScrollTrigger and active tweens for ScrollScrubDemo', () => {
    const { unmount } = render(<ScrollScrubDemo />)
    fireEvent.click(screen.getByRole('button', { name: '2 (관성)' }))
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(0)

    unmount()
    expect(ScrollTrigger.getAll().length).toBe(0)
    const active = gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())
    expect(active.length).toBe(0)
  })

  it('cleans up active GSAP tweens on unmount for DollyZoomDemo', () => {
    const { unmount } = render(<DollyZoomDemo />)
    fireEvent.click(screen.getByRole('button', { name: '재생' }))
    unmount()
    const active = gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())
    expect(active.length).toBe(0)
  })

  it('cleans up active GSAP tweens on unmount for DissolveDemo', () => {
    const { unmount } = render(<DissolveDemo />)
    fireEvent.click(screen.getByRole('button', { name: '재생' }))
    unmount()
    const active = gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())
    expect(active.length).toBe(0)
  })
})
