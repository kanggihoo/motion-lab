import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { TIME_PALETTES } from '@terms/components/scene/scene-colors'
import section from '@terms/data/edit'
import * as demos from '@terms/demos/edit-time'
import {
  BULLET_CAMERAS,
  BULLET_ORBIT,
  BULLET_PLAY_DURATION,
  BULLET_RISE,
  FREEZE_HOLD,
  FREEZE_PLAY_DURATION,
  HYPERLAPSE_END_Z,
  HYPERLAPSE_PLAY_DURATION,
  HYPERLAPSE_START_Z,
  JUMP_APEX,
  JUMP_END,
  JUMP_HEIGHT,
  JUMP_START,
  RAMP_PLAY_DURATION,
  RUN_DURATION,
  TIMELAPSE_PLAY_DURATION,
  blockHopAt,
  bulletTimeAt,
  freezeFrameAt,
  hyperlapseAt,
  mixPalette,
  quantizeTime,
  rampPlayTimeAt,
  rampSceneTimeAt,
  rampSpeedAt,
  runJumpPose,
  timelapseAt,
} from '@terms/lib/edit-time-math'

afterEach(() => {
  cleanup()
})

describe('Edit · Time data', () => {
  it('registers the 6 Time cards with matching demos', async () => {
    const time = section.categories.find((c) => c.id === 'time')!
    const ids = ['time-lapse', 'speed-ramp', 'freeze-frame', 'hyperlapse', 'bullet-time', 'stop-motion']
    expect(time.terms.map((t) => t.id)).toEqual(ids)
    expect(Object.keys(await time.loadDemos())).toEqual(ids)
  })
})

describe('Edit · Time math', () => {
  it('peaks the run-and-jump pose at the apex and lands afterwards', () => {
    expect(runJumpPose(JUMP_APEX).y).toBeCloseTo(JUMP_HEIGHT, 5)
    expect(runJumpPose(JUMP_START).y).toBe(0)
    expect(runJumpPose(JUMP_END).y).toBeCloseTo(0, 5)
    expect(runJumpPose(RUN_DURATION).x).toBeGreaterThan(runJumpPose(0).x)
  })

  it('ramps speed 2x -> 0.25x -> 2x and maps play time monotonically', () => {
    expect(rampSpeedAt(0)).toBe(2)
    expect(rampSpeedAt(JUMP_APEX)).toBe(0.25)
    expect(rampSpeedAt(JUMP_END)).toBeCloseTo(0.25, 5)
    expect(rampSpeedAt(RUN_DURATION)).toBe(2)
    expect(rampSceneTimeAt(0)).toBe(0)
    expect(rampSceneTimeAt(RAMP_PLAY_DURATION)).toBe(RUN_DURATION)
    for (const s of [0.2, 0.8, JUMP_APEX, 2.4, 3]) {
      expect(rampSceneTimeAt(rampPlayTimeAt(s))).toBeCloseTo(s, 3)
    }
    // 느린 점프 구간(1초 분량)은 재생에 약 4초가 걸린다.
    expect(rampPlayTimeAt(JUMP_END) - rampPlayTimeAt(JUMP_START)).toBeCloseTo(4, 1)
  })

  it('holds the apex frame for the freeze duration and then resumes', () => {
    expect(freezeFrameAt(0)).toEqual({ sceneTime: 0, frozen: false })
    expect(freezeFrameAt(JUMP_APEX)).toEqual({ sceneTime: JUMP_APEX, frozen: true })
    expect(freezeFrameAt(JUMP_APEX + FREEZE_HOLD - 0.01).sceneTime).toBe(JUMP_APEX)
    expect(freezeFrameAt(JUMP_APEX + FREEZE_HOLD).frozen).toBe(false)
    expect(freezeFrameAt(FREEZE_PLAY_DURATION).sceneTime).toBeCloseTo(RUN_DURATION, 5)
  })

  it('compresses 12:00-24:00 into interval frames', () => {
    expect(timelapseAt(0)).toMatchObject({ frame: 0, clock: '12:00' })
    expect(timelapseAt(TIMELAPSE_PLAY_DURATION / 2)).toMatchObject({ frame: 72, clock: '18:00' })
    expect(timelapseAt(TIMELAPSE_PLAY_DURATION)).toMatchObject({ frame: 144, clock: '24:00' })
  })

  it('interpolates palettes between times of day', () => {
    expect(mixPalette(TIME_PALETTES.day, TIME_PALETTES.night, 0)).toEqual(TIME_PALETTES.day)
    expect(mixPalette(TIME_PALETTES.day, TIME_PALETTES.night, 2)).toEqual(TIME_PALETTES.night)
    const mid = mixPalette(TIME_PALETTES.day, TIME_PALETTES.night, 0.5)
    expect(mid.sky).toMatch(/^#[0-9a-f]{6}$/)
    expect(mid.ambientIntensity).toBeCloseTo(0.41, 5)
  })

  it('moves the camera only in Hyperlapse mode', () => {
    expect(hyperlapseAt(HYPERLAPSE_PLAY_DURATION, 'hyperlapse').cameraZ).toBeCloseTo(HYPERLAPSE_END_Z, 5)
    expect(hyperlapseAt(HYPERLAPSE_PLAY_DURATION, 'timelapse').cameraZ).toBe(HYPERLAPSE_START_Z)
    expect(hyperlapseAt(HYPERLAPSE_PLAY_DURATION, 'timelapse').progress).toBe(1)
  })

  it('freezes the pose while the Bullet Time camera orbits once', () => {
    const start = bulletTimeAt(BULLET_RISE)
    const middle = bulletTimeAt(BULLET_RISE + BULLET_ORBIT / 2)
    expect(start.activeCamera).toBe(0)
    expect(middle.activeCamera).toBe(BULLET_CAMERAS / 2)
    expect(middle.angle).toBeCloseTo(Math.PI, 5)
    expect(middle.pose).toEqual(start.pose)
    expect(bulletTimeAt(0)).toMatchObject({ phase: 'rise', angle: 0, activeCamera: null })
    expect(bulletTimeAt(BULLET_PLAY_DURATION).pose.y).toBe(0)
  })

  it('steps Stop Motion time at 12fps and lines the blocks up', () => {
    expect(quantizeTime(0.08, 12)).toBe(0)
    expect(quantizeTime(1 / 12, 12)).toBeCloseTo(1 / 12, 6)
    expect(quantizeTime(0.99, 12)).toBeCloseTo(11 / 12, 6)
    expect(blockHopAt(0, 1).visible).toBe(false)
    expect(blockHopAt(2.5, 2)).toMatchObject({ visible: true, offsetX: 0, y: 0 })
  })
})

describe('Edit · Time GSAP cleanup', () => {
  const activeTweens = () => gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())

  it.each(Object.entries(demos))('%s starts idle and leaves no tween after unmount', (_, Demo) => {
    const { unmount } = render(createElement(Demo))
    expect(gsap.globalTimeline.getChildren(true, true, true)).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: '재생' }))
    expect(gsap.globalTimeline.getChildren(true, true, true).length).toBeGreaterThan(0)
    unmount()
    expect(activeTweens()).toHaveLength(0)
  })
})
