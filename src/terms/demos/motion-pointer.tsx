import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState, type FocusEvent, type PointerEvent, type ReactNode } from 'react'
import { MotionStage } from '@terms/components/stages/MotionStage'
import { useFinePointer } from '@terms/hooks/use-fine-pointer'
import { useMotionPlayback } from '@terms/hooks/use-motion-playback'
import { magneticOffset, tiltAt } from '@terms/lib/motion-pointer-event-math'

gsap.registerPlugin(useGSAP)

function TouchNote({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs leading-relaxed text-slate-600">터치 기기에서는 꺼집니다. {children}</p>
}

function RangeControl({ label, name, value, max, step, text, disabled, onChange }: {
  label: string
  name: string
  value: number
  max: number
  step: number
  text: string
  disabled: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="font-semibold text-slate-600">{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={name}
        aria-valuetext={text}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="w-24 accent-indigo-700 disabled:opacity-50"
      />
      <span className="w-10 tabular-nums text-slate-600">{text}</span>
    </label>
  )
}

type Setter = (value: number) => void

const MAGNET_STEPS = [0, 10, 30]

export function MagneticButtonDemo() {
  const fine = useFinePointer()
  const areaRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const moveRef = useRef<{ x: Setter; y: Setter } | null>(null)
  const [level, setLevel] = useState(1)
  const [pull, setPull] = useState(0)
  const [clicks, setClicks] = useState(0)
  const max = MAGNET_STEPS[level]!

  useGSAP(
    () => {
      if (!fine) return
      const options = { duration: 0.3, ease: 'power3.out' }
      moveRef.current = {
        x: gsap.quickTo(buttonRef.current, 'x', options),
        y: gsap.quickTo(buttonRef.current, 'y', options),
      }
      return () => {
        moveRef.current = null
        setPull(0)
      }
    },
    { scope: areaRef, dependencies: [fine], revertOnUpdate: true },
  )

  function moveTo(x: number, y: number) {
    if (!moveRef.current) return
    moveRef.current.x(x)
    moveRef.current.y(y)
    setPull(Math.round(Math.hypot(x, y)))
  }

  function follow(event: PointerEvent) {
    // 움직이지 않는 바깥 상자를 기준으로 잰다. 버튼을 기준 삼으면 끌린 만큼 다시 계산돼 떨린다.
    const rect = anchorRef.current!.getBoundingClientRect()
    const { x, y } = magneticOffset(
      event.clientX - (rect.left + rect.width / 2),
      event.clientY - (rect.top + rect.height / 2),
      max,
    )
    moveTo(x, y)
  }

  return (
    <MotionStage
      controls={
        <RangeControl label="끌림 최대" name="끌림 최대값" value={level} max={MAGNET_STEPS.length - 1} step={1} text={`${max}px`} disabled={!fine}
          onChange={(next) => { setLevel(next); moveTo(0, 0) }} />
      }
    >
      <div ref={areaRef} data-testid="magnetic-area" onPointerMove={fine ? follow : undefined} onPointerLeave={() => moveTo(0, 0)}
        className="flex h-40 items-center justify-center rounded-md bg-slate-50">
        <div ref={anchorRef}>
          <button
            ref={buttonRef}
            type="button"
            // 키보드 focus에서는 오른쪽 위로 최대값만큼 끌려와 같은 반응을 보여 준다.
            onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) moveTo(max * Math.SQRT1_2, -max * Math.SQRT1_2) }}
            onBlur={() => moveTo(0, 0)}
            onClick={() => setClicks((count) => count + 1)}
            className="rounded-full bg-indigo-700 px-6 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
          >
            무료로 시작하기
          </button>
        </div>
      </div>
      <output className="mt-2 block text-xs tabular-nums text-slate-700">끌려온 거리 {pull}px · 누른 횟수 {clicks}</output>
      {!fine && <TouchNote>마우스를 가까이 가져가면 버튼이 최대 {max}px 끌려오고, 값이 클수록 누르기 어려워집니다.</TouchNote>}
    </MotionStage>
  )
}

