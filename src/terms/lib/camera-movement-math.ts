/**
 * Camera · Movement 데모의 순수 계산. 좌표는 공유 3D 장면의 월드 좌표(m),
 * progress는 0 → 1, 시간은 초다. DOM·three에 의존하지 않는다.
 */
import { CAMERA_ASPECT, HERO, SWING, TREES, type Vec3 } from '@terms/components/scene/scene-layout'

export interface CameraPose {
  position: Vec3
  target: Vec3
  /** 세로 화각(도) */
  fov: number
}

const BASE_FOV = 42
const RAD = Math.PI / 180

/** p가 0·1일 때 양 끝 값과 정확히 같다. */
function lerp(from: number, to: number, p: number) {
  return from * (1 - p) + to * p
}

function lerp3(from: Vec3, to: Vec3, p: number): Vec3 {
  return [lerp(from[0], to[0], p), lerp(from[1], to[1], p), lerp(from[2], to[2], p)]
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

/** 수직 화각 fov인 카메라가 distance 앞에서 담는 세로 절반 길이 */
export function halfHeightAt(distance: number, fov: number) {
  return distance * Math.tan((fov * RAD) / 2)
}

// ── Dolly In / Out ───────────────────────────────────────────────

export type DollyMove = 'in' | 'out'

export const DOLLY_FAR_Z = 8
export const DOLLY_NEAR_Z = 3.6
const DOLLY_Y = 1.35
const DOLLY_TARGET: Vec3 = [0, 1.05, 0]
/** 가까운 끝에서 Dolly와 같은 크기로 주인공이 담기는 Zoom 화각 */
export const ZOOM_NARROW_FOV = (2 * Math.atan(halfHeightAt(DOLLY_NEAR_Z, BASE_FOV) / DOLLY_FAR_Z)) / RAD

export function dollyCompareAt(progress: number, move: DollyMove): { dolly: CameraPose; zoom: CameraPose } {
  // near: 0 = 먼 끝, 1 = 가까운 끝
  const near = move === 'in' ? progress : 1 - progress
  const z = lerp(DOLLY_FAR_Z, DOLLY_NEAR_Z, near)
  // 두 화면의 주인공 크기가 매 순간 같도록 담는 높이를 맞춘다.
  const zoomFov = (2 * Math.atan(halfHeightAt(z, BASE_FOV) / DOLLY_FAR_Z)) / RAD
  return {
    dolly: { position: [0, DOLLY_Y, z], target: DOLLY_TARGET, fov: BASE_FOV },
    zoom: { position: [0, DOLLY_Y, DOLLY_FAR_Z], target: DOLLY_TARGET, fov: zoomFov },
  }
}

// ── Pan / Tilt ───────────────────────────────────────────────────

export type PanTiltMode = 'pan' | 'tilt'

export const TRIPOD_POSITION: Vec3 = [0, 1.7, 7]
export const PAN_RANGE: [number, number] = [-35, 35]
export const TILT_RANGE: [number, number] = [-4, 22]
const LOOK_DISTANCE = 10

export function panTiltAt(progress: number, mode: PanTiltMode): CameraPose & { angle: number } {
  const range = mode === 'pan' ? PAN_RANGE : TILT_RANGE
  const angle = lerp(range[0], range[1], progress)
  const yaw = mode === 'pan' ? angle * RAD : 0
  const pitch = (mode === 'tilt' ? angle : TILT_RANGE[0]) * RAD
  const [x, y, z] = TRIPOD_POSITION
  return {
    position: TRIPOD_POSITION,
    target: [
      x + Math.sin(yaw) * LOOK_DISTANCE,
      y + Math.tan(pitch) * LOOK_DISTANCE,
      z - Math.cos(yaw) * LOOK_DISTANCE,
    ],
    fov: BASE_FOV,
    angle,
  }
}

// ── Tracking Shot ────────────────────────────────────────────────

export const TRACK_X: [number, number] = [-2, 2]
const TRACK_HERO_Z = 3.2
const TRACK_CAMERA_Z = 8
const TRACK_STEPS = 4
/** 전경 가로등 소품의 밑동 */
export const TRACK_LAMP: Vec3 = [-0.9, 0, 5.4]
/** 속도 비교의 원경 기준 나무 */
export const TRACK_FAR_TREE: Vec3 = TREES[2]!.position

/** x만큼 옆으로 이동할 때, 깊이 depthZ의 정지 물체가 화면에서 흐르는 거리(화면 폭 %) */
export function screenShiftPercent(travel: number, depthZ: number) {
  const depth = TRACK_CAMERA_Z - depthZ
  const width = 2 * halfHeightAt(depth, BASE_FOV) * CAMERA_ASPECT
  return (travel / width) * 100
}

export function trackingAt(progress: number) {
  const x = lerp(TRACK_X[0], TRACK_X[1], progress)
  const travel = x - TRACK_X[0]
  return {
    camera: { position: [x, 1.7, TRACK_CAMERA_Z], target: [x, 1.1, TRACK_HERO_Z], fov: BASE_FOV } as CameraPose,
    heroPosition: [x, 0, TRACK_HERO_Z] as Vec3,
    stride: 0.45 * Math.sin(progress * Math.PI * 2 * TRACK_STEPS),
    nearShift: screenShiftPercent(travel, TRACK_LAMP[2]),
    farShift: screenShiftPercent(travel, TRACK_FAR_TREE[2]),
  }
}

// ── Crane Shot ───────────────────────────────────────────────────

export type CraneMove = 'up' | 'down'

export const CRANE_LOW: CameraPose = { position: [0, 1.4, 5], target: [0, 1.1, 0], fov: BASE_FOV }
export const CRANE_HIGH: CameraPose = { position: [0, 6.5, 11], target: [0, 0.8, -3], fov: BASE_FOV }
/** 크레인 받침대 위치. 암은 받침대 꼭대기에서 카메라까지다. */
export const CRANE_PIVOT: Vec3 = [0, 1.2, 13]

export function craneAt(progress: number, move: CraneMove): CameraPose {
  const rise = move === 'up' ? progress : 1 - progress
  return {
    position: lerp3(CRANE_LOW.position, CRANE_HIGH.position, rise),
    target: lerp3(CRANE_LOW.target, CRANE_HIGH.target, rise),
    fov: BASE_FOV,
  }
}

// ── Arc Shot ─────────────────────────────────────────────────────

export type ArcSweep = 180 | 360

export const ARC_RADIUS = 4.8
const ARC_Y = 1.9
const ARC_TARGET: Vec3 = [HERO.position[0], 1.05, HERO.position[2]]

export function arcPointAt(degrees: number): Vec3 {
  return [
    HERO.position[0] + Math.sin(degrees * RAD) * ARC_RADIUS,
    ARC_Y,
    HERO.position[2] + Math.cos(degrees * RAD) * ARC_RADIUS,
  ]
}

export function arcAt(progress: number, sweep: ArcSweep): CameraPose & { angle: number } {
  const angle = sweep * progress
  return { position: arcPointAt(angle), target: ARC_TARGET, fov: BASE_FOV, angle }
}

export function arcPath(sweep: ArcSweep, segments = 48): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) => arcPointAt((sweep * i) / segments))
}

