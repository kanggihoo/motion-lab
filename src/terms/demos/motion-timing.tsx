import gsap from 'gsap'
import { CheckIcon, CloudIcon, MoonIcon, RocketIcon, StarIcon, SunIcon } from 'lucide-react'
import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { MotionStage } from '@terms/components/stages/MotionStage'
import { useLoopPlayback } from '@terms/hooks/use-loop-playback'
import { useMotionPlayback } from '@terms/hooks/use-motion-playback'
import {
  BOUNCE_STEPS,
  EASES,
  MAX_VELOCITY,
  OVERLAP_STEP,
  TIMELINE_AXIS,
  TIMELINE_CLIPS,
  overlapLabel,
  positionParam,
  snapOverlap,
  springDuration,
  springEase,
  springOvershoot,
  springValue,
  timelineStarts,
  type SpringConfig,
} from '@terms/lib/motion-timing-sequence-math'

/** 낙하 뒤 두 번 튀는 구간을 차례로 잇는다. */
function dropWithTwoBounces(timeline: gsap.core.Timeline) {
  BOUNCE_STEPS.forEach(({ height, duration, ease }, i) => {
    const to = { y: -DROP * height, duration, ease }
    if (i === 0) timeline.fromTo('.bounce-check', { y: -DROP }, to, 0)
    else timeline.to('.bounce-check', to, '>')
  })
}

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

function Slider({ label, value, min, max, step, unit = '', onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="font-semibold text-slate-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={`${value}${unit}`}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="w-24 accent-indigo-700"
      />
      <span className="min-w-9 tabular-nums text-slate-600">{value}{unit}</span>
    </label>
  )
}

const EASING_DURATION = 1.4
/** 속도 곡선 좌표(viewBox 100×40) */
const velocityX = (t: number) => 4 + t * 92
const velocityY = (velocity: number) => 36 - (velocity / MAX_VELOCITY) * 32
const VELOCITY_PATHS = EASES.map(({ velocity }) =>
  Array.from({ length: 41 }, (_, i) => `${i === 0 ? 'M' : 'L'}${velocityX(i / 40)} ${velocityY(velocity(i / 40))}`).join(' '),
)

