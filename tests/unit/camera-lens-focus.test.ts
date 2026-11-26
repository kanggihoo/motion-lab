import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_LOOK_POST_EFFECT, createDualComposerResources, setLensUniforms } from '@terms/components/scene/look-post'
import { sections } from '@terms/data'
import {
  BokehDemo,
  DepthOfFieldDemo,
  FisheyeLensDemo,
  FocalLengthDemo,
  LensFlareDemo,
  MotionBlurDemo,
  RackFocusDemo,
  TiltShiftDemo,
} from '@terms/demos/camera-lens'
import {
  APERTURES,
  BOKEH_HERO_DEPTH,
  BOKEH_LIGHT_DEPTHS,
  DOF_LAYERS,
  FLARE_CAMERA,
  FLARE_GHOSTS,
  FOCAL_OPTIONS,
  PAN_END,
  PAN_START,
  RACK_FLOWER_DEPTH,
  RACK_HERO_DEPTH,
  blurRadius,
  bokehOptics,
  depthOfField,
  dofOptics,
  fisheyeHorizontalFov,
  fisheyeSourceUv,
  flareStrength,
  flareTarget,
  focalOptics,
  ghostPosition,
  motionBlurLength,
  motionBlurUv,
  projectToUv,
  quantizeFrame,
  rackOptics,
  sharpnessLabel,
  tiltGroundZ,
  trainX,
  viewDepth,
} from '@terms/lib/camera-lens-focus-math'
import { TIME_PALETTES } from '@terms/components/scene/scene-colors'

afterEach(() => {
  cleanup()
})

describe('Lens & Focus data', () => {
  it('registers the 8 cards in document order after the other Camera categories', async () => {
    const camera = sections.find((s) => s.id === 'camera')!
    const category = camera.categories.at(-1)!
    expect(category.id).toBe('lens-focus')
    expect(category.terms.map((t) => t.id)).toEqual([
      'rack-focus',
      'bokeh',
      'tilt-shift',
      'fisheye-lens',
      'lens-flare',
      'motion-blur',
      'depth-of-field',
      'focal-length',
    ])
    const demos = await category.loadDemos()
    for (const term of category.terms) {
      expect(typeof demos[term.id]).toBe('function')
      expect(term.filmmaking?.trim().length).toBeGreaterThan(0)
    }
    expect(category.terms.find((t) => t.id === 'rack-focus')!.aliases).toEqual(['Focus Pull'])
    expect(category.terms.find((t) => t.id === 'tilt-shift')!.aliases).toEqual(['Miniature Effect'])
    expect(category.terms.find((t) => t.id === 'depth-of-field')!.aliases).toEqual(['DoF'])
  })
})

describe('Depth of field math', () => {
  it('measures depth along the view axis', () => {
    expect(viewDepth([0, 0, 5], [0, 0, 0], [3, 2, -1])).toBeCloseTo(6, 5)
  })

  it('keeps the blur at zero exactly at the near and far limits of the focus band', () => {
    for (const fNumber of [1.4, 2.8, 5.6]) {
      const optics = dofOptics(fNumber)
      const { near, far } = depthOfField(optics.focalMm, fNumber, optics.focus)
      expect(near).toBeLessThan(optics.focus)
      expect(far).toBeGreaterThan(optics.focus)
      expect(blurRadius(optics, near)).toBeCloseTo(0, 6)
      expect(blurRadius(optics, far)).toBeCloseTo(0, 6)
      expect(blurRadius(optics, near * 0.8)).toBeGreaterThan(0)
    }
  })

  it('widens the band as the aperture closes', () => {
    const widths = APERTURES.map((n) => {
      const { near, far } = depthOfField(50, n, 9)
      return far - near
    })
    for (let i = 1; i < widths.length; i++) expect(widths[i]!).toBeGreaterThan(widths[i - 1]!)
    expect(depthOfField(50, 16, 12).far).toBe(Number.POSITIVE_INFINITY)
  })

  it('blurs foreground and background at f/1.4 and keeps all layers sharp at f/16', () => {
    expect(DOF_LAYERS.map((l) => sharpnessLabel(dofOptics(1.4), l.depth))).toEqual(['흐림', '선명', '흐림'])
    expect(DOF_LAYERS.map((l) => sharpnessLabel(dofOptics(16), l.depth))).toEqual(['선명', '선명', '선명'])
  })

  it('swaps the sharp subject between the ends of Rack Focus', () => {
    expect(sharpnessLabel(rackOptics(0), RACK_FLOWER_DEPTH)).toBe('선명')
    expect(sharpnessLabel(rackOptics(0), RACK_HERO_DEPTH)).toBe('흐림')
    expect(sharpnessLabel(rackOptics(1), RACK_FLOWER_DEPTH)).toBe('흐림')
    expect(sharpnessLabel(rackOptics(1), RACK_HERO_DEPTH)).toBe('선명')
  })

  it('turns distant lights into large discs only when the hero is in focus', () => {
    const hero = bokehOptics('hero')
    const lights = bokehOptics('lights')
    for (const depth of BOKEH_LIGHT_DEPTHS) {
      expect(blurRadius(hero, depth)).toBeGreaterThan(0.03)
      expect(blurRadius(lights, depth)).toBeLessThan(0.004)
    }
    expect(blurRadius(hero, BOKEH_HERO_DEPTH)).toBe(0)
    expect(blurRadius(lights, BOKEH_HERO_DEPTH)).toBeGreaterThan(0.02)
  })
})

