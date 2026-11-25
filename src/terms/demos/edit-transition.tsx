import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState } from 'react'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { EditStage } from '@terms/components/stages/EditStage'
import { DISSOLVE_TOTAL_DURATION, dissolveMixAt, type OverlapDuration } from '@terms/lib/demo-math'

gsap.registerPlugin(useGSAP)

const OVERLAP_OPTIONS: OverlapDuration[] = [0.3, 1, 2]

export function DissolveDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const mixRef = useRef(0)

  const [overlap, setOverlap] = useState<OverlapDuration>(1)
  const [time, setTime] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [playing, setPlaying] = useState(false)

  useGSAP(
    () => {
      if (playCount === 0) return
      const proxy = { t: 0 }
      gsap.to(proxy, {
        t: DISSOLVE_TOTAL_DURATION,
        duration: DISSOLVE_TOTAL_DURATION,
        ease: 'none',
        onUpdate: () => {
          mixRef.current = dissolveMixAt(proxy.t, overlap)
          setTime(proxy.t)
        },
        onComplete: () => {
          mixRef.current = 1
          setTime(DISSOLVE_TOTAL_DURATION)
          setPlaying(false)
        },
      })
    },
    { scope: rootRef, dependencies: [playCount, overlap], revertOnUpdate: true },
  )

  function handleReplay() {
    mixRef.current = 0
    setTime(0)
    setPlaying(true)
    setPlayCount((c) => c + 1)
  }

  function selectOverlap(nextOverlap: OverlapDuration) {
    setPlaying(false)
    setPlayCount(0)
    setOverlap(nextOverlap)
    mixRef.current = 0
    setTime(0)
  }

  const mix = dissolveMixAt(time, overlap)
  const overlapStartPct = ((DISSOLVE_TOTAL_DURATION / 2 - overlap / 2) / DISSOLVE_TOTAL_DURATION) * 100
  const overlapEndPct = ((DISSOLVE_TOTAL_DURATION / 2 + overlap / 2) / DISSOLVE_TOTAL_DURATION) * 100
  const overlapWidthPct = overlapEndPct - overlapStartPct
  const playheadPct = (time / DISSOLVE_TOTAL_DURATION) * 100

  return (
    <div ref={rootRef}>
      <EditStage
        playing={playing}
        replayLabel={playCount > 0 ? '다시 재생' : '재생'}
        onReplay={handleReplay}
        controls={
          <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend className="sr-only">겹침 길이 선택</legend>
            <span className="mr-1 text-xs font-semibold text-slate-600">겹침 길이:</span>
            {OVERLAP_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={overlap === opt}
                onClick={() => selectOverlap(opt)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
              >
                {opt.toFixed(1)}s
              </button>
            ))}
          </fieldset>
        }
        viewport={
          <ViewportCanvas label="낮에서 노을로 넘어가는 Dissolve 3D 화면" placeholderTone="day">
            <DualSceneComposer
              mode="dissolve"
              progressRef={mixRef}
              cameraA={{ position: [0.35, 1.75, 6.2], lookAt: [0, 1.0, 0], fov: 42 }}
              cameraB={{ position: [-0.45, 1.65, 5.6], lookAt: [0, 1.05, 0], fov: 42 }}
              sceneA={<SharedScene timeOfDay="day" />}
              sceneB={<SharedScene timeOfDay="sunset" />}
            />
          </ViewportCanvas>
        }
        timeline={
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-slate-200">
            <div className="mb-2 flex items-center justify-between text-[11px] tabular-nums text-slate-300">
              <span>낮 {Math.round((1 - mix) * 100)}% · 노을 {Math.round(mix * 100)}%</span>
              <span>{time.toFixed(1)}s / {DISSOLVE_TOTAL_DURATION.toFixed(1)}s</span>
            </div>

            <div className="relative space-y-1.5 py-1">
              {/* Overlap highlight band */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 rounded border border-indigo-400/70 bg-indigo-500/20"
                style={{ left: `${overlapStartPct}%`, width: `${overlapWidthPct}%` }}
              />

              {/* Track A: Day */}
              <div className="relative h-6 w-full rounded bg-slate-900">
                <div
                  className="flex h-full items-center rounded bg-sky-600/85 px-2 text-[11px] font-semibold text-white"
                  style={{ width: `${overlapEndPct}%` }}
                >
                  클립 A · 낮
                </div>
              </div>

              {/* Track B: Sunset */}
              <div className="relative h-6 w-full rounded bg-slate-900">
                <div
                  className="flex h-full items-center justify-end rounded bg-amber-600/85 px-2 text-[11px] font-semibold text-white"
                  style={{ marginLeft: `${overlapStartPct}%`, width: `${100 - overlapStartPct}%` }}
                >
                  클립 B · 노을
                </div>
              </div>

              {/* Playhead */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white"
                style={{ left: `${playheadPct}%` }}
              />
            </div>

            <div className="mt-1.5 text-center text-[11px] text-indigo-200">
              보라 구간: 두 장면 겹침 ({overlap.toFixed(1)}s)
            </div>
          </div>
        }
      />
    </div>
  )
}
