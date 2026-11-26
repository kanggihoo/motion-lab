import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { CAMERA_ASPECT, HERO } from '@terms/components/scene/scene-layout'
import section from '@terms/data/camera'
import * as demos from '@terms/demos/camera-movement'
import {
  ARC_RADIUS,
  CRANE_HIGH,
  CRANE_LOW,
  CRATE_SIZE,
  CRATE_START_Y,
  DOLLY_FAR_Z,
  DOLLY_NEAR_Z,
  HANDHELD_DURATION,
  IMPACT_TIME,
  KEN_BURNS_END,
  KEN_BURNS_START,
  SHAKE_LENGTH,
  TRIPOD_POSITION,
  ZOOM_END_FOV,
  ZOOM_LEAD,
  ZOOM_NARROW_FOV,
  ZOOM_PLAY_DURATION,
  arcAt,
  craneAt,
  crashZoomAt,
  cratePositionAt,
  dollyCompareAt,
  halfHeightAt,
  handheldAt,
  impactShakeAt,
  kenBurnsFrameAt,
  longTakeAt,
  panTiltAt,
  trackingAt,
} from '@terms/lib/camera-movement-math'

afterEach(() => {
  cleanup()
})

const IDS = [
  'dolly-in-out',
  'pan-tilt',
  'tracking-shot',
  'crane-shot',
  'dolly-zoom',
  'arc-shot',
  'crash-zoom',
  'handheld',
  'camera-shake',
  'long-take',
  'ken-burns-effect',
]

describe('Camera · Movement data', () => {
  const movement = section.categories.find((c) => c.id === 'movement')!

  it('registers the 11 Movement cards in camera.md order with matching demos', async () => {
    expect(movement.terms.map((t) => t.id)).toEqual(IDS)
    expect(Object.keys(await movement.loadDemos())).toEqual(IDS)
    for (const term of movement.terms) {
      expect(term.filmmaking?.trim().length, term.id).toBeGreaterThan(0)
      expect(term.implementation.trim().length, term.id).toBeGreaterThan(0)
    }
  })

  it('connects the aliases from the relation lines to search', () => {
    const aliases = Object.fromEntries(movement.terms.map((t) => [t.id, t.aliases]))
    expect(aliases['dolly-in-out']).toEqual(['Push In'])
    expect(aliases['tracking-shot']).toEqual(['Truck', 'Follow Shot'])
    expect(aliases['long-take']).toEqual(['Oner', 'Continuous Shot', 'One Take'])
    expect(aliases['crash-zoom']).toContain('Zoom In')
  })
})

