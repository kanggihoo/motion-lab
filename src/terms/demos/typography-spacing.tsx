import { useState } from 'react'
import { SpacingPreview, StyleSample, type SampleSizes } from '@terms/components/StylePreviews'

const irregular = { label: 13, title: 22, body: 15, detail: 17 }
const roles = [
  ['label', '라벨'], ['title', '제목'], ['body', '본문'], ['detail', '보조'],
] satisfies [keyof SampleSizes, string][]

export function TypeScaleDemo() {
  const [scaled, setScaled] = useState(false)
  const [ratio, setRatio] = useState(1.25)
  const round = (value: number) => Math.round(value * 10) / 10
  const sizes = scaled ? { label: round(16 / ratio ** 2), title: round(16 * ratio ** 2), body: 16, detail: round(16 / ratio) } : irregular

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={scaled} onChange={(event) => setScaled(event.target.checked)} /> Type Scale 적용
        </label>
        <label className="flex items-center gap-2">
          단계 비율
          <select value={ratio} onChange={(event) => { setRatio(Number(event.target.value)); setScaled(true) }}>
            <option value={1.2}>1.2</option><option value={1.25}>1.25</option><option value={1.333}>1.333</option>
          </select>
        </label>
      </div>
      <StyleSample sizes={sizes} className="border bg-white" />
      <p className="text-xs text-slate-700">{scaled ? '16px 기준, 단계 간 같은 비율' : '제각각 크기'}</p>
      <dl className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
        {roles.map(([role, name]) => <div key={role} className="rounded border bg-white p-1.5">
          <dt>{name}</dt><dd className="font-semibold tabular-nums">{sizes[role]}px</dd>
        </div>)}
      </dl>
    </div>
  )
}

export function SpacingScaleDemo() {
  const [scaled, setScaled] = useState(false)
  const [guides, setGuides] = useState(false)
  const sizes = scaled ? { margin: 24, padding: 16, gap: 8 } : { margin: 19, padding: 13, gap: 11 }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={scaled} onChange={(event) => setScaled(event.target.checked)} /> 8px 단위 적용
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} /> 여백 표시
        </label>
      </div>
      <SpacingPreview {...sizes} guides={guides} />
      <dl className="grid grid-cols-3 gap-1 text-xs">
        <div className={`rounded border p-1.5 ${guides ? 'bg-indigo-200 text-indigo-950' : 'bg-white'}`}>
          <dt>바깥 margin</dt><dd className="font-semibold tabular-nums">{sizes.margin}px</dd>
        </div>
        <div className={`rounded border p-1.5 ${guides ? 'bg-teal-200 text-teal-950' : 'bg-white'}`}>
          <dt>안쪽 padding</dt><dd className="font-semibold tabular-nums">{sizes.padding}px</dd>
        </div>
        <div className="rounded border bg-white p-1.5"><dt>요소 사이 gap</dt><dd className="font-semibold tabular-nums">{sizes.gap}px</dd></div>
      </dl>
    </div>
  )
}