export function EasingDemo() {
  const { scopeRef, stageProps, speed } = useMotionPlayback((timeline) => {
    for (const { kind, gsapEase } of EASES) {
      timeline.fromTo(`.ease-mover-${kind}`, { xPercent: 0 }, { xPercent: 100, duration: EASING_DURATION, ease: gsapEase }, 0)
    }
    const dots = gsap.utils.toArray<SVGCircleElement>('.ease-dot')
    const clock = { t: 0 }
    const place = () => {
      dots.forEach((dot, i) => {
        dot.setAttribute('cx', String(velocityX(clock.t)))
        dot.setAttribute('cy', String(velocityY(EASES[i]!.velocity(clock.t))))
      })
    }
    place()
    timeline.to(clock, { t: 1, duration: EASING_DURATION, ease: 'none', onUpdate: place }, 0)
  })

  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps} speed={speed}>
        <ul className="space-y-2">
          {EASES.map(({ kind, gsapEase, note, velocity }, i) => (
            <li key={kind} className="grid grid-cols-[1fr_6.5rem] items-center gap-3">
              <div className="min-w-0">
                <p className="text-xs">
                  <strong>{kind}</strong> <span className="text-slate-600">{note} · <code>{gsapEase}</code></span>
                </p>
                <div className="mt-1 rounded-full bg-slate-100">
                  <div className={`ease-mover-${kind} w-[calc(100%-1.25rem)]`}>
                    <div className="size-5 rounded-full bg-indigo-600" />
                  </div>
                </div>
              </div>
              {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
              <svg viewBox="0 0 100 40" role="img" aria-label={`${kind} 속도 곡선: ${note}`} className="h-11 w-full">
                <path d="M4 36H96M4 36V4" fill="none" stroke="#cbd5e1" />
                <path d={VELOCITY_PATHS[i]} fill="none" stroke="#475569" strokeWidth="1.5" />
                <circle className="ease-dot" cx={velocityX(0)} cy={velocityY(velocity(0))} r="3.5" fill="#f97316" stroke="#0f172a" />
              </svg>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-right text-[11px] text-slate-600">그래프: 가로 = 시간, 세로 = 속도</p>
      </MotionStage>
    </div>
  )
}

const SPRING_SCALE = 0.35
/** 그래프 세로축은 0 ~ 2(목표 = 1) */
const springGraphY = (value: number) => 76 - value * 36

function springPath(config: SpringConfig) {
  const duration = springDuration(config)
  return Array.from({ length: 121 }, (_, i) => {
    const p = i / 120
    return `${i === 0 ? 'M' : 'L'}${(8 + p * 224).toFixed(1)} ${springGraphY(springValue(config, p * duration)).toFixed(1)}`
  }).join(' ')
}

export function SpringDemo() {
  const [config, setConfig] = useState<SpringConfig>({ stiffness: 180, damping: 14 })
  const duration = springDuration(config)
  const overshoot = Math.round(springOvershoot(config) * 100)
  const { scopeRef, stageProps, speed, reset, replay } = useMotionPlayback((timeline) => {
    timeline
      .fromTo('.spring-card', { scale: 1 }, { scale: 1 + SPRING_SCALE, duration, ease: springEase(config) }, 0)
      .fromTo('.spring-cursor', { attr: { x1: 8, x2: 8 } }, { attr: { x1: 232, x2: 232 }, duration, ease: 'none' }, 0)
  })

  function change(next: Partial<SpringConfig>) {
    setConfig({ ...config, ...next })
    reset()
  }

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        speed={speed}
        controls={
          <>
            <Slider label="stiffness" min={50} max={400} step={10} value={config.stiffness} onChange={(stiffness) => change({ stiffness })} />
            <Slider label="damping" min={5} max={40} step={1} value={config.damping} onChange={(damping) => change({ damping })} />
          </>
        }
      >
        <div className="grid h-24 place-items-center">
          <button
            type="button"
            onClick={replay}
            className="spring-card rounded-xl border border-indigo-300 bg-indigo-100 px-5 py-3 text-sm font-semibold text-indigo-950 focus-visible:outline-2 focus-visible:outline-indigo-700"
          >
            카드 누르기
          </button>
        </div>
        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
        <svg viewBox="0 0 240 80" role="img" aria-label="시간에 따른 spring 값 그래프. 점선이 목표선" className="mt-1 h-24 w-full">
          <line x1="8" x2="232" y1={springGraphY(1)} y2={springGraphY(1)} stroke="#0f172a" strokeDasharray="4 3" />
          <text x="232" y={springGraphY(1) - 3} textAnchor="end" fontSize="8" fill="#0f172a">목표</text>
          <path d="M8 76H232" stroke="#cbd5e1" />
          <path d={springPath(config)} fill="none" stroke="#4f46e5" strokeWidth="2" />
          <line className="spring-cursor" x1="8" x2="8" y1="4" y2="76" stroke="#f97316" strokeWidth="1.5" />
        </svg>
        <p className="text-xs text-slate-600">
          <strong>{overshoot > 0 ? `목표를 ${overshoot}% 지나쳤다 돌아옴` : '목표를 지나치지 않음'}</strong> · 가로축 0 ~ {duration.toFixed(2)}초
        </p>
      </MotionStage>
    </div>
  )
}

const DROP = 72
const COMPARE_SPRING: SpringConfig = { stiffness: 180, damping: 12 }

export function BounceDemo() {
  const { scopeRef, stageProps, speed } = useMotionPlayback((timeline) => {
    dropWithTwoBounces(timeline)
    timeline.fromTo(
      '.spring-check',
      { y: -DROP },
      { y: 0, duration: springDuration(COMPARE_SPRING), ease: springEase(COMPARE_SPRING) },
      0,
    )
  })

  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps} speed={speed}>
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          {[
            { id: 'bounce', name: 'Bounce', line: '바닥', lineClass: 'border-t-4 border-solid', note: '바닥에 부딪혀 두 번 튄다. 선 아래로 내려가지 않는다' },
            { id: 'spring', name: 'Spring', line: '목표선', lineClass: 'border-t-2 border-dashed', note: '목표선을 지나쳤다가 돌아온다' },
          ].map(({ id, name, line, lineClass, note }) => (
            <figure key={id} className="min-w-0">
              <div className="relative h-36 rounded-md bg-slate-50">
                <div className={`${id}-check absolute top-[5rem] left-1/2 -ml-4 grid size-8 place-items-center rounded-full bg-emerald-600 text-white`}>
                  <CheckIcon aria-hidden="true" className="size-5" />
                </div>
                <div className={`absolute inset-x-2 top-28 border-slate-700 ${lineClass}`} />
                <span className="absolute top-[7.5rem] right-2 text-[11px] text-slate-700">{line}</span>
              </div>
              <figcaption className="mt-1.5">
                <strong>{name}</strong>
                <span className="block text-slate-600">{note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </MotionStage>
    </div>
  )
}

const DELAY_ROWS = [
  { id: 'title', label: '제목', delay: 0, duration: 0.4 },
  { id: 'description', label: '설명', delay: 0.2, duration: 0.4 },
]
const STRIPES = 'repeating-linear-gradient(45deg, #fbbf24 0 3px, #fffbeb 3px 7px)'

export function DurationDelayDemo() {
  const { scopeRef, stageProps, speed } = useMotionPlayback((timeline) => {
    for (const { id, delay, duration } of DELAY_ROWS) {
      timeline.fromTo(`.delay-${id}`, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration, delay }, 0)
    }
    timeline.fromTo('.delay-playhead', { left: '0%' }, { left: '100%', duration: 1, ease: 'none' }, 0)
  })

  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps} speed={speed}>
        <div className="min-h-16">
          <p className="delay-title text-lg font-bold">주문이 완료됐어요</p>
          <p className="delay-description text-sm text-slate-600">배송이 시작되면 알려 드릴게요.</p>
        </div>
        <div className="mt-3 grid grid-cols-[2.5rem_1fr] gap-x-2 text-xs">
          <div className="space-y-1.5">
            {DELAY_ROWS.map(({ id, label }) => <p key={id} className="h-6 leading-6 font-semibold">{label}</p>)}
          </div>
          <div className="relative space-y-1.5">
            {DELAY_ROWS.map(({ id, delay, duration }) => (
              <div key={id} className="relative h-6 rounded bg-slate-100">
                {delay > 0 && (
                  <div className="absolute inset-y-0 left-0 grid place-items-center rounded-l border border-amber-600" style={{ width: `${delay * 100}%`, backgroundImage: STRIPES }}>
                    <span className="rounded bg-white/90 px-0.5 text-center text-[10px] leading-none">delay {delay}s</span>
                  </div>
                )}
                <div className="absolute inset-y-0 grid place-items-center rounded-r bg-indigo-700 text-[10px] text-white" style={{ left: `${delay * 100}%`, width: `${duration * 100}%` }}>
                  duration {duration}s
                </div>
              </div>
            ))}
            <div aria-hidden="true" className="delay-playhead absolute inset-y-0 left-0 w-0.5 bg-slate-900" />
          </div>
          <div />
          <div className="flex justify-between text-[11px] text-slate-600"><span>0초</span><span>0.5초</span><span>1초</span></div>
        </div>
        <p className="mt-2 text-[11px] text-slate-600">빗금 = delay(기다림) · 단색 = duration(움직임)</p>
      </MotionStage>
    </div>
  )
}