// ── Crash Zoom ───────────────────────────────────────────────────

/** 두 줌이 시작하기 전에 눈이 화면에 오도록 멈춰 있는 시간 */
export const ZOOM_LEAD = 0.4
export const SLOW_ZOOM_DURATION = 2
export const CRASH_ZOOM_DURATION = 0.18
export const ZOOM_PLAY_DURATION = ZOOM_LEAD + SLOW_ZOOM_DURATION
export const ZOOM_END_FOV = 11
export const ZOOM_CAMERA: Vec3 = [0.3, 1.65, 6]
export const ZOOM_TARGET: Vec3 = [0, HERO.headY, 0]

function expoIn(p: number) {
  return p <= 0 ? 0 : p >= 1 ? 1 : 2 ** (10 * (p - 1))
}

export function crashZoomAt(time: number) {
  const slow = clamp01((time - ZOOM_LEAD) / SLOW_ZOOM_DURATION)
  const crash = clamp01((time - ZOOM_LEAD) / CRASH_ZOOM_DURATION)
  return {
    slowFov: lerp(BASE_FOV, ZOOM_END_FOV, (1 - Math.cos(Math.PI * slow)) / 2),
    crashFov: lerp(BASE_FOV, ZOOM_END_FOV, expoIn(crash)),
  }
}

// ── Handheld · Camera Shake ──────────────────────────────────────

/** 카메라 흔들림. x·y는 위치(m), yaw·pitch는 시선 지점의 어긋남(m) */
export interface Jitter {
  x: number
  y: number
  yaw: number
  pitch: number
}

const STILL: Jitter = { x: 0, y: 0, yaw: 0, pitch: 0 }

export const HANDHELD_DURATION = 4

/** 주기가 서로 어긋난 느린 파형의 합. 시작과 끝에서는 0으로 줄어든다. */
export function handheldAt(time: number, duration = HANDHELD_DURATION): Jitter {
  const envelope = clamp01(Math.min(time, duration - time) / 0.3)
  if (envelope === 0) return STILL
  const wave = (a: number, b: number, phase: number) =>
    envelope * (0.65 * Math.sin(time * a + phase) + 0.35 * Math.sin(time * b + phase * 2.3))
  return {
    x: 0.07 * wave(7.1, 13.7, 0.4),
    y: 0.05 * wave(9.3, 17.9, 1.7),
    yaw: 0.09 * wave(5.3, 11.9, 2.9),
    pitch: 0.07 * wave(8.2, 15.1, 4.2),
  }
}

export const SHAKE_DURATION = 3
export const IMPACT_TIME = 1.2
export const SHAKE_LENGTH = 0.7