describe('Camera · Movement math', () => {
  it('keeps the subject the same size in Dolly and Zoom while only the dolly camera moves', () => {
    for (const move of ['in', 'out'] as const) {
      for (const p of [0, 0.35, 1]) {
        const { dolly, zoom } = dollyCompareAt(p, move)
        expect(zoom.position[2]).toBe(DOLLY_FAR_Z)
        expect(halfHeightAt(zoom.position[2], zoom.fov)).toBeCloseTo(halfHeightAt(dolly.position[2], dolly.fov), 6)
      }
    }
    expect(dollyCompareAt(1, 'in').dolly.position[2]).toBe(DOLLY_NEAR_Z)
    expect(dollyCompareAt(1, 'in').zoom.fov).toBeCloseTo(ZOOM_NARROW_FOV, 6)
    expect(dollyCompareAt(0, 'out').dolly.position[2]).toBe(DOLLY_NEAR_Z)
  })

  it('rotates Pan / Tilt without moving the camera', () => {
    for (const mode of ['pan', 'tilt'] as const) {
      expect(panTiltAt(0, mode).position).toEqual(TRIPOD_POSITION)
      expect(panTiltAt(1, mode).position).toEqual(TRIPOD_POSITION)
    }
    expect(panTiltAt(0, 'pan').target[0]).toBeLessThan(0)
    expect(panTiltAt(1, 'pan').target[0]).toBeGreaterThan(0)
    expect(panTiltAt(1, 'pan').target[1]).toBeCloseTo(panTiltAt(0, 'pan').target[1])
    expect(panTiltAt(1, 'tilt').target[1]).toBeGreaterThan(panTiltAt(0, 'tilt').target[1])
    expect(panTiltAt(1, 'tilt').target[0]).toBeCloseTo(0)
  })

  it('tracks the subject at the same speed and moves the foreground more than the background', () => {
    for (const p of [0, 0.5, 1]) {
      const shot = trackingAt(p)
      expect(shot.camera.position[0]).toBe(shot.heroPosition[0])
    }
    expect(trackingAt(0).stride).toBe(0)
    expect(trackingAt(1).nearShift).toBeGreaterThan(trackingAt(1).farShift * 3)
    // 가로 화각 안에서 직접 투영한 값과 같다.
    const width = 2 * halfHeightAt(8 - 5.4, 42) * CAMERA_ASPECT
    expect(trackingAt(1).nearShift).toBeCloseTo((4 / width) * 100)
  })

  it('reverses the crane between up and down', () => {
    expect(craneAt(0, 'up')).toEqual(CRANE_LOW)
    expect(craneAt(1, 'up')).toEqual(CRANE_HIGH)
    expect(craneAt(0, 'down')).toEqual(CRANE_HIGH)
    expect(craneAt(1, 'down')).toEqual(CRANE_LOW)
  })

  it('orbits the hero at a constant radius for 180 and 360 degrees', () => {
    for (const sweep of [180, 360] as const) {
      for (const p of [0, 0.3, 1]) {
        const { position, target, angle } = arcAt(p, sweep)
        expect(Math.hypot(position[0] - HERO.position[0], position[2] - HERO.position[2])).toBeCloseTo(ARC_RADIUS)
        expect([target[0], target[2]]).toEqual([HERO.position[0], HERO.position[2]])
        expect(angle).toBeCloseTo(sweep * p)
      }
    }
    expect(arcAt(1, 180).position[2]).toBeCloseTo(-ARC_RADIUS)
    expect(arcAt(1, 360).position[2]).toBeCloseTo(ARC_RADIUS)
  })

  it('finishes Crash Zoom in 0.18s while the normal zoom takes 2s', () => {
    expect(crashZoomAt(0)).toEqual({ slowFov: 42, crashFov: 42 })
    const after = crashZoomAt(ZOOM_LEAD + 0.181)
    expect(after.crashFov).toBeCloseTo(ZOOM_END_FOV)
    expect(after.slowFov).toBeGreaterThan(40)
    expect(crashZoomAt(ZOOM_PLAY_DURATION).slowFov).toBeCloseTo(ZOOM_END_FOV)
  })

  it('shakes gently throughout in Handheld and sharply only around the impact', () => {
    const size = (j: { y: number; pitch: number }) => Math.abs(j.y + j.pitch)
    const peak = (from: number, to: number, at: typeof handheldAt) =>
      Math.max(...Array.from({ length: 200 }, (_, i) => size(at(from + ((to - from) * i) / 200))))
    expect(size(handheldAt(0))).toBe(0)
    expect(size(handheldAt(HANDHELD_DURATION))).toBe(0)
    expect(peak(0.5, 1.5, handheldAt)).toBeGreaterThan(0.02)
    expect(peak(2.5, 3.5, handheldAt)).toBeGreaterThan(0.02)
    expect(size(impactShakeAt(IMPACT_TIME - 0.01))).toBe(0)
    expect(size(impactShakeAt(IMPACT_TIME + SHAKE_LENGTH))).toBe(0)
    expect(size(impactShakeAt(IMPACT_TIME))).toBeGreaterThan(peak(0, 3, handheldAt) * 3)
    expect(peak(IMPACT_TIME + 0.4, IMPACT_TIME + 0.7, impactShakeAt)).toBeLessThan(
      size(impactShakeAt(IMPACT_TIME)) / 4,
    )
  })

  it('drops the crate onto the ground exactly at the impact time', () => {
    expect(cratePositionAt(0)[1]).toBe(CRATE_START_Y)
    expect(cratePositionAt(IMPACT_TIME - 0.05)[1]).toBeGreaterThan(CRATE_SIZE / 2)
    expect(cratePositionAt(IMPACT_TIME)[1]).toBeCloseTo(CRATE_SIZE / 2)
  })

  it('moves Long Take continuously through the three zones', () => {
    expect(longTakeAt(0).zone).toBe(0)
    expect(longTakeAt(0.5).zone).toBe(1)
    expect(longTakeAt(1).zone).toBe(2)
    let previous = longTakeAt(0).position
    for (let i = 1; i <= 200; i++) {
      const { position } = longTakeAt(i / 200)
      expect(Math.hypot(...position.map((v, k) => v - previous[k]!))).toBeLessThan(0.2)
      // 주인공을 뚫고 지나가지 않는다.
      expect(Math.hypot(position[0], position[2])).toBeGreaterThan(1)
      previous = position
    }
  })

  it('pans and zooms the Ken Burns frame from lower left toward the center', () => {
    expect(kenBurnsFrameAt(0)).toEqual(KEN_BURNS_START)
    expect(kenBurnsFrameAt(1)).toEqual(KEN_BURNS_END)
    expect(KEN_BURNS_END.size).toBeLessThan(KEN_BURNS_START.size)
    expect(KEN_BURNS_END.x + KEN_BURNS_END.size / 2).toBeCloseTo(0.5)
    for (const frame of [KEN_BURNS_START, KEN_BURNS_END]) {
      expect(frame.x + frame.size).toBeLessThanOrEqual(1)
      expect(frame.y + frame.size).toBeLessThanOrEqual(1)
    }
  })
})

describe('Camera · Movement demos', () => {
  const activeTweens = () => gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())

  it.each(Object.entries(demos))('%s starts idle and leaves no tween after unmount', (_, Demo) => {
    const { unmount } = render(createElement(Demo))
    expect(gsap.globalTimeline.getChildren(true, true, true)).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: '재생' }))
    expect(gsap.globalTimeline.getChildren(true, true, true).length).toBeGreaterThan(0)
    unmount()
    expect(activeTweens()).toHaveLength(0)
  })

  it('resets to the initial state without a tween when a setting changes', () => {
    render(createElement(demos.ArcShotDemo))
    fireEvent.click(screen.getByRole('button', { name: '재생' }))
    fireEvent.click(screen.getByRole('button', { name: '360°' }))
    expect(activeTweens()).toHaveLength(0)
    expect(screen.getByTestId('camera-status').textContent).toBe('회전 0° / 360°')
    expect(screen.queryByRole('button', { name: '재생' })).not.toBeNull()
  })
})
