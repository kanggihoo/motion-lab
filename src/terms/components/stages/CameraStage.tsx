import { PlayIcon, RotateCcwIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@terms/components/ui/button'
import type { DiagramView } from '@terms/lib/diagram-math'

const DIAGRAM_LABELS: Record<DiagramView, string> = { top: '평면도', side: '측면도' }

interface CameraStageProps {
  diagram: ReactNode
  /** 도식 패널 라벨. 기본은 평면도. */
  diagramView?: DiagramView
  cameraView: ReactNode
  controls?: ReactNode
  onReplay?: () => void
  replayLabel?: string
  playing?: boolean
}

export function CameraStage({
  diagram,
  diagramView = 'top',
  cameraView,
  controls,
  onReplay,
  replayLabel = '다시 재생',
  playing = false,
}: CameraStageProps) {
  const Icon = replayLabel === '재생' ? PlayIcon : RotateCcwIcon

  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-1">
          <span className="block text-xs font-semibold text-slate-600">{DIAGRAM_LABELS[diagramView]}</span>
          {diagram}
        </div>
        <div className="space-y-1">
          <span className="block text-xs font-semibold text-slate-600">카메라 화면</span>
          {cameraView}
        </div>
      </div>
      {(controls || onReplay) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
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
