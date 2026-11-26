/** Camera · Lens & Focus 데모의 순수 계산. 거리 단위는 m, 렌즈 값은 mm, 화면 좌표는 uv(0..1, y 위). */
import { HERO, NIGHT_LIGHTS, NIGHT_LIGHT_Y, type Vec3 } from '@terms/components/scene/scene-layout'

export const SENSOR_HEIGHT_MM = 24
/** 이 값 이하의 착란원은 선명하게 본다(초점 띠의 기준) */
export const COC_LIMIT_MM = 0.015
/** 화면 높이 대비 흐림 반지름이 이보다 작으면 「선명」으로 표시한다 */
export const SHARP_RADIUS = 0.004

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const radians = (degrees: number) => (degrees * Math.PI) / 180
const degrees = (rad: number) => (rad * 180) / Math.PI

/** 35mm 판형에서 초점거리(mm)의 세로 화각(도). three의 fov와 같다. */
export function verticalFov(focalMm: number) {
  return degrees(2 * Math.atan(SENSOR_HEIGHT_MM / 2 / focalMm))
}

/** 카메라에서 점까지의 시선 방향 거리 */
export function viewDepth(position: Vec3, target: Vec3, point: Vec3) {
  const forward = target.map((v, i) => v - position[i]!)
  const length = Math.hypot(...forward)
  return forward.reduce((sum, v, i) => sum + (v / length) * (point[i]! - position[i]!), 0)
}

// ── 피사계 심도 ──────────────────────────────────────────────

export interface Optics {
  focalMm: number
  fNumber: number
  /** 초점 거리(m) */
  focus: number
  /** 작은 카드에서도 보이도록 흐림을 키우는 배율 */
  gain: number
  /** 흐림 반지름 상한(화면 높이 비율) */
  maxRadius: number
}

/** 얇은 렌즈의 착란원 = cocScaleMm * |d - focus| / d */
function cocScaleMm({ focalMm, fNumber, focus }: Optics) {
  return focalMm ** 2 / (fNumber * (focus * 1000 - focalMm))
}

/** 후처리 shader에 넘기는 값. shader는 clamp(cocScale * |d - focus| / d - cocDead, 0, maxRadius)를 계산한다. */
export function dofUniforms(optics: Optics) {
  const toRadius = optics.gain / SENSOR_HEIGHT_MM
  return {
    focus: optics.focus,
    cocScale: cocScaleMm(optics) * toRadius,
    cocDead: COC_LIMIT_MM * toRadius,
    maxRadius: optics.maxRadius,
  }
}

/** 거리 d에 있는 점의 흐림 반지름(화면 높이 비율) */
export function blurRadius(optics: Optics, distance: number) {
  const { focus, cocScale, cocDead, maxRadius } = dofUniforms(optics)
  return clamp((cocScale * Math.abs(distance - focus)) / distance - cocDead, 0, maxRadius)
}

export function sharpnessLabel(optics: Optics, distance: number) {
  return blurRadius(optics, distance) < SHARP_RADIUS ? '선명' : '흐림'
}

/** 착란원이 COC_LIMIT_MM 이하인 거리 범위(m). 과초점 거리 밖이면 far는 Infinity. */
export function depthOfField(focalMm: number, fNumber: number, focus: number) {
  const s = focus * 1000
  const hyperfocal = focalMm ** 2 / (fNumber * COC_LIMIT_MM) + focalMm
  const near = (s * (hyperfocal - focalMm)) / (hyperfocal + s - 2 * focalMm)
  const far = s < hyperfocal ? (s * (hyperfocal - focalMm)) / (hyperfocal - s) : Number.POSITIVE_INFINITY
  return { near: near / 1000, far: far / 1000 }
}

// ── Rack Focus ───────────────────────────────────────────────

export const RACK_CAMERA: { position: Vec3; target: Vec3; focalMm: number } = {
  position: [0, 1.35, 6.2],
  target: [0, 1.0, 0],
  focalMm: 42,
}
/** 카드 소품인 앞 꽃의 밑동 */
export const FLOWER_POSITION: Vec3 = [0.7, 0, 3.4]
export const FLOWER_HEAD_Y = 1.0
export const RACK_FLOWER_DEPTH = viewDepth(RACK_CAMERA.position, RACK_CAMERA.target, [
  FLOWER_POSITION[0],
  FLOWER_HEAD_Y,
  FLOWER_POSITION[2],
])
export const RACK_HERO_DEPTH = viewDepth(RACK_CAMERA.position, RACK_CAMERA.target, [0, 1.2, HERO.position[2]])

/** t 0 = 앞 꽃, 1 = 뒤 주인공 */
export function rackOptics(t: number): Optics {
  return {
    focalMm: RACK_CAMERA.focalMm,
    fNumber: 1.4,
    focus: lerp(RACK_FLOWER_DEPTH, RACK_HERO_DEPTH, t),
    gain: 4,
    maxRadius: 0.045,
  }
}