type StaggerFrom = 'start' | 'center' | 'random'

const STAGGER_ORDERS: { value: StaggerFrom; label: string }[] = [
  { value: 'start', label: '처음부터' },
  { value: 'center', label: '가운데부터' },
  { value: 'random', label: '무작위' },
]

export function StaggerDemo() {
  const [each, setEach] = useState(0.1)
  const [from, setFrom] = useState<StaggerFrom>('start')
  const { scopeRef, stageProps, speed, reset } = useMotionPlayback((timeline) => {
    timeline.fromTo('.stagger-card', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: { each, from } })
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        speed={speed}
        controls={
          <>
            <Slider label="간격" unit="초" min={0} max={0.3} step={0.05} value={each} onChange={(value) => { setEach(value); reset() }} />
            <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
              <legend className="sr-only">등장 순서</legend>
              {STAGGER_ORDERS.map(({ value, label }) => (
                <Choice key={value} pressed={from === value} onClick={() => { setFrom(value); reset() }}>{label}</Choice>
              ))}
            </fieldset>
          </>
        }
      >
        <ol className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <li key={n} className="stagger-card rounded-lg border border-indigo-200 bg-indigo-50 p-2">
              <p className="text-xs font-semibold">카드 {n}</p>
              <div className="mt-2 h-2 w-4/5 rounded bg-indigo-200" />
              <div className="mt-1 h-2 w-1/2 rounded bg-indigo-200" />
            </li>
          ))}
        </ol>
      </MotionStage>
    </div>
  )
}

