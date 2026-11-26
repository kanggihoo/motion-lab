import type { TimePalette } from '@terms/components/scene/scene-colors'

/** 시간에 따라 움직이는 주인공의 위치·방향·다리 벌림 */
export interface HeroMotion {
  x: number
  y: number
  z: number
  /** y축 회전(rad). 0이면 카메라(+z)를 본다. */
  facing: number
  /** 두 다리를 앞뒤로 벌린 각도(rad). */
  stride: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep = (from: number, to: number, v: number) => {
  const t = clamp01((v - from) / (to - from))
  return t * t * (3 - 2 * t)
}

// 달려와 점프하고 다시 달리는 장면 (Speed Ramp, Freeze Frame 공용). s = 장면 시간(초)
export const RUN_DURATION = 3.2
export const JUMP_START = 1.1
export const JUMP_END = 2.1
export const JUMP_APEX = (JUMP_START + JUMP_END) / 2
export const JUMP_HEIGHT = 1.2

export function runJumpPose(s: number): HeroMotion {
  const time = Math.min(RUN_DURATION, Math.max(0, s))
  const u = clamp01((time - JUMP_START) / (JUMP_END - JUMP_START))
  const air = 4 * u * (1 - u)
  const running = Math.sin(time * Math.PI * 4.8) * 0.7
  return {
    x: lerp(-2.7, 2.7, time / RUN_DURATION),
    y: JUMP_HEIGHT * air,
    z: 3.2,
    facing: Math.PI / 2,
    stride: lerp(running, 0.8, Math.min(1, air * 2)),
  }
}

// Speed Ramp
export const RAMP_FAST = 2
export const RAMP_SLOW = 0.25

/** 장면 시간 s에서의 재생 속도. 점프 구간은 0.25×, 앞뒤 0.5초가 경사 구간이다. */
export function rampSpeedAt(s: number) {
  const half = (JUMP_END - JUMP_START) / 2
  return lerp(RAMP_SLOW, RAMP_FAST, smoothstep(half, half + 0.5, Math.abs(s - JUMP_APEX)))
}

const RAMP_STEPS = 640
const RAMP_STEP = RUN_DURATION / RAMP_STEPS
// RAMP_TABLE[i] = 장면 시간 i * RAMP_STEP에 도달하는 재생 시간 (∫ ds / speed)
const RAMP_TABLE = (() => {
  const table = [0]
  for (let i = 0; i < RAMP_STEPS; i += 1) {
    table.push(table[i]! + RAMP_STEP / rampSpeedAt((i + 0.5) * RAMP_STEP))
  }
  return table
})()

export const RAMP_PLAY_DURATION = RAMP_TABLE[RAMP_STEPS]!

export function rampPlayTimeAt(s: number) {
  const index = clamp01(s / RUN_DURATION) * RAMP_STEPS
  const low = Math.floor(index)
  const high = Math.min(RAMP_STEPS, low + 1)
  return lerp(RAMP_TABLE[low]!, RAMP_TABLE[high]!, index - low)
}

export function rampSceneTimeAt(playTime: number) {
  if (playTime <= 0) return 0
  if (playTime >= RAMP_PLAY_DURATION) return RUN_DURATION
  let low = 0
  let high = RAMP_STEPS
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (RAMP_TABLE[mid]! <= playTime) low = mid
    else high = mid
  }
  const t = (playTime - RAMP_TABLE[low]!) / (RAMP_TABLE[high]! - RAMP_TABLE[low]!)
  return (low + t) * RAMP_STEP
}

// Freeze Frame
export const FREEZE_HOLD = 2
export const FREEZE_PLAY_DURATION = RUN_DURATION + FREEZE_HOLD

export function freezeFrameAt(playTime: number) {
  const frozen = playTime >= JUMP_APEX && playTime < JUMP_APEX + FREEZE_HOLD
  const sceneTime = frozen
    ? JUMP_APEX
    : playTime < JUMP_APEX
      ? Math.max(0, playTime)
      : Math.min(RUN_DURATION, playTime - FREEZE_HOLD)
  return { sceneTime, frozen }
}

// Time-lapse: 12:00부터 24:00까지 5분마다 1장, 24fps 재생
export const TIMELAPSE_INTERVAL_MIN = 5
export const TIMELAPSE_FRAMES = (12 * 60) / TIMELAPSE_INTERVAL_MIN
export const TIMELAPSE_PLAY_DURATION = TIMELAPSE_FRAMES / 24

