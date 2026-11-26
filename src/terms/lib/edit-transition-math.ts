function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

/** 하드 컷: cutAt부터 다음 장면(1). 중간값이 없다. */
export function hardCutAt(time: number, cutAt: number) {
  return time >= cutAt ? 1 : 0
}

// Jump Cut: 원본 테이크에서 남기는 구간. 그 사이는 잘라낸다.
export const JUMP_SOURCE_DURATION = 7
export const JUMP_KEPT_SEGMENTS: readonly { start: number; end: number }[] = [
  { start: 0, end: 1 },
  { start: 3, end: 4 },
  { start: 6, end: 7 },
]
export const JUMP_EDITED_DURATION = JUMP_KEPT_SEGMENTS.reduce((sum, s) => sum + s.end - s.start, 0)

/** 편집본 시간 → 원본 테이크 시간과 조각 번호 */
export function jumpCutSourceAt(editedTime: number) {
  let offset = 0
  for (const [index, segment] of JUMP_KEPT_SEGMENTS.entries()) {
    const length = segment.end - segment.start
    if (editedTime < offset + length) {
      return { index, sourceTime: segment.start + Math.max(0, editedTime - offset) }
    }
    offset += length
  }
  const index = JUMP_KEPT_SEGMENTS.length - 1
  return { index, sourceTime: JUMP_KEPT_SEGMENTS[index]!.end }
}

/** 인물은 원본 테이크 내내 왼쪽에서 오른쪽으로 일정하게 걷는다. */
export function jumpCutHeroX(sourceTime: number) {
  return -0.6 + sourceTime * 0.3
}

// Wipe (Dissolve 비교 모드도 같은 전환 구간을 쓴다)
export const WIPE_DURATION = 3
export const WIPE_WINDOW = { start: 0.8, end: 2.2 } as const

export function wipeProgressAt(time: number) {
  return clamp01((time - WIPE_WINDOW.start) / (WIPE_WINDOW.end - WIPE_WINDOW.start))
}

// Match Cut
export const MATCH_DURATION = 3
export const MATCH_CUT_AT = 1.5

/** 화면 중앙에 둔 구의 반지름이 화면 높이에서 차지하는 비율 */
export function sphereScreenRadius(radius: number, distance: number, fovDeg: number) {
  return Math.tan(Math.asin(radius / distance)) / Math.tan((fovDeg * Math.PI) / 360) / 2
}

/** 같은 화각에서 두 구가 화면에 같은 크기로 보이는 거리 */
export function matchedDistance(fromRadius: number, fromDistance: number, toRadius: number) {
  return (fromDistance * toRadius) / fromRadius
}

// Whip Pan
export const WHIP_DURATION = 2.4
export const WHIP_WINDOW = { start: 0.8, cut: 1.2, end: 1.6 } as const
export const WHIP_MAX_BLUR = 0.28

/** pan: 카메라를 옆으로 돌린 정도(A는 0→1, 컷 뒤 B는 -1→0). blur: 화면 너비 대비 번짐 폭 */
export function whipPanAt(time: number) {
  const { start, cut, end } = WHIP_WINDOW
  const cutDone = time >= cut
  const away = cutDone ? clamp01((end - time) / (end - cut)) : clamp01((time - start) / (cut - start))
  const eased = away * away
  return {
    scene: hardCutAt(time, cut),
    pan: cutDone ? -eased : eased,
    blur: eased * WHIP_MAX_BLUR,
  }
}

// Smash Cut
export const SMASH_DURATION = 4
export const SMASH_CUT_AT = 2.4

// Iris
export type IrisDirection = 'out' | 'in'
export const IRIS_DURATION = 2.4
export const IRIS_MAX_RADIUS = 75
export const IRIS_HOLD = 0.4

/** CSS circle() 반지름(%) */
export function irisRadiusAt(time: number, direction: IrisDirection) {
  const p = clamp01((time - IRIS_HOLD) / (IRIS_DURATION - IRIS_HOLD * 2))
  return IRIS_MAX_RADIUS * (direction === 'out' ? 1 - p : p)
}

// Fade to Black (Dissolve 비교 모드는 같은 구간에서 두 장면을 겹친다)
export type FadeMode = 'fade' | 'dissolve'
export const FADE_DURATION = 4
export const FADE_POINTS = { outStart: 0.6, black: 1.7, inStart: 2.3, end: 3.4 } as const

export function fadeStateAt(time: number, mode: FadeMode) {
  const { outStart, black, inStart, end } = FADE_POINTS
  if (mode === 'dissolve') {
    return { mix: clamp01((time - outStart) / (end - outStart)), brightness: 1 }
  }
  const brightness =
    time < black ? 1 - clamp01((time - outStart) / (black - outStart)) : clamp01((time - inStart) / (end - inStart))
  // 장면 교체는 완전한 검정 구간의 한가운데에서 일어난다.
  return { mix: hardCutAt(time, (black + inStart) / 2), brightness }
}

// J-Cut / L-Cut
export type SplitEditMode = 'straight' | 'j' | 'l'
export const SPLIT_EDIT_DURATION = 4
export const SPLIT_EDIT_VIDEO_CUT = 2
export const SPLIT_EDIT_OFFSET = 1

export function splitEditAudioCut(mode: SplitEditMode) {
  if (mode === 'j') return SPLIT_EDIT_VIDEO_CUT - SPLIT_EDIT_OFFSET
  if (mode === 'l') return SPLIT_EDIT_VIDEO_CUT + SPLIT_EDIT_OFFSET
  return SPLIT_EDIT_VIDEO_CUT
}

// 무음 오디오 파형 (Smash Cut, J-Cut / L-Cut 공용)
export type AudioKind = 'quiet' | 'alarm' | 'talk' | 'train'

export interface AudioClip {
  label: string
  kind: AudioKind
  start: number
  end: number
}

const AUDIO_SHAPES: Record<AudioKind, { base: number; swing: number; rate: number }> = {
  quiet: { base: 0.05, swing: 0.04, rate: 5 },
  alarm: { base: 0.82, swing: 0.18, rate: 23 },
  talk: { base: 0.22, swing: 0.34, rate: 11 },
  train: { base: 0.5, swing: 0.18, rate: 29 },
}

/** 0..1 레벨. 실제 소리가 아니라 정해진 모양이다. */
export function audioLevelAt(kind: AudioKind, time: number) {
  const { base, swing, rate } = AUDIO_SHAPES[kind]
  return base + swing * Math.abs(Math.sin(time * rate))
}

export function audioClipAt(clips: readonly AudioClip[], time: number) {
  return clips.find((clip) => time >= clip.start && time < clip.end) ?? clips[clips.length - 1]!
}
