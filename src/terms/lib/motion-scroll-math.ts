/** Motion · Scroll 데모의 순수 계산. 모두 입력만의 함수라 어느 방향으로 스크롤해도 같은 값이다. */

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Pin 데모의 고정 구간(px). motion.md 요청 예문의 500px. */
export const PIN_DISTANCE = 500

export type PinPhase = 'before' | 'pinned' | 'after'

export function pinStateAt(progress: number, distance = PIN_DISTANCE) {
  const p = clamp01(progress)
  const phase: PinPhase = p <= 0 ? 'before' : p >= 1 ? 'after' : 'pinned'
  return { phase, remaining: Math.round((1 - p) * distance) }
}

/** 단계 문단의 중앙이 화면 중앙을 지날 때 다음 단계가 된다. */
export function storyStepAt(progress: number, count: number) {
  return Math.round(clamp01(progress) * (count - 1))
}

export type ParallaxLayer = 'back' | 'middle' | 'front'

const PARALLAX_BASE = 50
const PARALLAX_DEPTH: Record<ParallaxLayer, number> = { back: -0.8, middle: 0, front: 1.2 }

/** 스크롤 끝까지 층이 올라가는 거리. strength 0이면 세 층이 같이 움직여 깊이감이 없다. */
export function parallaxShift(layer: ParallaxLayer, strength: number) {
  return Math.round(PARALLAX_BASE * (1 + clamp01(strength) * PARALLAX_DEPTH[layer]))
}

/** 가로 track을 밀어야 하는 x. 내용이 화면보다 좁으면 움직이지 않는다. */
export function horizontalShift(trackWidth: number, viewportWidth: number) {
  return Math.min(0, viewportWidth - trackWidth)
}

/** scroll 위치가 섹션 경계(섹션 높이의 배수)에 정렬됐는지. 소수점 위치를 허용한다. */
export function isSnapAligned(scrollTop: number, sectionHeight: number) {
  if (sectionHeight <= 0) return true
  const rest = scrollTop % sectionHeight
  return Math.min(rest, sectionHeight - rest) < 1.5
}
