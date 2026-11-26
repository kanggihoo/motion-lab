/** Motion · Timing & Sequence 데모의 순수 계산 */

export type EaseKind = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

/** GSAP `power2`는 3차 곡선이다. velocity는 그 ease의 미분(속도)이고 최댓값은 `MAX_VELOCITY`. */
export const EASES: { kind: EaseKind; gsapEase: string; note: string; velocity: (t: number) => number }[] = [
  { kind: 'linear', gsapEase: 'none', note: '속도가 일정', velocity: () => 1 },
  { kind: 'ease-in', gsapEase: 'power2.in', note: '처음이 느림', velocity: (t) => 3 * t * t },
  { kind: 'ease-out', gsapEase: 'power2.out', note: '끝이 느림', velocity: (t) => 3 * (1 - t) ** 2 },
  { kind: 'ease-in-out', gsapEase: 'power2.inOut', note: '양 끝이 느림', velocity: (t) => 12 * Math.min(t, 1 - t) ** 2 },
]

export const MAX_VELOCITY = 3

export interface SpringConfig {
  stiffness: number
  damping: number
}

/** 질량 1인 감쇠 spring이 0에서 출발해 목표 1로 갈 때, t초의 값 */
export function springValue({ stiffness, damping }: SpringConfig, t: number) {
  const omega = Math.sqrt(stiffness)
  const zeta = damping / (2 * omega)
  if (Math.abs(zeta - 1) < 1e-6) return 1 - Math.exp(-omega * t) * (1 + omega * t)
  if (zeta < 1) {
    const damped = omega * Math.sqrt(1 - zeta * zeta)
    return 1 - Math.exp(-zeta * omega * t) * (Math.cos(damped * t) + ((zeta * omega) / damped) * Math.sin(damped * t))
  }
  const root = omega * Math.sqrt(zeta * zeta - 1)
  const slow = -zeta * omega + root
  const fast = -zeta * omega - root
  return 1 - (fast * Math.exp(slow * t) - slow * Math.exp(fast * t)) / (fast - slow)
}

const SETTLE_TOLERANCE = 0.005
const SETTLE_LIMIT = 6

/** 목표와의 차이가 마지막으로 0.5%를 넘는 시각(초). 최대 6초 */
export function springDuration(config: SpringConfig) {
  for (let step = SETTLE_LIMIT * 100; step > 0; step--) {
    if (Math.abs(springValue(config, step / 100) - 1) > SETTLE_TOLERANCE) {
      return Math.min(SETTLE_LIMIT, (step + 1) / 100)
    }
  }
  return 0.01
}

/** 목표를 지나친 최대 비율(0.15 = 15%). 지나치지 않으면 0 */
export function springOvershoot({ stiffness, damping }: SpringConfig) {
  const zeta = damping / (2 * Math.sqrt(stiffness))
  return zeta < 1 ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0
}

/** GSAP 사용자 지정 ease. 진행률 0~1을 spring 값으로 바꾼다. */
export function springEase(config: SpringConfig) {
  const duration = springDuration(config)
  return (progress: number) => (progress >= 1 ? 1 : springValue(config, progress * duration))
}

/**
 * 낙하 뒤 정확히 두 번 튀는 구간. height는 바닥에서 뜬 높이(낙하 높이 대비 비율)다.
 * 첫 낙하는 시작 높이 1에서 0으로 간다.
 */
export const BOUNCE_STEPS = [
  { height: 0, duration: 0.45, ease: 'power2.in' },
  { height: 0.35, duration: 0.22, ease: 'power2.out' },
  { height: 0, duration: 0.22, ease: 'power2.in' },
  { height: 0.12, duration: 0.13, ease: 'power2.out' },
  { height: 0, duration: 0.13, ease: 'power2.in' },
] as const

export const TIMELINE_CLIPS = { title: 0.5, subtitle: 0.5, button: 0.4 } as const
export const TIMELINE_AXIS = 2
export const OVERLAP_MIN = -0.3
export const OVERLAP_MAX = 0.4
export const OVERLAP_STEP = 0.05

/** 겹침(초)을 허용 범위의 0.05 단위로 맞춘다. 음수는 간격이다. */
export function snapOverlap(value: number) {
  const snapped = Math.round(value / OVERLAP_STEP) * OVERLAP_STEP
  return Number(Math.min(OVERLAP_MAX, Math.max(OVERLAP_MIN, snapped)).toFixed(2))
}

/** 각 트랙의 시작 시각. 겹침은 바로 앞 트랙이 끝나는 시각을 기준으로 한다. */
export function timelineStarts(subtitleOverlap: number, buttonOverlap: number) {
  const subtitle = TIMELINE_CLIPS.title - subtitleOverlap
  const button = subtitle + TIMELINE_CLIPS.subtitle - buttonOverlap
  return { title: 0, subtitle, button, end: button + TIMELINE_CLIPS.button }
}

/** GSAP 위치 파라미터. 0.15초 겹침 → `-=0.15`, 0.1초 간격 → `+=0.1` */
export function positionParam(overlap: number) {
  return overlap < 0 ? `+=${-overlap}` : `-=${overlap}`
}

export function overlapLabel(overlap: number) {
  if (overlap > 0) return `${overlap.toFixed(2)}초 겹침`
  if (overlap < 0) return `${(-overlap).toFixed(2)}초 간격`
  return '바로 이어서'
}