const LOOP_ICONS = [CloudIcon, StarIcon, RocketIcon, SunIcon, MoonIcon]
/** 한 주기 4초 = 올라가기 2초 + 내려오기 2초 */
const LOOP_HALF = 2

export function LoopDemo() {
  const [count, setCount] = useState<1 | 5>(1)
  const [rate, setRate] = useState(1)
  const { scopeRef, timelineRef, loop } = useLoopPlayback(
    (timeline) => {
      timeline.to('.loop-float', {
        y: -14,
        duration: LOOP_HALF,
        ease: 'sine.inOut',
        stagger: { each: 0.45, repeat: -1, yoyo: true },
      })
      timeline.timeScale(rate)
    },
    { dependencies: [count] },
  )

  return (
    <div ref={scopeRef}>
      <MotionStage
        loop={loop}
        speed={{ rate, onChange: (next) => { setRate(next); timelineRef.current?.timeScale(next) } }}
        controls={
          <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend className="sr-only">동시에 움직이는 개수</legend>
            <Choice pressed={count === 1} onClick={() => setCount(1)}>한 개만</Choice>
            <Choice pressed={count === 5} onClick={() => setCount(5)}>다섯 개 동시</Choice>
          </fieldset>
        }
      >
        <div className="flex h-32 items-center justify-around rounded-md bg-sky-50">
          {(count === 1 ? [RocketIcon] : LOOP_ICONS).map((Icon, i) => (
            <div key={`${count}-${i}`} className="loop-float" data-testid="loop-float">
              <Icon aria-hidden="true" className={`${count === 1 ? 'size-16' : 'size-10'} text-indigo-700`} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-600">
          히어로 일러스트 {count}개 · 한 주기 {LOOP_HALF * 2}초(1× 기준) · {loop.running ? '반복 중' : '멈춤'}
        </p>
      </MotionStage>
    </div>
  )
}

const KEYFRAME_DURATION = 1.6

export function KeyframeDemo() {
  const [middle, setMiddle] = useState(60)
  const { scopeRef, stageProps, speed, reset } = useMotionPlayback((timeline) => {
    timeline
      .to('.keyframe-badge', {
        keyframes: { '0%': { scale: 0 }, [`${middle}%`]: { scale: 1.2 }, '100%': { scale: 1 }, easeEach: 'power1.inOut' },
        duration: KEYFRAME_DURATION,
        ease: 'none',
      }, 0)
      .fromTo('.transition-badge', { scale: 0 }, { scale: 1, duration: KEYFRAME_DURATION, ease: 'power1.inOut' }, 0)
      .fromTo('.keyframe-playhead', { left: '0%' }, { left: '100%', duration: KEYFRAME_DURATION, ease: 'none' }, 0)
  })

  const points = [
    { at: 0, scale: 0, align: '' },
    { at: middle, scale: 1.2, align: '-translate-x-1/2' },
    { at: 100, scale: 1, align: '-translate-x-full' },
  ]

  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps} speed={speed}>
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          {[
            { id: 'keyframe', name: 'Keyframe', note: `0 → 1.2(${middle}%) → 1` },
            { id: 'transition', name: 'Transition', note: '0 → 1 (두 상태만)' },
          ].map(({ id, name, note }) => (
            <figure key={id}>
              <div className="relative mx-auto grid size-24 place-items-center">
                {/* 점선 = scale 1.2 크기 */}
                <span aria-hidden="true" className="absolute size-[4.8rem] rounded-full border border-dashed border-slate-400" />
                <span className={`${id}-badge grid size-16 place-items-center rounded-full bg-rose-600 text-sm font-bold text-white`}>NEW</span>
              </div>
              <figcaption><strong>{name}</strong><span className="block text-slate-600">{note}</span></figcaption>
            </figure>
          ))}
        </div>

        <div className="mx-1 mt-4">
          <div className="relative h-3 rounded-full bg-slate-200">
            {points.map(({ at }, i) => (
              <span key={i} aria-hidden="true" className="absolute top-1/2 size-3.5 -translate-1/2 rotate-45 border-2 border-white bg-indigo-700" style={{ left: `${at}%` }} />
            ))}
            <span aria-hidden="true" className="keyframe-playhead absolute -inset-y-1 left-0 w-0.5 bg-slate-900" />
          </div>
          <ol className="relative mt-2 h-8 text-[11px] leading-tight tabular-nums">
            {points.map(({ at, scale, align }, i) => (
              <li key={i} className={`absolute whitespace-nowrap ${align} ${i === 1 ? 'top-4 font-semibold' : 'top-0'}`} style={{ left: `${at}%` }}>
                {at}% · scale {scale}
              </li>
            ))}
          </ol>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={middle}
            aria-label="중간 keyframe 위치"
            aria-valuetext={`${middle}%`}
            onChange={(event) => {
              // 0%·100% keyframe과 겹치지 않게 한다. 막대와 손잡이 좌표는 0~100 그대로 맞춘다.
              setMiddle(Math.min(90, Math.max(10, event.currentTarget.valueAsNumber)))
              reset()
            }}
            className="mt-2 w-full accent-indigo-700"
          />
          <p className="text-[11px] text-slate-600">손잡이를 끌어 scale 1.2 지점(10~90%)을 옮깁니다</p>
        </div>
      </MotionStage>
    </div>
  )
}

type TrackId = 'subtitle' | 'button'

const TRACKS = [
  { id: 'title', label: '제목', color: 'bg-indigo-700' },
  { id: 'subtitle', label: '부제', color: 'bg-sky-700' },
  { id: 'button', label: '버튼', color: 'bg-emerald-700' },
] as const

export function TimelineDemo() {
  const [overlaps, setOverlaps] = useState<Record<TrackId, number>>({ subtitle: 0.15, button: 0 })
  const [progress, setProgress] = useState(0)
  const dragRef = useRef<{ id: TrackId; x: number; overlap: number; width: number; last: number } | null>(null)
  const starts = timelineStarts(overlaps.subtitle, overlaps.button)
  const time = progress * starts.end

  const { scopeRef, timelineRef, stageProps, speed, replay, seek } = useMotionPlayback((timeline) => {
    const from = { autoAlpha: 0, y: 14 }
    const to = { autoAlpha: 1, y: 0 }
    setProgress(0)
    timeline
      .fromTo('.tl-title', from, { ...to, duration: TIMELINE_CLIPS.title })
      .fromTo('.tl-subtitle', from, { ...to, duration: TIMELINE_CLIPS.subtitle }, positionParam(overlaps.subtitle))
      .fromTo('.tl-button', from, { ...to, duration: TIMELINE_CLIPS.button }, positionParam(overlaps.button))
    timeline.eventCallback('onUpdate', () => setProgress(timeline.progress()))
  })

  /** 겹침을 바꾸면 바로 처음부터 재생한다. */
  function applyOverlap(id: TrackId, value: number) {
    setOverlaps((current) => ({ ...current, [id]: value }))
    replay()
  }

  function dragStart(id: TrackId, event: PointerEvent<HTMLButtonElement>) {
    const width = event.currentTarget.parentElement?.getBoundingClientRect().width ?? 0
    if (!width) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = { id, x: event.clientX, overlap: overlaps[id], width, last: overlaps[id] }
  }

  function dragMove(event: PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    // 오른쪽으로 끌면 늦게 시작한다 = 겹침이 준다.
    const next = snapOverlap(drag.overlap - ((event.clientX - drag.x) / drag.width) * TIMELINE_AXIS)
    if (next === drag.last) return
    drag.last = next
    applyOverlap(drag.id, next)
  }

  function dragEnd() {
    dragRef.current = null
  }

  function keyMove(id: TrackId, event: KeyboardEvent) {
    const direction = event.key === 'ArrowLeft' ? 1 : event.key === 'ArrowRight' ? -1 : 0
    if (!direction) return
    event.preventDefault()
    const next = snapOverlap(overlaps[id] + direction * OVERLAP_STEP)
    if (next !== overlaps[id]) applyOverlap(id, next)
  }

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        speed={{
          rate: speed.rate,
          onChange: (rate) => {
            // 양수 timeScale을 넣으면 방향이 앞으로 바뀌므로, 되감는 중이면 방향을 다시 건다.
            const reversed = timelineRef.current?.reversed()
            speed.onChange(rate)
            if (reversed) timelineRef.current?.reversed(true)
          },
        }}
        controls={
          <button
            type="button"
            disabled={progress === 0}
            onClick={() => timelineRef.current?.reverse().resume()}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-50"
          >
            되감기 <code>reverse()</code>
          </button>
        }
      >
        <div className="flex min-h-24 flex-col items-center justify-center gap-1">
          <p className="tl-title text-lg font-bold">새 컬렉션</p>
          <p className="tl-subtitle text-sm text-slate-600">이번 주에만 만나 보세요</p>
          <span className="tl-button rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white">둘러보기</span>
        </div>

        <div className="mt-3 grid grid-cols-[2.5rem_1fr] gap-x-2 text-xs">
          <div className="space-y-1.5">
            {TRACKS.map(({ id, label }) => <p key={id} className="h-7 leading-7 font-semibold">{label}</p>)}
          </div>
          <div className="relative space-y-1.5">
            {TRACKS.map(({ id, label, color }) => {
              const style = { left: `${(starts[id] / TIMELINE_AXIS) * 100}%`, width: `${(TIMELINE_CLIPS[id] / TIMELINE_AXIS) * 100}%` }
              const start = `${starts[id].toFixed(2)}s`
              return (
                <div key={id} className="relative h-7 rounded bg-slate-100">
                  {id === 'title' ? (
                    <div className={`absolute inset-y-0 grid place-items-center rounded text-[10px] text-white tabular-nums ${color}`} style={style}>{start}</div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`${label} 막대: ${overlapLabel(overlaps[id])}. 좌우 화살표로 옮기기`}
                      onPointerDown={(event) => dragStart(id, event)}
                      onPointerMove={dragMove}
                      onPointerUp={dragEnd}
                      onPointerCancel={dragEnd}
                      onKeyDown={(event) => keyMove(id, event)}
                      className={`absolute inset-y-0 cursor-ew-resize touch-none overflow-hidden whitespace-nowrap rounded border-x-2 border-white/70 text-[10px] text-white tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-900 ${color}`}
                      style={style}
                    >
                      ↔ {start}
                    </button>
                  )}
                </div>
              )
            })}
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 bg-orange-600" style={{ left: `${(time / TIMELINE_AXIS) * 100}%` }} />
          </div>
          <div />
          <div className="flex justify-between text-[11px] text-slate-600"><span>0초</span><span>1초</span><span>2초</span></div>
        </div>

        <p className="mt-2 text-xs text-slate-600">
          부제: <strong>{overlapLabel(overlaps.subtitle)}</strong> · 버튼: <strong>{overlapLabel(overlaps.button)}</strong> · 파란·초록 막대를 끌어 바꿉니다(막대의 숫자는 시작 시각)
        </p>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600">스크러버</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(progress * 100)}
            aria-label="타임라인 스크러버"
            aria-valuetext={`${time.toFixed(2)}초`}
            onChange={(event) => {
              const next = event.currentTarget.valueAsNumber / 100
              setProgress(next)
              seek(next)
            }}
            className="min-w-0 flex-1 accent-indigo-700"
          />
          <span className="w-24 text-right tabular-nums text-slate-600">{time.toFixed(2)} / {starts.end.toFixed(2)}s</span>
        </label>
      </MotionStage>
    </div>
  )
}
