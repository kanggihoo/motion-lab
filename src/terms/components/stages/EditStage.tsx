import { PlayIcon, RotateCcwIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@terms/components/ui/button'

interface EditStageProps {
  viewport: ReactNode
  timeline: ReactNode
  controls?: ReactNode
  onReplay?: () => void
  replayLabel?: string
  playing?: boolean
}

export function EditStage({
  viewport,
  timeline,
  controls,
  onReplay,
  replayLabel = '다시 재생',
  playing = false,
}: EditStageProps) {
  const Icon = replayLabel === '재생' ? PlayIcon : RotateCcwIcon

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <span className="block text-xs font-semibold text-slate-600">화면</span>
        {viewport}
      </div>
      <div className="space-y-1">
        <span className="block text-xs font-semibold text-slate-600">타임라인</span>
        {timeline}
      </div>
      {(controls || onReplay) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5">{controls}</div>
          {onReplay && (
            <Button type="button" size="sm" variant="outline" onClick={onReplay} className="bg-white">
              <Icon aria-hidden="true" />
              {playing ? '재생 중…' : replayLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