export function CustomCursorDemo() {
  const fine = useFinePointer()
  const areaRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null)
  const [visible, setVisible] = useState(false)
  const [onLink, setOnLink] = useState(false)

  useGSAP(
    () => {
      if (!fine) return
      const options = { duration: 0.25, ease: 'power3.out' }
      moveRef.current = {
        x: gsap.quickTo(cursorRef.current, 'x', options),
        y: gsap.quickTo(cursorRef.current, 'y', options),
      }
      return () => {
        moveRef.current = null
        setVisible(false)
        setOnLink(false)
      }
    },
    { scope: areaRef, dependencies: [fine], revertOnUpdate: true },
  )

  /** jump면 따라오는 지연 없이 그 자리에 나타난다. */
  function moveTo(clientX: number, clientY: number, jump: boolean) {
    const move = moveRef.current
    if (!move) return
    const rect = areaRef.current!.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    move.x(x, jump ? x : undefined)
    move.y(y, jump ? y : undefined)
    setVisible(true)
  }

  function follow(event: PointerEvent) {
    moveTo(event.clientX, event.clientY, !visible)
    setOnLink(Boolean((event.target as Element).closest('[data-cursor-link]')))
  }

  function hide() {
    setVisible(false)
    setOnLink(false)
  }

  function focusLink(event: FocusEvent<HTMLButtonElement>) {
    if (!fine || !event.currentTarget.matches(':focus-visible')) return
    const rect = event.currentTarget.getBoundingClientRect()
    moveTo(rect.right, rect.top + rect.height / 2, !visible)
    setOnLink(true)
  }

  return (
    <MotionStage>
      <div ref={areaRef} data-testid="cursor-area" onPointerMove={fine ? follow : undefined} onPointerLeave={hide}
        className="relative h-44 overflow-hidden rounded-md bg-slate-50 p-4">
        <p className="text-sm text-slate-700">이 카드 영역 안에서만 원이 따라옵니다.</p>
        <div className="mt-6 flex flex-wrap gap-8">
          {['작업 보기', '요금 안내'].map((label) => (
            // 화면 이동이 없는 데모라 link 모양의 button을 쓴다.
            <button key={label} type="button" data-cursor-link onFocus={focusLink} onBlur={hide}
              className="text-sm font-semibold text-indigo-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
              {label}
            </button>
          ))}
        </div>
        {/* 기본 커서는 숨기지 않는다. 원은 클릭을 가로채지 않는다. */}
        <div ref={cursorRef} aria-hidden="true" data-testid="custom-cursor" data-visible={visible} data-on-link={onLink}
          className={`pointer-events-none absolute top-0 left-0 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-indigo-700 text-[11px] font-bold text-indigo-900 transition-[width,height] duration-200 ${onLink ? 'size-14 bg-indigo-200/60' : 'size-5 bg-indigo-700/30'}`}>
            {onLink ? '열기' : ''}
          </div>
        </div>
      </div>
      <output className="mt-2 block text-xs text-slate-700">커서: {!visible ? '영역 밖' : onLink ? '링크 위 · 크게' : '기본 크기'}</output>
      {!fine && <TouchNote>마우스를 올리면 작은 원이 살짝 늦게 따라오고, 링크 위에서 커집니다.</TouchNote>}
    </MotionStage>
  )
}

const FLAT = tiltAt(0.5, 0.5, 0)

