export interface Clip {
  id: string
  label: string
  duration: number
}

export function totalDuration(clips: readonly Clip[]) {
  return clips.reduce((sum, clip) => sum + clip.duration, 0)
}

export function clipRanges<T extends Clip>(clips: readonly T[]) {
  let start = 0
  return clips.map((clip) => {
    const range = { clip, start, end: start + clip.duration }
    start = range.end
    return range
  })
}

/** time 위치의 클립과 클립 안 진행도(0..1). 범위를 벗어나면 첫/마지막 클립에 고정한다. */
export function clipAt<T extends Clip>(clips: readonly T[], time: number) {
  const ranges = clipRanges(clips)
  // 0.1 + 0.2 식의 누적 오차로 경계에서 앞 클립에 머물지 않게 여유를 둔다
  const found = ranges.findIndex(({ end }) => time < end - 1e-9)
  const index = found === -1 ? ranges.length - 1 : found
  const { clip, start } = ranges[index]!
  const progress = Math.min(1, Math.max(0, (time - start) / clip.duration))
  return { index, clip, progress }
}

export const MONTAGE_CLIPS = [
  { id: 'ride', label: '타기', day: '월', duration: 1 },
  { id: 'miss', label: '놓침', day: '수', duration: 1 },
  { id: 'retry', label: '다시', day: '금', duration: 1 },
  { id: 'success', label: '성공', day: '일', duration: 1 },
] as const

export const CROSS_CUT_CLIPS = [1.6, 1.3, 1.05, 0.85, 0.65, 0.5, 0.4, 0.3].map((duration, index) => {
  const side: 'A' | 'B' = index % 2 === 0 ? 'A' : 'B'
  return { id: `${side}-${index}`, label: side, side, duration }
})

export function insertShotClips(enabled: boolean) {
  if (!enabled) return [{ id: 'main', label: '캐릭터', duration: 4 }]
  return [
    { id: 'before', label: '캐릭터', duration: 1.5 },
    { id: 'insert', label: '시계', duration: 1 },
    { id: 'after', label: '캐릭터', duration: 1.5 },
  ]
}

export type SplitAxis = 'x' | 'y'

/**
 * 2분할 화면에서 각 장면의 피사체가 자기 칸 중앙에 오도록 하는 카메라 view offset(화면 비율 단위).
 * 'x'는 A가 왼쪽·B가 오른쪽, 'y'는 A가 위·B가 아래다.
 */
export function splitViewShift(axis: SplitAxis): { a: [number, number]; b: [number, number] } {
  return axis === 'x'
    ? { a: [0.25, 0], b: [-0.25, 0] }
    : { a: [0, 0.25], b: [0, -0.25] }
}