export function timelapseAt(playTime: number) {
  const progress = clamp01(playTime / TIMELAPSE_PLAY_DURATION)
  const frame = Math.min(TIMELAPSE_FRAMES, Math.floor(progress * TIMELAPSE_FRAMES + 1e-6))
  const elapsed = frame * TIMELAPSE_INTERVAL_MIN
  const hours = 12 + Math.floor(elapsed / 60)
  const minutes = elapsed % 60
  return {
    frame,
    progress: frame / TIMELAPSE_FRAMES,
    clock: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    // 시계 방향 각도(rad). 12시 방향이 0.
    hourAngle: (elapsed / (12 * 60)) * Math.PI * 2,
    minuteAngle: (minutes / 60) * Math.PI * 2,
  }
}

function mixHex(a: string, b: string, t: number) {
  const channel = (hex: string, offset: number) => Number.parseInt(hex.slice(offset, offset + 2), 16)
  return `#${[1, 3, 5]
    .map((offset) => Math.round(lerp(channel(a, offset), channel(b, offset), t)).toString(16).padStart(2, '0'))
    .join('')}`
}

/** 두 시간대 팔레트를 항목별로 보간한다. */
export function mixPalette(a: TimePalette, b: TimePalette, t: number): TimePalette {
  const k = clamp01(t)
  if (k === 0) return a
  if (k === 1) return b
  const entries = (Object.keys(a) as (keyof TimePalette)[]).map((key) => {
    const from = a[key]
    const to = b[key]
    if (typeof from === 'string') return [key, mixHex(from, to as string, k)]
    if (typeof from === 'number') return [key, lerp(from, to as number, k)]
    return [key, from.map((v, i) => lerp(v, (to as number[])[i]!, k))]
  })
  return Object.fromEntries(entries) as TimePalette
}

// Hyperlapse
export const HYPERLAPSE_SHOTS = 48
export const HYPERLAPSE_PLAY_DURATION = 4
export const HYPERLAPSE_START_Z = 12
export const HYPERLAPSE_END_Z = 4.4
export type LapseMode = 'timelapse' | 'hyperlapse'

export function hyperlapseAt(playTime: number, mode: LapseMode) {
  const progress = clamp01(playTime / HYPERLAPSE_PLAY_DURATION)
  const shot = Math.min(HYPERLAPSE_SHOTS, Math.floor(progress * HYPERLAPSE_SHOTS + 1e-6))
  const shotProgress = shot / HYPERLAPSE_SHOTS
  return {
    shot,
    progress: shotProgress,
    cameraZ: mode === 'hyperlapse' ? lerp(HYPERLAPSE_START_Z, HYPERLAPSE_END_Z, shotProgress) : HYPERLAPSE_START_Z,
  }
}

// Bullet Time: 점프 → 정점에서 장면 정지 + 카메라 한 바퀴 → 착지
export const BULLET_RISE = 0.8
export const BULLET_ORBIT = 3.2
export const BULLET_PLAY_DURATION = BULLET_RISE * 2 + BULLET_ORBIT
export const BULLET_CAMERAS = 12

export function bulletTimeAt(playTime: number) {
  const t = Math.min(BULLET_PLAY_DURATION, Math.max(0, playTime))
  const orbitEnd = BULLET_RISE + BULLET_ORBIT
  const phase = t < BULLET_RISE ? 'rise' : t < orbitEnd ? 'orbit' : 'land'
  const orbit = clamp01((t - BULLET_RISE) / BULLET_ORBIT)
  // 0 = 지면, 1 = 정점
  const lift = phase === 'rise' ? t / BULLET_RISE : phase === 'land' ? (BULLET_PLAY_DURATION - t) / BULLET_RISE : 1
  const air = lift * (2 - lift)
  return {
    phase: phase as 'rise' | 'orbit' | 'land',
    angle: orbit * Math.PI * 2,
    activeCamera: phase === 'orbit' ? Math.floor(orbit * BULLET_CAMERAS + 1e-6) % BULLET_CAMERAS : null,
    pose: { x: 0, y: JUMP_HEIGHT * air, z: 0, facing: 0.6, stride: 0.8 * air } satisfies HeroMotion,
  }
}

// Stop Motion: 블록이 하나씩 뛰어들어 줄을 맞춘다
export const STOP_MOTION_FPS = 12
export const SMOOTH_FPS = 60
export const STOP_MOTION_DURATION = 2.5
export const BLOCK_COUNT = 3
const BLOCK_DELAY = 0.5
const BLOCK_HOP = 1.1

export function quantizeTime(t: number, fps: number) {
  return Math.floor(t * fps + 1e-6) / fps
}

/** index번째 블록의 위치. offsetX는 제자리 기준 가로 거리, y는 바닥에서의 높이. */
export function blockHopAt(time: number, index: number) {
  const u = clamp01((time - index * BLOCK_DELAY) / BLOCK_HOP)
  return {
    visible: time >= index * BLOCK_DELAY,
    offsetX: (1 - u) * 1.2,
    y: 4 * u * (1 - u) * 1.1 + (1 - u) * 0.6,
    spin: (1 - u) * Math.PI,
  }
}