describe('Tilt-shift, Fisheye, Flare, Motion Blur, Focal Length math', () => {
  it('maps higher screen rows to farther ground', () => {
    const rows = [0.2, 0.45, 0.7].map(tiltGroundZ)
    expect(rows[0]!).toBeGreaterThan(rows[1]!)
    expect(rows[1]!).toBeGreaterThan(rows[2]!)
    expect(tiltGroundZ(0.5)).toBeCloseTo(10 - 9 / (9 / 11), 5)
  })

  it('bends straight lines with an equidistant fisheye that stays inside the source', () => {
    expect(fisheyeSourceUv(0.5, 0.5, 1.6)).toEqual([0.5, 0.5])
    const corner = fisheyeSourceUv(1, 1, 1.6)
    expect(corner[0]).toBeCloseTo(1, 5)
    expect(corner[1]).toBeCloseTo(1, 5)
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      for (const [u, v] of [fisheyeSourceUv(t, 1, 1.6), fisheyeSourceUv(1, t, 1.6)]) {
        expect(Math.max(u, v)).toBeLessThanOrEqual(1 + 1e-9)
        expect(Math.min(u, v)).toBeGreaterThanOrEqual(-1e-9)
      }
    }
    // 화면 위쪽의 수평선 y는 원본에서 한 높이가 아니다(= 휘어 보인다)
    expect(fisheyeSourceUv(0.5, 0.9, 1.6)[1]).not.toBeCloseTo(fisheyeSourceUv(0.95, 0.9, 1.6)[1], 2)
    expect(fisheyeHorizontalFov(1.6)).toBeGreaterThan(110)
  })

  it('moves the sun right to left during the pan and mirrors ghosts across the center', () => {
    const sunAt = (yaw: number) =>
      projectToUv(FLARE_CAMERA.position, flareTarget(yaw), FLARE_CAMERA.fov, 1.6, TIME_PALETTES.sunset.sunPos)!
    const start = sunAt(PAN_START)
    const rest = sunAt(0)
    const end = sunAt(PAN_END)
    expect(start[0]).toBeGreaterThan(rest[0])
    expect(rest[0]).toBeGreaterThan(end[0])
    expect(flareStrength(rest)).toBe(1)
    expect(flareStrength(start)).toBeLessThan(1)
    expect(flareStrength([1.5, 0.5])).toBe(0)
    expect(flareStrength(null)).toBe(0)
    const farGhost = ghostPosition(rest, FLARE_GHOSTS.at(-1)!.t)
    expect(rest[0]).toBeGreaterThan(0.5)
    expect(farGhost[0]).toBeLessThan(0.5)
    expect(ghostPosition(rest, 1)).toEqual([0.5, 0.5])
    expect(projectToUv([0, 0, 0], [0, 0, -1], 42, 1.6, [0, 0, 5])).toBeNull()
    expect(projectToUv([0, 0, 0], [0, 0, -1], 42, 1.6, [0, 0, -5])).toEqual([0.5, 0.5])
  })

  it('steps the train at 12fps and scales blur with shutter angle', () => {
    expect(quantizeFrame(0.083)).toBe(0)
    expect(quantizeFrame(1 / 12)).toBeCloseTo(1 / 12, 10)
    expect(trainX(0.01)).toBe(trainX(0.08))
    expect(trainX(1 / 12) - trainX(0)).toBeCloseTo(8 / 12, 8)
    for (let t = 0; t <= 4; t += 0.05) expect(Math.abs(trainX(t))).toBeLessThanOrEqual(5.5)
    expect(motionBlurLength(0)).toBe(0)
    expect(motionBlurLength(360)).toBeCloseTo(8 / 12, 10)
    expect(motionBlurUv(360, 1.6)).toBeCloseTo(motionBlurUv(180, 1.6) * 2, 10)
  })

  it('keeps the subject size while compressing the background', () => {
    const shots = FOCAL_OPTIONS.map(focalOptics)
    for (const { dist, fov } of shots) expect(dist * Math.tan((fov * Math.PI) / 360)).toBeCloseTo(1.4, 8)
    expect(shots[1]!.backgroundScale).toBeGreaterThan(shots[0]!.backgroundScale)
    expect(shots[2]!.backgroundScale).toBeGreaterThan(shots[1]!.backgroundScale)
  })
})

