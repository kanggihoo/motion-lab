import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import gsap from 'gsap'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SceneDiagram } from '@terms/components/diagram/SceneDiagram'
import { DEFAULT_CAMERA, FENCE, HERO, OTHER, SWING, TREES } from '@terms/components/scene/scene-layout'
import { CameraStage } from '@terms/components/stages/CameraStage'
import { useCameraPlayback } from '@terms/hooks/use-camera-playback'
import {
  DEFAULT_BOUNDS,
  DIAGRAM_SIZE,
  createProjection,
  footprintCorners,
  fovFan,
  headingOf,
  horizontalFov,
  toPlane,
} from '@terms/lib/diagram-math'

afterEach(cleanup)

describe('scene layout constants', () => {
  it('keeps the shared scene world coordinates', () => {
    expect(HERO.position).toEqual([0, 0, 0])
    expect(OTHER.position).toEqual([-1.55, 0, -0.45])
    expect(FENCE.position).toEqual([-1.85, 0, 2.3])
    expect(SWING.position).toEqual([2.05, 0, 1.85])
    expect(TREES.map((tree) => tree.position)).toEqual([
      [-4.2, 0, -5.2],
      [-1.9, 0, -7.2],
      [2.6, 0, -6.2],
      [5.2, 0, -8.5],
    ])
    expect(DEFAULT_CAMERA).toEqual({ position: [0.1, 1.65, 5.8], lookAt: [0, 1.0, 0], fov: 42 })
  })
})

describe('diagram math', () => {
  it('maps world axes to each view', () => {
    expect(toPlane('top', [1, 2, 3])).toEqual([1, 3])
    expect(toPlane('side', [1, 2, 3])).toEqual([3, -2])
  })

  it('projects with the same scale on both axes and keeps bounds inside the viewBox', () => {
    for (const view of ['top', 'side'] as const) {
      const bounds = DEFAULT_BOUNDS[view]
      const size = DIAGRAM_SIZE[view]
      const { point, scale } = createProjection(view, bounds, size)
      const origin = point([0, 0, 0])
      const unit = view === 'top' ? point([1, 0, 1]) : point([0, 1, 1])
      expect(Math.abs(unit[0] - origin[0])).toBeCloseTo(scale)
      expect(Math.abs(unit[1] - origin[1])).toBeCloseTo(scale)
      for (const x of bounds.x) {
        for (const y of bounds.y) {
          for (const z of bounds.z) {
            const [h, v] = point([x, y, z])
            expect(h).toBeGreaterThanOrEqual(-1e-6)
            expect(h).toBeLessThanOrEqual(size.width + 1e-6)
            expect(v).toBeGreaterThanOrEqual(-1e-6)
            expect(v).toBeLessThanOrEqual(size.height + 1e-6)
          }
        }
      }
    }
  })

  it('converts vertical fov to horizontal fov', () => {
    expect(horizontalFov(50, 1)).toBeCloseTo(50)
    expect(horizontalFov(90, 2)).toBeCloseTo((2 * Math.atan(2) * 180) / Math.PI)
  })

  it('builds a fov fan around the viewing direction', () => {
    const base = { position: [0, 1, 5], target: [0, 1, 0], fov: 60, aspect: 1, range: 10, segments: 2 } as const
    for (const view of ['top', 'side'] as const) {
      const [apex, first, middle, last] = fovFan({ ...base, view, position: [0, 1, 5], target: [0, 1, 0] })
      expect(apex).toEqual(view === 'top' ? [0, 5] : [5, -1])
      for (const edge of [first!, middle!, last!]) {
        expect(Math.hypot(edge[0] - apex![0], edge[1] - apex![1])).toBeCloseTo(10)
      }
      const angle = Math.acos(
        ((first![0] - apex![0]) * (last![0] - apex![0]) + (first![1] - apex![1]) * (last![1] - apex![1])) / 100,
      )
      expect((angle * 180) / Math.PI).toBeCloseTo(60)
    }
  })

  it('has no top-view fan when looking straight down, but keeps the side-view one', () => {
    const camera = { position: [0, 8, 0], target: [0, 0, 0], fov: 40, aspect: 1.6, range: 10 } as const
    const position: [number, number, number] = [...camera.position]
    const target: [number, number, number] = [...camera.target]
    expect(headingOf('top', position, target)).toBeNull()
    expect(fovFan({ ...camera, view: 'top', position, target })).toEqual([])
    expect(headingOf('side', position, target)).toBeCloseTo(Math.PI / 2)
  })

  it('rotates footprints in the same direction as three rotation.y', () => {
    // yaw 90°: 로컬 +x는 월드 -z, 로컬 +z는 월드 +x
    const corners = footprintCorners([1, 0, 1], 2, 4, Math.PI / 2)
    const expected = [
      [-1, 2],
      [-1, 0],
      [3, 0],
      [3, 2],
    ]
    corners.forEach(([x, , z], index) => {
      expect(x).toBeCloseTo(expected[index]![0]!)
      expect(z).toBeCloseTo(expected[index]![1]!)
    })
  })
})

describe('SceneDiagram and CameraStage', () => {
  it('draws scene objects, hides requested ones and draws a fan only for cameras with fov', () => {
    const { container } = render(
      <SceneDiagram
        view="side"
        label="측면 도식"
        hide={['trees']}
        otherPosition={null}
        cameras={[
          { position: [0, 1.6, 6], target: [0, 1, 0], fov: 42 },
          { position: [0, 4, 6], target: [0, 1, 0] },
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: '측면 도식' }).getAttribute('data-view')).toBe('side')
    expect(container.querySelector('[data-object="hero"]')).not.toBeNull()
    expect(container.querySelector('[data-object="trees"]')).toBeNull()
    expect(container.querySelector('[data-object="other"]')).toBeNull()
    expect(container.querySelectorAll('[data-object="camera"]')).toHaveLength(2)
    expect(screen.getAllByTestId('fov-fan')).toHaveLength(1)
  })

  it('labels the diagram panel 평면도 by default and 측면도 on request', () => {
    const { rerender } = render(<CameraStage diagram={null} cameraView={null} />)
    expect(screen.queryByText('평면도')).not.toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    rerender(<CameraStage diagramView="side" diagram={null} cameraView={null} />)
    expect(screen.queryByText('측면도')).not.toBeNull()
    expect(screen.queryByText('평면도')).toBeNull()
  })
})

describe('useCameraPlayback', () => {
  const activeTweens = () => gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())

  it('stays idle until replay, then leaves no tween after reset or unmount', () => {
    const onTick = vi.fn()
    const { result, unmount } = renderHook(() => useCameraPlayback({ duration: 2, onTick }))
    expect(activeTweens()).toHaveLength(0)
    expect(onTick).not.toHaveBeenCalled()
    expect(result.current.stageProps.replayLabel).toBe('재생')

    act(() => result.current.stageProps.onReplay())
    expect(result.current.playing).toBe(true)
    expect(result.current.stageProps.replayLabel).toBe('다시 재생')
    expect(gsap.globalTimeline.getChildren(true, true, true)).not.toHaveLength(0)

    act(() => result.current.reset())
    expect(result.current.playing).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(activeTweens()).toHaveLength(0)

    act(() => result.current.stageProps.onReplay())
    unmount()
    expect(activeTweens()).toHaveLength(0)
  })
})