// ── Bokeh ────────────────────────────────────────────────────

export type BokehFocus = 'hero' | 'lights'

export const BOKEH_CAMERA: { position: Vec3; target: Vec3; fov: number } = {
  position: [0, 1.5, 7],
  target: [0, 1.5, 0],
  fov: 30,
}
const depthFromBokeh = (point: Vec3) => viewDepth(BOKEH_CAMERA.position, BOKEH_CAMERA.target, point)
export const BOKEH_HERO_DEPTH = depthFromBokeh([0, 1.2, HERO.position[2]])
export const BOKEH_LIGHT_DEPTHS = NIGHT_LIGHTS.map(([x, , z]) => depthFromBokeh([x, NIGHT_LIGHT_Y, z]))

export function bokehOptics(target: BokehFocus): Optics {
  const lights = BOKEH_LIGHT_DEPTHS.reduce((sum, d) => sum + d, 0) / BOKEH_LIGHT_DEPTHS.length
  return {
    focalMm: 85,
    fNumber: 1.4,
    focus: target === 'hero' ? BOKEH_HERO_DEPTH : lights,
    gain: 5,
    maxRadius: 0.07,
  }
}

// ── Depth of Field ───────────────────────────────────────────

export const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16] as const

export const DOF_CAMERA: { position: Vec3; target: Vec3; focalMm: number } = {
  position: [0, 1.65, 9],
  target: [0, 1.0, 0],
  focalMm: 50,
}
const depthFromDof = (point: Vec3) => viewDepth(DOF_CAMERA.position, DOF_CAMERA.target, point)
export const DOF_LAYERS = [
  { name: '전경 울타리', depth: depthFromDof([-1.85, 0.5, 2.3]) },
  { name: '중경 주인공', depth: depthFromDof([0, 1.0, HERO.position[2]]) },
  { name: '원경 나무', depth: depthFromDof([-1.9, 2.0, -7.2]) },
]

export function dofOptics(fNumber: number): Optics {
  return { focalMm: DOF_CAMERA.focalMm, fNumber, focus: DOF_LAYERS[1]!.depth, gain: 14, maxRadius: 0.045 }
}

// ── Tilt-shift ───────────────────────────────────────────────

export const TILT_CAMERA: { position: Vec3; target: Vec3; fov: number } = {
  position: [0, 9, 10],
  target: [0, 0, -1],
  fov: 38,
}
/** 선명한 띠의 절반 폭(화면 높이 비율) */
export const TILT_BAND_HALF = 0.1
export const TILT_MAX_RADIUS = 0.035

/** 화면 높이 v(0 아래 ~ 1 위)의 가운데 열이 지면에 닿는 z. 지평선 위면 -Infinity. */
export function tiltGroundZ(v: number) {
  const [, cy, cz] = TILT_CAMERA.position
  const [, ty, tz] = TILT_CAMERA.target
  const pitch = Math.atan2(cy - ty, cz - tz)
  const below = pitch - Math.atan((2 * v - 1) * Math.tan(radians(TILT_CAMERA.fov) / 2))
  return below <= 0 ? Number.NEGATIVE_INFINITY : cz - cy / Math.tan(below)
}

// ── Fisheye ──────────────────────────────────────────────────

export const NORMAL_LENS_FOV = 42
/** 어안 왜곡의 원본으로 렌더하는 직선 원근 화면의 세로 화각 */
export const FISHEYE_SOURCE_FOV = 120

/** 어안 화면의 가로 화각(도). 등거리 투영으로 화면 모서리가 원본 모서리에 닿는다. */
export function fisheyeHorizontalFov(aspect: number) {
  const diagonal = Math.hypot(aspect, 1)
  const cornerAngle = Math.atan(Math.tan(radians(FISHEYE_SOURCE_FOV) / 2) * diagonal)
  return degrees(2 * (aspect / diagonal) * cornerAngle)
}

/** 어안 화면의 uv가 가져오는 원본 uv. shader의 fisheye 분기와 같은 식이다. */
export function fisheyeSourceUv(u: number, v: number, aspect: number): [number, number] {
  const tanHalf = Math.tan(radians(FISHEYE_SOURCE_FOV) / 2)
  const px = (u - 0.5) * 2 * aspect
  const py = (v - 0.5) * 2
  const length = Math.hypot(px, py)
  if (length < 1e-6) return [0.5, 0.5]
  const diagonal = Math.hypot(aspect, 1)
  const tan = Math.tan((length / diagonal) * Math.atan(tanHalf * diagonal))
  return [((px / length) * tan) / (tanHalf * aspect) / 2 + 0.5, ((py / length) * tan) / tanHalf / 2 + 0.5]
}

// ── Lens Flare ───────────────────────────────────────────────

