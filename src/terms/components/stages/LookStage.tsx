import type { ReactNode } from 'react'

interface LookStageProps {
  viewport: ReactNode
  splitPercent: number
  onSplitChange: (percent: number) => void
  beforeLabel?: string
  afterLabel?: string
  controls?: ReactNode
}

export function LookStage({
  viewport,
  splitPercent,
  onSplitChange,
  beforeLabel = '원본',
  afterLabel = '효과',
  controls,
}: LookStageProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        {viewport}
        {splitPercent > 0 && (
          <span className="pointer-events-none absolute top-2 left-2 rounded bg-slate-950/75 px-2 py-0.5 text-xs font-semibold text-white">
            전 · {beforeLabel}
          </span>
        )}
        {splitPercent < 100 && (
          <span className="pointer-events-none absolute top-2 right-2 rounded bg-indigo-950/85 px-2 py-0.5 text-xs font-semibold text-white">
            후 · {afterLabel}
          </span>
        )}
        {splitPercent > 0 && splitPercent < 100 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.55)]"
            style={{ left: `${splitPercent}%` }}
          />
        )}
      </div>

      <label className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-slate-700">전/후 분할 위치</span>
        <span className="tabular-nums text-slate-600">
          {beforeLabel} {splitPercent}% · {afterLabel} {100 - splitPercent}%
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={splitPercent}
          aria-label="전/후 분할 위치"
          aria-valuetext={`${beforeLabel} ${splitPercent}%, ${afterLabel} ${100 - splitPercent}%`}
          onChange={(event) => onSplitChange(event.currentTarget.valueAsNumber)}
          className="col-span-2 w-full accent-indigo-700"
        />
      </label>

      {controls && <div className="flex flex-wrap items-center gap-1.5">{controls}</div>}
    </div>
  )
}