/** 충격 순간에 가장 크고 빠르게 줄어드는 고주파 진동 */
export function impactShakeAt(time: number): Jitter {
  const since = time - IMPACT_TIME
  if (since < 0 || since >= SHAKE_LENGTH) return STILL
  const decay = Math.exp(-6 * since) * (1 - since / SHAKE_LENGTH)
  const wave = (hz: number, phase: number) => decay * Math.cos(since * hz * Math.PI * 2 + phase)
  return {
    x: 0.22 * wave(13, 1.1),
    y: 0.3 * wave(11, 0),
    yaw: 0.2 * wave(9, 2.2),
    pitch: 0.28 * wave(14, 0.3),
  }
}

export const CRATE_SIZE = 0.7
export const CRATE_START_Y = 2.35
export const CRATE_X = 0.95
export const CRATE_Z = 0.6
const CRATE_FALL_START = 0.45

/** 낙하 상자의 중심. IMPACT_TIME에 바닥에 닿는다. */
export function cratePositionAt(time: number): Vec3 {
  const fall = clamp01((time - CRATE_FALL_START) / (IMPACT_TIME - CRATE_FALL_START))
  return [CRATE_X, lerp(CRATE_START_Y, CRATE_SIZE / 2, fall * fall), CRATE_Z]
}

export function jitteredPose(pose: CameraPose, jitter: Jitter, scale = 1): CameraPose {
  const [x, y, z] = pose.position
  const [tx, ty, tz] = pose.target
  return {
    position: [x + jitter.x * scale, y + jitter.y * scale, z],
    target: [tx + (jitter.x + jitter.yaw) * scale, ty + (jitter.y + jitter.pitch) * scale, tz],
    fov: pose.fov,
  }
}

export const SHAKE_CAMERA: CameraPose = { position: [0.2, 1.65, 6], target: [0.2, 1.15, 0], fov: BASE_FOV }

/** 파형 그래프용 세로 흔들림 표본. 값은 (위치 y + 시선 pitch) */
export function waveform(jitterAt: (time: number) => Jitter, duration: number, samples = 160) {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const time = (duration * i) / samples
    const jitter = jitterAt(time)
    return { time, value: jitter.y + jitter.pitch }
  })
}

// ── Long Take ────────────────────────────────────────────────────

export const LONG_TAKE_DURATION = 7
export const LONG_TAKE_ZONES = ['그네', '두 인물', '나무 숲'] as const

const LONG_TAKE_KEYS: { position: Vec3; target: Vec3 }[] = [
  { position: [4.8, 1.7, 5.8], target: [SWING.position[0], 1, SWING.position[2]] },
  { position: [2.4, 1.6, 4.8], target: [0.4, 1.1, 0.4] },
  { position: [-0.2, 1.6, 3.8], target: [-0.8, 1.1, -0.2] },
  { position: [1.5, 1.8, 0.2], target: [-0.6, 1.4, -5] },
  { position: [0.8, 2.2, -2.2], target: [-1.4, 1.8, -7.5] },
]

/** Catmull-Rom: b와 c 사이를 t(0..1)만큼 */
function catmullRom(a: number, b: number, c: number, d: number, t: number) {
  return (
    0.5 *
    (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t)
  )
}

function splineAt(points: Vec3[], progress: number): Vec3 {
  const last = points.length - 1
  const scaled = clamp01(progress) * last
  const index = Math.min(last - 1, Math.floor(scaled))
  const t = scaled - index
  const at = (i: number) => points[Math.min(last, Math.max(0, i))]!
  const axis = (k: 0 | 1 | 2) => catmullRom(at(index - 1)[k], at(index)[k], at(index + 1)[k], at(index + 2)[k], t)
  return [axis(0), axis(1), axis(2)]
}

/** 하나로 이어진 카메라 동선 위의 자세와 지금 지나는 구간 */
export function longTakeAt(progress: number): CameraPose & { zone: number } {
  return {
    position: splineAt(LONG_TAKE_KEYS.map((key) => key.position), progress),
    target: splineAt(LONG_TAKE_KEYS.map((key) => key.target), progress),
    fov: BASE_FOV,
    zone: Math.min(LONG_TAKE_ZONES.length - 1, Math.floor(clamp01(progress) * LONG_TAKE_ZONES.length)),
  }
}

export function longTakePath(segments = 48): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) => longTakeAt(i / segments).position)
}

// ── Ken Burns Effect ─────────────────────────────────────────────

/** 원본 화면 위의 프레임. x·y는 왼쪽 위, size는 폭·높이 비율(원본과 같은 화면비) */
export interface Frame {
  x: number
  y: number
  size: number
}

export const KEN_BURNS_DURATION = 4
export const KEN_BURNS_START: Frame = { x: 0.03, y: 0.27, size: 0.7 }
export const KEN_BURNS_END: Frame = { x: 0.3, y: 0.27, size: 0.4 }

export function kenBurnsFrameAt(progress: number): Frame {
  return {
    x: lerp(KEN_BURNS_START.x, KEN_BURNS_END.x, progress),
    y: lerp(KEN_BURNS_START.y, KEN_BURNS_END.y, progress),
    size: lerp(KEN_BURNS_START.size, KEN_BURNS_END.size, progress),
  }
}
