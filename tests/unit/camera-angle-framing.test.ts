import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { HERO, OTHER, SWING, type Vec3 } from '@terms/components/scene/scene-layout'
import { sections } from '@terms/data'
import {
  ANGLE_LEVELS,
  BIRD_SHOTS,
  CAFE,
  DUTCH_SHOT,
  ESTABLISHING_SHOTS,
  FACE_PLANE_Z,
  POV_HERO_YAW,
  POV_SHOTS,
  SHOT_SIZES,
  innerFrames,
  otsCamera,
  pitchDegrees,
  shotSizeCamera,
  swingPoint,
  type Shot,
} from '@terms/lib/camera-angle-framing-math'

const IDS = [
  'high-low-angle',
  'birds-eye-view',
  'dutch-angle',
  'shot-size',
  'pov-shot',
  'over-the-shoulder',
  'establishing-shot',
]

/** 월드 점이 화면에 맺히는 위치. 화면 안이면 x·y가 -1..1이다. */
function project(shot: Shot, world: Vec3, aspect = 1.6, rollDegrees = 0) {
  const camera = new THREE.PerspectiveCamera(shot.fov, aspect, 0.1, 100)
  camera.position.set(...shot.position)
  camera.lookAt(...shot.target)
  camera.rotateZ((rollDegrees * Math.PI) / 180)
  camera.updateMatrixWorld()
  return new THREE.Vector3(...world).project(camera)
}

describe('Camera · Angle & Framing data', () => {
  const camera = sections.find((section) => section.id === 'camera')!
  const category = camera.categories.find((item) => item.id === 'angle-framing')!

  it('registers the 7 cards after Movement with filmmaking and implementation notes', async () => {
    expect(camera.categories.map((item) => item.id).slice(0, 2)).toEqual(['movement', 'angle-framing'])
    expect(category.terms.map((term) => term.id)).toEqual(IDS)
    const demos = await category.loadDemos()
    expect(Object.keys(demos)).toEqual(IDS)
    for (const term of category.terms) {
      expect(term.filmmaking?.length).toBeGreaterThan(0)
      expect(term.implementation).not.toContain('SVG 레이어')
      expect(term.request).not.toContain('"')
    }
  })

  it('keeps the aliases from the relation lines searchable', () => {
    const aliases = Object.fromEntries(category.terms.map((term) => [term.id, term.aliases]))
    expect(aliases['birds-eye-view']).toEqual(['Overhead Shot', 'Top-down', 'Top Shot'])
    expect(aliases['dutch-angle']).toEqual(['Dutch Tilt', 'Canted Angle'])
    expect(aliases['over-the-shoulder']).toEqual(['OTS'])
    expect(aliases['pov-shot']).toEqual(['First-person Shot'])
  })
})