export function ThreeDTiltDemo() {
  const fine = useFinePointer()
  const areaRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const moveRef = useRef<{ x: Setter; y: Setter } | null>(null)
  const [max, setMax] = useState(10)
  const [glare, setGlare] = useState(true)
  const [tilt, setTilt] = useState(FLAT)
  const [active, setActive] = useState(false)

  useGSAP(
    () => {
      if (!fine) return
      const options = { duration: 0.3, ease: 'power3.out' }
      moveRef.current = {
        x: gsap.quickTo(cardRef.current, 'rotationX', options),
        y: gsap.quickTo(cardRef.current, 'rotationY', options),
      }
      return () => {
        moveRef.current = null
        setActive(false)
        setTilt(FLAT)
      }
    },
    { scope: areaRef, dependencies: [fine], revertOnUpdate: true },
  )

  function apply(next: ReturnType<typeof tiltAt>, on: boolean) {
    if (!moveRef.current) return
    moveRef.current.x(next.rotateX)
    moveRef.current.y(next.rotateY)
    setTilt(next)
    setActive(on)
  }

  function follow(event: PointerEvent) {
    const rect = areaRef.current!.getBoundingClientRect()
    apply(tiltAt((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height, max), true)
  }

  const rest = () => apply(FLAT, false)

  return (
    <MotionStage
      controls={
        <>
          <RangeControl label="최대 기울기" name="최대 기울기" value={max} max={20} step={1} text={`${max}°`} disabled={!fine}
            onChange={(next) => { setMax(next); rest() }} />
          <button type="button" aria-pressed={glare} disabled={!fine} onClick={() => setGlare((value) => !value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs aria-pressed:border-indigo-700 aria-pressed:font-semibold disabled:opacity-50">
            반사광 {glare ? '켬' : '끔'}
          </button>
        </>
      }
    >
      {/* 기울지 않는 영역에서 좌표를 잰다. */}
      <div ref={areaRef} data-testid="tilt-area" onPointerMove={fine ? follow : undefined} onPointerLeave={rest}
        className="mx-auto w-56 py-3 [perspective:600px]">
        <div ref={cardRef} data-testid="tilt-card" className="relative overflow-hidden rounded-xl border border-indigo-300 bg-indigo-950 p-4 text-white shadow-lg">
          <p className="text-xs font-semibold text-indigo-200">Pro 요금제</p>
          <p className="mt-1 text-2xl font-bold">₩12,000<span className="text-xs font-normal"> / 월</span></p>
          <button
            type="button"
            // 키보드 focus에서는 오른쪽 위를 가리킨 것처럼 기운다.
            onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) apply(tiltAt(0.85, 0.15, max), true) }}
            onBlur={rest}
            className="mt-3 w-full rounded-md bg-white py-1.5 text-sm font-semibold text-indigo-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Pro 선택
          </button>
          {glare && active && (
            <span aria-hidden="true" data-testid="tilt-glare" className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgb(255 255 255 / 0.35), transparent 60%)` }} />
          )}
        </div>
      </div>
      <output className="block text-center text-xs tabular-nums text-slate-700">
        rotateX {Math.round(tilt.rotateX)}° · rotateY {Math.round(tilt.rotateY)}°
      </output>
      {!fine && <TouchNote>마우스를 올리면 카드가 커서 쪽으로 최대 {max}° 기울고 반사광이 따라옵니다.</TouchNote>}
    </MotionStage>
  )
}

const CONFETTI_COUNT = 40
const CONFETTI_COLORS = ['bg-indigo-600', 'bg-amber-400', 'bg-rose-500', 'bg-emerald-500', 'bg-sky-500']

export function ConfettiDemo() {
  const { scopeRef, stageProps, replay } = useMotionPlayback((timeline) => {
    // 낙하 1.4초 + stagger 0.6초 = 2초
    const fall = { duration: 1.4, stagger: { amount: 0.6, from: 'random' as const } }
    timeline.fromTo(
      '[data-confetti]',
      { x: 0, y: 0, rotation: 0 },
      {
        x: () => gsap.utils.random(-50, 50),
        y: () => gsap.utils.random(100, 190),
        rotation: () => gsap.utils.random(-540, 540),
        ease: 'power1.in',
        immediateRender: false,
        ...fall,
      },
      0,
    )
    timeline.fromTo('[data-confetti]', { opacity: 1 }, { opacity: 0, ease: 'power4.in', immediateRender: false, ...fall }, 0)
  })
  const started = stageProps.replayLabel === '다시 재생'

  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps}>
        <div className="relative flex h-44 flex-col items-center justify-center gap-2 overflow-hidden rounded-md bg-slate-50">
          <button type="button" onClick={replay}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
            첫 결제 완료
          </button>
          <output className="text-xs text-slate-700">{started ? '첫 결제를 축하합니다!' : '버튼을 눌러 결제를 완료하세요'}</output>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0">
            {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
              <span key={index} data-confetti
                className={`absolute top-0 opacity-0 ${CONFETTI_COLORS[index % CONFETTI_COLORS.length]} ${index % 3 === 0 ? 'size-2 rounded-full' : 'h-3 w-1.5'}`}
                style={{ left: `${((index + 0.5) / CONFETTI_COUNT) * 100}%` }} />
            ))}
          </div>
        </div>
      </MotionStage>
    </div>
  )
}
