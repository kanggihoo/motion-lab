/** Motion · Pointer & Event 데모의 순수 계산 */

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** 커서가 이 거리(px) 안에 들어오면 버튼이 끌린다. */
export const MAGNETIC_RADIUS = 110

/** 버튼 원위치 중심에서 커서까지의 (dx, dy) → 버튼 이동량. 길이는 max를 넘지 않는다. */
export function magneticOffset(dx: number, dy: number, max: number, radius = MAGNETIC_RADIUS) {
  const distance = Math.hypot(dx, dy)
  if (distance === 0 || distance > radius) return { x: 0, y: 0 }
  const scale = max / radius
  return { x: dx * scale, y: dy * scale }
}

/** 카드 안 커서 위치(px, py: 0~1) → 기울기(deg)와 반사광 위치(%). 가운데면 평평하다. */
export function tiltAt(px: number, py: number, max: number) {
  const x = clamp01(px)
  const y = clamp01(py)
  return { rotateX: (0.5 - y) * 2 * max, rotateY: (x - 0.5) * 2 * max, glareX: x * 100, glareY: y * 100 }
}