describe('Lens post options', () => {
  it('leaves the lens path off and creates no depth texture by default', () => {
    const res = createDualComposerResources('split')
    expect(res.uniforms.uLens.value).toBe(0)
    expect(res.targetA.depthTexture).toBeNull()
    expect(DEFAULT_LOOK_POST_EFFECT.gradePreset).toBe(0)
    res.dispose()
  })

  it('writes lens uniforms and attaches depth when asked', () => {
    const res = createDualComposerResources('dissolve', true)
    expect(res.targetA.depthTexture).not.toBeNull()
    setLensUniforms(res.uniforms, { mode: 'flare', sun: [0.7, 0.6], strength: 1, ghosts: FLARE_GHOSTS })
    expect(res.uniforms.uLens.value).toBe(4)
    expect(res.uniforms.uGhosts.value[2]!.toArray()).toEqual([1.35, 0.07, 0.4, 1])
    res.dispose()
  })
})

describe('Lens & Focus demo controls', () => {
  const activeTweens = () => gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())

  it('starts no tween before interaction, and replay only on time-based cards', () => {
    const timed = [RackFocusDemo, LensFlareDemo, MotionBlurDemo]
    const stateOnly = [BokehDemo, TiltShiftDemo, FisheyeLensDemo, DepthOfFieldDemo, FocalLengthDemo]
    for (const Demo of [...timed, ...stateOnly]) {
      render(createElement(Demo))
      expect(activeTweens()).toHaveLength(0)
      expect(screen.queryAllByRole('button', { name: '재생' })).toHaveLength(timed.includes(Demo) ? 1 : 0)
      cleanup()
    }
  })

  it('kills playback tweens on unmount', () => {
    for (const Demo of [RackFocusDemo, LensFlareDemo, MotionBlurDemo]) {
      const { unmount } = render(createElement(Demo))
      fireEvent.click(screen.getByRole('button', { name: '재생' }))
      unmount()
      expect(activeTweens()).toHaveLength(0)
    }
  })

  it('updates the focus plane and status text from the Rack Focus slider', () => {
    const { container } = render(createElement(RackFocusDemo))
    const plane = () => Number(container.querySelector('[data-testid="focus-plane"]')!.getAttribute('data-z'))
    expect(screen.getByTestId('lens-status').textContent).toBe('앞 꽃 선명 · 뒤 주인공 흐림')
    const before = plane()
    fireEvent.change(screen.getByRole('slider', { name: '초점면 위치' }), { target: { value: '100' } })
    expect(screen.getByTestId('lens-status').textContent).toBe('앞 꽃 흐림 · 뒤 주인공 선명')
    expect(plane()).toBeLessThan(before)
  })
})
