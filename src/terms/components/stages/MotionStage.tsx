import { PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@terms/components/ui/button'

interface MotionStageProps {
  /** 데모 영역 */
  children: ReactNode
  /** 카드별 컨트롤 슬롯. 각 컨트롤의 label은 카드가 붙인다. */
  controls?: ReactNode
  /** 있으면 「재생 / 다시 재생」 버튼을 둔다(시간 재생 데모, D-9). */
  onReplay?: () => void
  replayLabel?: '재생' | '다시 재생'
  playing?: boolean
  /** 있으면 「재생 / 일시정지」 토글을 둔다(Loop·Marquee, D-12). */
  loop?: { running: boolean; onToggle: () => void }
  /** 있으면 속도 슬라이더(0.25×~2×)를 둔다. Motion · Timing & Sequence에만 쓴다(D-9). */
  speed?: { rate: number; onChange: (rate: number) => void }
}

export function MotionStage({
  children,
  controls,
  onReplay,
  replayLabel = '재생',
  playing = false,
  loop,
  speed,
}: MotionStageProps) {
  const ReplayIcon = replayLabel === '재생' ? PlayIcon : RotateCcwIcon
  const LoopIcon = loop?.running ? PauseIcon : PlayIcon

  return (
    <div className="space-y-2.5">
      <div className="relative min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-3">{children}</div>
      {(controls || speed || loop || onReplay) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {controls}
            {speed && (
              <label className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-600">속도</span>
                <input
                  type="range"
                  min={0.25}
                  max={2}
                  step={0.25}
                  value={speed.rate}
                  aria-label="재생 속도"
                  aria-valuetext={`${speed.rate}×`}
                  onChange={(event) => speed.onChange(event.currentTarget.valueAsNumber)}
                  className="w-24 accent-indigo-700"
                />
                <span className="w-10 tabular-nums text-slate-600">{speed.rate}×</span>
              </label>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {loop && (
              <Button type="button" size="sm" variant="outline" onClick={loop.onToggle} className="bg-white">
                <LoopIcon aria-hidden="true" />
                {loop.running ? '일시정지' : '재생'}
              </Button>
            )}
            {onReplay && (
              <Button type="button" size="sm" variant="outline" onClick={onReplay} className="bg-white">
                <ReplayIcon aria-hidden="true" />
                {playing ? '재생 중…' : replayLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
