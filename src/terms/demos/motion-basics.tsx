import { BellIcon, ShoppingCartIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { MotionStage } from '@terms/components/stages/MotionStage'
import { useMotionPlayback } from '@terms/hooks/use-motion-playback'

function Choice({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
    >
      {children}
    </button>
  )
}

const FADE_DURATIONS = [0.2, 0.6, 1.2]
/** 열린 상태를 보여 주는 시간 */
const FADE_HOLD = 1

export function FadeDemo() {
  const [duration, setDuration] = useState(0.2)
  const { scopeRef, stageProps, reset } = useMotionPlayback((timeline) => {
    timeline
      .fromTo('.fade-backdrop', { autoAlpha: 0 }, { autoAlpha: 1, duration, ease: 'none' })
      .to('.fade-backdrop', { autoAlpha: 0, duration, ease: 'none' }, `+=${FADE_HOLD}`)
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        controls={FADE_DURATIONS.map((value) => (
          <Choice key={value} pressed={duration === value} onClick={() => { setDuration(value); reset() }}>
            {value}s
          </Choice>
        ))}
      >
        <div className="relative h-36 overflow-hidden rounded-md bg-slate-100">
          <div className="space-y-2 p-3" aria-hidden="true">
            <div className="h-3 w-1/2 rounded bg-slate-300" />
            <div className="h-3 w-5/6 rounded bg-slate-200" />
            <div className="h-3 w-2/3 rounded bg-slate-200" />
            <div className="h-8 w-24 rounded bg-indigo-200" />
          </div>
          <div className="fade-backdrop invisible absolute inset-0 grid place-items-center bg-slate-900/70 opacity-0">
            <div className="rounded-lg bg-white px-5 py-3 text-center text-sm shadow-lg">
              <p className="font-semibold text-slate-900">모달</p>
              <p className="text-xs text-slate-600">배경이 {duration}초 동안 Fade</p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-600">Fade In {duration}s → {FADE_HOLD}초 유지 → Fade Out {duration}s</p>
      </MotionStage>
    </div>
  )
}

type SlideDirection = 'top' | 'bottom' | 'left' | 'right'

const SLIDE_DIRECTIONS: Record<SlideDirection, { label: string; align: string; offset: { xPercent: number; yPercent: number } }> = {
  top: { label: '위', align: 'items-start justify-center', offset: { xPercent: 0, yPercent: -100 } },
  bottom: { label: '아래', align: 'items-end justify-center', offset: { xPercent: 0, yPercent: 100 } },
  left: { label: '왼쪽', align: 'items-center justify-start', offset: { xPercent: -100, yPercent: 0 } },
  right: { label: '오른쪽', align: 'items-center justify-end', offset: { xPercent: 100, yPercent: 0 } },
}
const SLIDE_DURATION = 0.35
const SLIDE_HOLD = 3

export function SlideDemo() {
  const [direction, setDirection] = useState<SlideDirection>('top')
  const [withFade, setWithFade] = useState(false)
  const { scopeRef, stageProps, reset } = useMotionPlayback((timeline) => {
    const { offset } = SLIDE_DIRECTIONS[direction]
    const hidden = withFade ? { ...offset, opacity: 0 } : offset
    timeline
      .fromTo(
        '.slide-layer',
        { ...hidden, visibility: 'visible' },
        { xPercent: 0, yPercent: 0, opacity: 1, duration: SLIDE_DURATION, ease: 'power2.out' },
      )
      .to('.slide-layer', { ...hidden, duration: SLIDE_DURATION, ease: 'power2.in' }, `+=${SLIDE_HOLD}`)
      .set('.slide-layer', { visibility: 'hidden' })
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        controls={
          <>
            <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
              <legend className="sr-only">들어오는 방향</legend>
              {Object.entries(SLIDE_DIRECTIONS).map(([key, { label }]) => (
                <Choice key={key} pressed={direction === key} onClick={() => { setDirection(key as SlideDirection); reset() }}>
                  {label}
                </Choice>
              ))}
            </fieldset>
            <Choice pressed={withFade} onClick={() => { setWithFade(!withFade); reset() }}>
              Fade와 같이: {withFade ? '켬' : '끔'}
            </Choice>
          </>
        }
      >
        <div className="relative h-36 overflow-hidden rounded-md bg-slate-100">
          <p className="absolute inset-0 grid place-items-center text-xs text-slate-500">
            {SLIDE_DIRECTIONS[direction].label}에서 들어와 {SLIDE_HOLD}초 뒤 돌아갑니다
          </p>
          <div className={`slide-layer pointer-events-none invisible absolute inset-0 flex p-2 ${SLIDE_DIRECTIONS[direction].align}`}>
            <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
              <BellIcon aria-hidden="true" className="size-4" />
              새 알림이 도착했습니다
            </div>
          </div>
        </div>
      </MotionStage>
    </div>
  )
}

type ScaleMode = 'scale' | 'pop'
type ScaleOrigin = 'center' | 'top left'

export function ScaleDemo() {
  const [mode, setMode] = useState<ScaleMode>('pop')
  const [origin, setOrigin] = useState<ScaleOrigin>('center')
  const { scopeRef, stageProps, reset } = useMotionPlayback((timeline) => {
    if (mode === 'scale') {
      timeline.fromTo('.scale-badge', { scale: 1 }, { scale: 1.2, duration: 0.4, ease: 'power2.out' })
      return
    }
    timeline
      .fromTo('.scale-badge', { scale: 1 }, { scale: 1.2, duration: 0.18, ease: 'power2.out' })
      .to('.scale-badge', { scale: 1, duration: 0.32, ease: 'back.out(3)' })
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        controls={
          <>
            <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
              <legend className="sr-only">크기 변화 방식</legend>
              <Choice pressed={mode === 'scale'} onClick={() => { setMode('scale'); reset() }}>scale만</Choice>
              <Choice pressed={mode === 'pop'} onClick={() => { setMode('pop'); reset() }}>pop</Choice>
            </fieldset>
            <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
              <legend className="sr-only">중심점(transform-origin)</legend>
              <Choice pressed={origin === 'center'} onClick={() => { setOrigin('center'); reset() }}>중심: 가운데</Choice>
              <Choice pressed={origin === 'top left'} onClick={() => { setOrigin('top left'); reset() }}>중심: 왼쪽 위</Choice>
            </fieldset>
          </>
        }
      >
        <div className="grid h-36 place-items-center rounded-md bg-slate-100">
          <div className="relative">
            <ShoppingCartIcon aria-hidden="true" className="size-14 text-slate-700" />
            <div className="absolute -top-5 -right-6 size-10">
              <span
                data-testid="scale-badge"
                className="scale-badge absolute inset-0 flex items-end justify-center rounded-full bg-rose-600 pb-0.5 text-sm leading-none font-bold text-white"
                style={{ transformOrigin: origin }}
              >
                3
              </span>
              {/* 원래 크기 윤곽선. 커진 배지 위에 보여야 한다. */}
              <span aria-hidden="true" className="absolute inset-0 rounded-full border border-dashed border-slate-900" />
              <span
                aria-hidden="true"
                className={`absolute z-10 size-2 -translate-1/2 rounded-full border border-slate-900 bg-yellow-300 ${origin === 'center' ? 'top-1/2 left-1/2' : 'top-0 left-0'}`}
              />
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          {mode === 'scale' ? 'scale만: 1 → 1.2에서 멈춤' : 'pop: 1 → 1.2 → 1로 돌아옴'} · 노란 점이 중심점, 점선이 원래 크기
        </p>
      </MotionStage>
    </div>
  )
}