describe('Camera · Angle & Framing math', () => {
  it('looks up from low, level at eye height and down from high', () => {
    const [low, eye, high] = ANGLE_LEVELS
    expect(low!.position[1]).toBeLessThan(HERO.headY)
    expect(eye!.position[1]).toBe(HERO.headY)
    expect(high!.position[1]).toBeGreaterThan(HERO.height)
    expect(pitchDegrees(low!)).toBeGreaterThan(10)
    expect(pitchDegrees(eye!)).toBe(0)
    expect(pitchDegrees(high!)).toBeLessThan(-30)
    for (const level of ANGLE_LEVELS) {
      expect(Math.abs(project(level, [0, HERO.headY, 0]).y)).toBeLessThan(1)
    }
  })

  it('looks straight down for the bird view with world -z at the top of the screen', () => {
    expect(-pitchDegrees(BIRD_SHOTS.bird)).toBeCloseTo(90, 1)
    expect(-pitchDegrees(BIRD_SHOTS.high)).toBeLessThan(45)
    expect(project(BIRD_SHOTS.bird, [0, 0, -4]).y).toBeGreaterThan(project(BIRD_SHOTS.bird, [0, 0, 0]).y)
    for (const point of [HERO.position, OTHER.position, SWING.position]) {
      const { x, y } = project(BIRD_SHOTS.bird, point)
      expect(Math.max(Math.abs(x), Math.abs(y))).toBeLessThan(1)
    }
  })

  it('keeps the Dutch horizon at screen center when level and tilts it clockwise with roll', () => {
    const far: Vec3 = [
      DUTCH_SHOT.target[0] + (DUTCH_SHOT.target[0] - DUTCH_SHOT.position[0]),
      DUTCH_SHOT.position[1],
      DUTCH_SHOT.target[2] + (DUTCH_SHOT.target[2] - DUTCH_SHOT.position[2]),
    ]
    expect(pitchDegrees(DUTCH_SHOT)).toBe(0)
    expect(project(DUTCH_SHOT, far).y).toBeCloseTo(0)
    // 화면 오른쪽의 지평선 점이 내려가면 CSS rotate(+)와 같은 방향이다
    const right: Vec3 = [far[0] + Math.cos(SWING.yaw) * 2, far[1], far[2] - Math.sin(SWING.yaw) * 2]
    expect(project(DUTCH_SHOT, right).x).toBeGreaterThan(0)
    expect(project(DUTCH_SHOT, right, 1.6, 15).y).toBeLessThan(0)
  })

  it('narrows the framed height step by step on the face plane', () => {
    for (const spec of SHOT_SIZES) {
      const shot = shotSizeCamera(spec.id)
      expect(project(shot, [0, spec.centerY + spec.height / 2, FACE_PLANE_Z]).y).toBeCloseTo(1)
      expect(project(shot, [0, spec.centerY - spec.height / 2, FACE_PLANE_Z]).y).toBeCloseTo(-1)
    }
    const full = SHOT_SIZES[0]!
    expect(full.centerY - full.height / 2).toBeLessThan(0)
    expect(full.centerY + full.height / 2).toBeGreaterThan(HERO.height)
    // 두 눈(x ±0.08, 반지름 0.03)은 ECU 화면 안에 있다
    expect(Math.abs(project(shotSizeCamera('extreme'), [0.11, 1.56, FACE_PLANE_Z]).x)).toBeLessThan(1)
  })

  it('places boundary boxes of tighter shots inside the current frame', () => {
    expect(innerFrames('full').map((frame) => frame.id)).toEqual(['medium', 'close', 'extreme'])
    expect(innerFrames('extreme')).toEqual([])
    for (const spec of SHOT_SIZES) {
      for (const frame of innerFrames(spec.id)) {
        expect(frame.top).toBeGreaterThanOrEqual(0)
        expect(frame.top + frame.size).toBeLessThanOrEqual(100)
        const inner = SHOT_SIZES.find((item) => item.id === frame.id)!
        const ndcTop = project(shotSizeCamera(spec.id), [0, inner.centerY + inner.height / 2, FACE_PLANE_Z]).y
        expect(frame.top).toBeCloseTo(((1 - ndcTop) / 2) * 100)
      }
    }
  })

  it('seats the POV character facing away from the default camera and keeps hands in view', () => {
    expect(swingPoint([0, 0, 1])[2]).toBeLessThan(SWING.position[2])
    expect(Math.cos(POV_HERO_YAW)).toBeLessThan(0)
    for (const side of [-0.22, 0.22]) {
      const { x, y } = project(POV_SHOTS.pov, swingPoint([side, 1.12, 0]), 0.8)
      expect(Math.max(Math.abs(x), Math.abs(y))).toBeLessThan(1)
    }
  })

  it('puts the near shoulder at the frame edge on opposite sides without crossing the axis', () => {
    const sideOfAxis = ([x, , z]: Vec3) =>
      Math.sign((OTHER.position[0] - HERO.position[0]) * z - (OTHER.position[2] - HERO.position[2]) * x)
    expect(sideOfAxis(otsCamera('a').position)).toBe(sideOfAxis(otsCamera('b').position))

    for (const [view, near, far, edge] of [
      ['a', HERO, OTHER, 1],
      ['b', OTHER, HERO, -1],
    ] as const) {
      const shot = otsCamera(view)
      const shoulder = project(shot, [near.position[0], near.headY, near.position[2]])
      expect(shoulder.x * edge).toBeGreaterThan(0.4)
      expect(shoulder.x * edge).toBeLessThan(1)
      expect(Math.abs(project(shot, [far.position[0], far.headY, far.position[2]]).x)).toBeLessThan(0.1)
    }
  })

  it('shows the whole cafe in the establishing cut and none of it in the medium cut', () => {
    const corners = [-0.5, 0.5].flatMap((side) =>
      [0, CAFE.height].map((y): Vec3 => [
        CAFE.position[0] + side * CAFE.width,
        y,
        CAFE.position[2] + CAFE.depth / 2,
      ]),
    )
    for (const corner of corners) {
      const { x, y } = project(ESTABLISHING_SHOTS.wide, corner, 0.8)
      expect(Math.max(Math.abs(x), Math.abs(y))).toBeLessThan(1)
    }
    // 앞면과 차양 끝의 격자점이 (전체 화면 컷에서도) 하나도 들어오지 않는다
    for (const z of [CAFE.depth / 2, CAFE.depth / 2 + CAFE.awning]) {
      for (let i = 0; i <= 20; i++) {
        for (let j = 0; j <= 10; j++) {
          const point: Vec3 = [
            CAFE.position[0] + (i / 20 - 0.5) * (CAFE.width + 0.3),
            (j / 10) * (CAFE.height + 0.2),
            CAFE.position[2] + z,
          ]
          const { x, y, z: depth } = project(ESTABLISHING_SHOTS.medium, point)
          expect(Math.abs(x) > 1 || Math.abs(y) > 1 || depth > 1).toBe(true)
        }
      }
    }
  })
})