export const FLARE_CAMERA: { position: Vec3; fov: number } = { position: [0, 1.65, 5.8], fov: 42 }
export const PAN_START = -22
export const PAN_END = 48
export const PAN_MIN = -30
export const PAN_MAX = 55
/** t = 해(0)에서 화면 중심(1)을 지나는 축 위의 위치 */
export const FLARE_GHOSTS: { t: number; radius: number; alpha: number; ring: boolean }[] = [
  { t: 0.45, radius: 0.035, alpha: 0.35, ring: false },
  { t: 0.8, radius: 0.018, alpha: 0.45, ring: false },
  { t: 1.35, radius: 0.07, alpha: 0.4, ring: true },
  { t: 1.65, radius: 0.04, alpha: 0.3, ring: false },
  { t: 2.05, radius: 0.12, alpha: 0.32, ring: true },
]

export const panYawAt = (progress: number) => lerp(PAN_START, PAN_END, progress)

/** yaw(도, +가 오른쪽)만큼 Pan한 카메라의 시선점 */
export function flareTarget(yaw: number): Vec3 {
  const [x, , z] = FLARE_CAMERA.position
  return [x + Math.sin(radians(yaw)) * 6, 0.9, z - Math.cos(radians(yaw)) * 6]
}

/** 월드 점의 화면 uv. 카메라 뒤면 null. */
export function projectToUv(
  position: Vec3,
  target: Vec3,
  fov: number,
  aspect: number,
  point: Vec3,
): [number, number] | null {
  const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const unit = (a: Vec3): Vec3 => {
    const n = Math.hypot(...a)
    return [a[0] / n, a[1] / n, a[2] / n]
  }
  const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const forward = unit(sub(target, position))
  const right = unit([-forward[2], 0, forward[0]])
  const up: Vec3 = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ]
  const rel = sub(point, position)
  const depth = dot(rel, forward)
  if (depth <= 0) return null
  const tanHalf = Math.tan(radians(fov) / 2)
  return [dot(rel, right) / (depth * tanHalf * aspect) / 2 + 0.5, dot(rel, up) / (depth * tanHalf) / 2 + 0.5]
}

/** 해가 화면 밖으로 나갈수록 1 → 0 */
export function flareStrength(sun: [number, number] | null) {
  if (!sun) return 0
  const outside = sun.map((v) => Math.max(0, -v, v - 1))
  return clamp(1 - Math.hypot(...outside) / 0.2, 0, 1)
}

export function ghostPosition(sun: [number, number], t: number): [number, number] {
  return [sun[0] + (0.5 - sun[0]) * t, sun[1] + (0.5 - sun[1]) * t]
}

// ── Motion Blur ──────────────────────────────────────────────

export const MOTION_FPS = 12
export const TRAIN_SPEED = 8
export const MOTION_DURATION = 4
export const TRAIN_Z = 3
const TRAIN_WRAP = 5.5
const TRAIN_START = -1.5
export const MOTION_CAMERA: { position: Vec3; target: Vec3; fov: number } = {
  position: [0, 1.2, 9],
  target: [0, 0.9, 0],
  fov: 42,
}

/** 초를 12fps의 프레임 시각으로 내린다 */
export const quantizeFrame = (time: number) => Math.floor(time * MOTION_FPS + 1e-6) / MOTION_FPS

export function trainX(time: number) {
  const span = TRAIN_WRAP * 2
  const raw = TRAIN_START + TRAIN_SPEED * quantizeFrame(time) + TRAIN_WRAP
  return (((raw % span) + span) % span) - TRAIN_WRAP
}

/** 셔터가 열려 있는 동안 기차가 간 거리(m) */
export const motionBlurLength = (shutterAngle: number) => (TRAIN_SPEED / MOTION_FPS) * (shutterAngle / 360)

/** 위 길이를 화면 너비 비율로 바꾼다 */
export function motionBlurUv(shutterAngle: number, aspect: number) {
  const distance = viewDepth(MOTION_CAMERA.position, MOTION_CAMERA.target, [0, 0.7, TRAIN_Z])
  const width = 2 * distance * Math.tan(radians(MOTION_CAMERA.fov) / 2) * aspect
  return motionBlurLength(shutterAngle) / width
}

// ── Focal Length ─────────────────────────────────────────────

export const FOCAL_OPTIONS = [24, 50, 135] as const
export type FocalLength = (typeof FOCAL_OPTIONS)[number]
export const FOCAL_CAMERA_Y = 1.0
/** 인물 거리에서 화면 세로 절반이 담는 높이(m). 모든 초점거리에서 같다. */
export const FOCAL_HALF_FRAME = 1.4
export const FOCAL_REFERENCE_TREE_Z = -7.2

export function focalOptics(focalMm: number) {
  const dist = (FOCAL_HALF_FRAME * focalMm) / (SENSOR_HEIGHT_MM / 2)
  return {
    dist,
    fov: verticalFov(focalMm),
    /** 같은 크기의 물체가 인물 자리에 있을 때와 비교한 원경 나무의 화면 크기 */
    backgroundScale: dist / (dist - FOCAL_REFERENCE_TREE_Z),
  }
}
