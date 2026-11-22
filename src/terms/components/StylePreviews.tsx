import type { CSSProperties } from 'react'

export type SampleSizes = { label: number; title: number; body: number; detail: number }

export function StyleSample({ sizes, gap = 8, style, className = '' }: {
  sizes?: SampleSizes
  gap?: number
  style?: CSSProperties
  className?: string
}) {
  return (
    <div className={`grid min-w-0 rounded-lg p-3 leading-normal ${className}`} style={{ gap, ...style }}>
      <p className="font-medium" style={{ fontSize: sizes?.label ?? 12 }}>팀 문서</p>
      <p className="font-bold" style={{ fontSize: sizes?.title ?? 22 }}>프로젝트 요약</p>
      <p style={{ fontSize: sizes?.body ?? 15 }}>이번 주에 완료한 작업과 다음 할 일을 확인하세요.</p>
      <p style={{ fontSize: sizes?.detail ?? 13 }}>최종 수정 · 오늘 오전</p>
    </div>
  )
}

export function ContrastResult({ ratio, showLarge = false }: { ratio: number; showLarge?: boolean }) {
  return (
    <output className="block rounded-md border border-slate-300 bg-white p-3 text-slate-900">
      <strong className="text-base tabular-nums">{ratio.toFixed(2)}:1</strong>
      <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span>보통 글자 · {ratio >= 4.5 ? '✓ AA 통과' : '✗ AA 미달'} (4.5:1)</span>
        {showLarge && <span>큰 글자 · {ratio >= 3 ? '✓ AA 통과' : '✗ AA 미달'} (3:1)</span>}
      </span>
    </output>
  )
}

const layerShadows = {
  card: '0 2px 4px rgb(15 23 42 / 0.14)',
  popover: '0 7px 14px rgb(15 23 42 / 0.20)',
  dialog: '0 13px 26px rgb(15 23 42 / 0.27)',
}

export function ElevationPreview({ flattened }: { flattened: boolean }) {
  const shadow = (layer: keyof typeof layerShadows) =>
    flattened ? layerShadows.card : layerShadows[layer]

  return (
    <div className="isolate rounded-lg border bg-slate-100 p-2.5">
      <p className="mb-2 font-medium">바닥</p>
      <div className="-mb-6 me-10 rounded-lg border bg-white" style={{ boxShadow: shadow('card') }}>
        <StyleSample />
      </div>
      <div className="relative z-10 -mb-3 ms-9 me-2 rounded-lg border bg-white px-3 pt-2 pb-4"
        style={{ boxShadow: shadow('popover') }}>
        <strong>Popover</strong><p>정렬 옵션</p>
      </div>
      <div className="relative z-20 ms-20 rounded-lg border bg-white p-3" style={{ boxShadow: shadow('dialog') }}>
        <strong>Modal Dialog</strong><p>변경 사항 확인</p>
      </div>
    </div>
  )
}

export function SpacingPreview({ margin, padding, gap, guides }: {
  margin: number
  padding: number
  gap: number
  guides: boolean
}) {
  return (
    <div className={`flow-root overflow-hidden rounded-lg border ${guides ? 'bg-indigo-200' : 'bg-slate-100'}`}>
      <div className={`rounded-lg border border-slate-300 ${guides ? 'bg-teal-200' : 'bg-white'}`} style={{ margin, padding }}>
        <StyleSample gap={gap} className="bg-white p-0!" />
      </div>
    </div>
  )
}
