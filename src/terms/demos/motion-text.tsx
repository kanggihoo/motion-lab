import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { TextPlugin } from 'gsap/TextPlugin'
import { CheckIcon, MenuIcon, ShoppingCartIcon, XIcon } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { MotionStage } from '@terms/components/stages/MotionStage'
import { useInnerScroller } from '@terms/hooks/use-inner-scroller'
import { useLoopPlayback } from '@terms/hooks/use-loop-playback'
import { useMotionPlayback } from '@terms/hooks/use-motion-playback'
import {
  formatCount,
  SCRAMBLE_CHARSETS,
  typingDuration,
  type ScrambleCharset,
} from '@terms/lib/motion-text-graphic-math'

gsap.registerPlugin(
  useGSAP,
  DrawSVGPlugin,
  MorphSVGPlugin,
  MotionPathPlugin,
  ScrambleTextPlugin,
  ScrollTrigger,
  SplitText,
  TextPlugin,
)

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

function ChoiceGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true" className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </fieldset>
  )
}

const TYPE_SENTENCE = '아이디어를 오늘 바로 배포하세요.'

export function TypewriterDemo() {
  const [cursor, setCursor] = useState(true)
  const [speed, setSpeed] = useState(12)
  const { scopeRef, stageProps, reset } = useMotionPlayback((tl) => {
    tl.fromTo(
      '.type-target',
      { text: '' },
      { text: TYPE_SENTENCE, duration: typingDuration(TYPE_SENTENCE, speed), ease: 'none' },
    )
  })
  // 커서 깜빡임도 움직임이라 재생을 누른 뒤에만 켠다(D-12).
  const blinking = stageProps.replayLabel === '다시 재생'

  return (
    <div ref={scopeRef}>
      <style>{'@keyframes motion-type-blink { 50% { opacity: 0 } }'}</style>
      <MotionStage
        {...stageProps}
        controls={
          <>
            <Choice pressed={cursor} onClick={() => setCursor((value) => !value)}>
              커서 {cursor ? '켜짐' : '꺼짐'}
            </Choice>
            <label className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-600">타이핑 속도</span>
              <input
                type="range"
                min={4}
                max={30}
                step={2}
                value={speed}
                aria-valuetext={`초당 ${speed}자`}
                onChange={(event) => {
                  setSpeed(event.currentTarget.valueAsNumber)
                  reset()
                }}
                className="w-24 accent-indigo-700"
              />
              <span className="tabular-nums text-slate-600">{speed}자/초</span>
            </label>
          </>
        }
      >
        <div className="flex min-h-28 items-center">
          <p className="text-xl leading-snug font-bold text-slate-900">
            <span className="sr-only">{TYPE_SENTENCE}</span>
            <span aria-hidden="true">
              <span className="type-target">{TYPE_SENTENCE}</span>
              {cursor && (
                <span
                  data-testid="type-cursor"
                  className={`ml-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 bg-indigo-700 ${blinking ? 'animate-[motion-type-blink_1s_steps(1)_infinite]' : ''}`}
                />
              )}
            </span>
          </p>
        </div>
      </MotionStage>
    </div>
  )
}

const SCRAMBLE_TITLE = 'SYSTEM ONLINE 2026'

export function TextScrambleDemo() {
  const [charset, setCharset] = useState<ScrambleCharset>('letters')
  const { scopeRef, stageProps, reset } = useMotionPlayback((tl) => {
    tl.to('.scramble-target', {
      duration: 1,
      ease: 'none',
      scrambleText: { text: SCRAMBLE_TITLE, chars: SCRAMBLE_CHARSETS[charset].chars, revealDelay: 0.3 },
    })
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        controls={
          <ChoiceGroup label="섞을 문자">
            {(Object.keys(SCRAMBLE_CHARSETS) as ScrambleCharset[]).map((key) => (
              <Choice key={key} pressed={charset === key} onClick={() => { setCharset(key); reset() }}>
                {SCRAMBLE_CHARSETS[key].label}
              </Choice>
            ))}
          </ChoiceGroup>
        }
      >
        <div className="flex min-h-28 items-center justify-center rounded bg-slate-950 p-3">
          <h5 aria-label={SCRAMBLE_TITLE} className="font-mono text-lg font-bold break-all text-emerald-300">
            <span aria-hidden="true" className="scramble-target">{SCRAMBLE_TITLE}</span>
          </h5>
        </div>
      </MotionStage>
    </div>
  )
}

type SplitUnit = 'chars' | 'words' | 'lines'

const SPLIT_UNITS: { value: SplitUnit; label: string; stagger: number }[] = [
  { value: 'chars', label: '글자', stagger: 0.035 },
  { value: 'words', label: '단어', stagger: 0.12 },
  { value: 'lines', label: '줄', stagger: 0.25 },
]

export function SplitTextDemo() {
  const [unit, setUnit] = useState<SplitUnit>('words')
  const { scopeRef, stageProps, reset } = useMotionPlayback((tl) => {
    const [title] = gsap.utils.toArray<HTMLElement>('.split-target')
    if (!title) return
    // build 안에서 만들어야 재시작·언마운트 때 원래 DOM으로 되돌려진다. 글자 단위도 단어를 감싸 줄바꿈이 깨지지 않게 한다.
    const split = SplitText.create(title, {
      type: unit === 'chars' ? 'words,chars' : unit,
      mask: unit,
      aria: 'auto',
    })
    tl.from(split[unit], {
      yPercent: 100,
      duration: 0.5,
      ease: 'power3.out',
      stagger: SPLIT_UNITS.find(({ value }) => value === unit)!.stagger,
    })
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        controls={
          <ChoiceGroup label="단위">
            {SPLIT_UNITS.map(({ value, label }) => (
              <Choice key={value} pressed={unit === value} onClick={() => { setUnit(value); reset() }}>
                {label}
              </Choice>
            ))}
          </ChoiceGroup>
        }
      >
        <div className="flex min-h-32 items-center justify-center">
          <h5 className="split-target max-w-60 text-center text-2xl leading-snug font-bold break-keep text-slate-900">
            작은 움직임 하나가 첫 문장을 오래 기억하게 만듭니다
          </h5>
        </div>
      </MotionStage>
    </div>
  )
}

const STATS = [
  { label: '가입자', value: 12480 },
  { label: '다운로드', value: 98700 },
  { label: '리뷰', value: 3254 },
]

type CountEase = 'power3.out' | 'none'

export function CountUpDemo() {
  const [ease, setEase] = useState<CountEase>('power3.out')
  const { scopeRef, stageProps, reset } = useMotionPlayback((tl) => {
    for (const element of gsap.utils.toArray<HTMLElement>('.count-value')) {
      const counter = { value: 0 }
      const render = () => { element.textContent = formatCount(counter.value) }
      render()
      tl.to(counter, { value: Number(element.dataset.target), duration: 2, ease, snap: { value: 1 }, onUpdate: render }, 0)
    }
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        controls={
          <ChoiceGroup label="easing">
            <Choice pressed={ease === 'power3.out'} onClick={() => { setEase('power3.out'); reset() }}>ease-out</Choice>
            <Choice pressed={ease === 'none'} onClick={() => { setEase('none'); reset() }}>linear</Choice>
          </ChoiceGroup>
        }
      >
        <dl className="grid grid-cols-3 gap-2 py-4 text-center">
          {STATS.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-slate-600">{label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                <span className="sr-only">{formatCount(value)}</span>
                {/* textContent를 직접 바꾸므로 easing을 바꾸면 새 요소로 갈아 끼워 최종값으로 되돌린다. */}
                <span key={ease} aria-hidden="true" className="count-value" data-target={value}>{formatCount(value)}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-center text-xs text-slate-600">
          {ease === 'none' ? 'linear: 같은 속도로 오르다 갑자기 멈춘다' : 'ease-out: 빠르게 오르고 끝에서 느려진다'}
        </p>
      </MotionStage>
    </div>
  )
}

const CHART_PATH = 'M20 100 L60 78 L100 86 L140 52 L180 62 L220 34 L260 44 L300 14'

function LineChart() {
  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴
    <svg viewBox="0 0 320 120" role="img" aria-label="오른쪽으로 갈수록 오르는 꺾은선 그래프" className="h-32 w-full">
      <path d="M20 8 V108 H308" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d={CHART_PATH} fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 4" />
      <path className="draw-line" d={CHART_PATH} fill="none" stroke="#4338ca" strokeWidth="3.5" />
    </svg>
  )
}

function LineDrawingTime({ controls }: { controls: ReactNode }) {
  const { scopeRef, stageProps } = useMotionPlayback((tl) => {
    tl.fromTo('.draw-line', { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.5, ease: 'none' })
  })
  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps} controls={controls}>
        <LineChart />
        <p className="text-xs text-slate-600">재생을 누르면 1.5초 동안 왼쪽에서 오른쪽으로 그려진다.</p>
      </MotionStage>
    </div>
  )
}

function LineDrawingScrub({ controls }: { controls: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [pct, setPct] = useState(0)
  const { scrollerRef, scrollerProps } = useInnerScroller({ label: 'Line Drawing 내부 스크롤 영역' })

  useGSAP(
    () => {
      const scroller = scrollerRef.current
      const track = trackRef.current
      if (!scroller || !track) return
      gsap.fromTo(
        '.draw-line',
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          ease: 'none',
          scrollTrigger: {
            scroller,
            trigger: track,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            onUpdate: (self) => setPct(Math.round(self.progress * 100)),
          },
        },
      )
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef}>
      <MotionStage controls={controls}>
        <section {...scrollerProps} className={`h-48 ${scrollerProps.className}`}>
          <div ref={trackRef} className="relative h-[480px]">
            <div className="sticky top-0 flex h-48 flex-col justify-center p-2">
              <p className="text-xs font-semibold tabular-nums text-slate-800">스크롤해서 그리기 · 선 {pct}%</p>
              <LineChart />
            </div>
          </div>
        </section>
      </MotionStage>
    </div>
  )
}

export function LineDrawingDemo() {
  const [mode, setMode] = useState<'time' | 'scrub'>('time')
  const controls = (
    <ChoiceGroup label="진행 기준">
      <Choice pressed={mode === 'time'} onClick={() => setMode('time')}>시간 재생</Choice>
      <Choice pressed={mode === 'scrub'} onClick={() => setMode('scrub')}>Scroll Scrub</Choice>
    </ChoiceGroup>
  )
  return mode === 'time' ? <LineDrawingTime controls={controls} /> : <LineDrawingScrub controls={controls} />
}

const BOOKMARK_PATH = 'M6 3 L18 3 L18 21 L12 16 L6 21 Z'
const CHECK_PATH = 'M3 12 L6 9 L10 13 L19 4 L22 7 L10 19 Z'

type MorphTarget = 'menu' | 'save'

export function MorphingDemo() {
  const [state, setState] = useState({ menu: false, save: false })
  const [changed, setChanged] = useState<MorphTarget[]>([])
  const { scopeRef, stageProps } = useMotionPlayback((tl) => {
    // JSX는 항상 처음 모양이다. 방금 바뀐 아이콘만 이전 → 현재로 움직이고 나머지는 현재 모양에 바로 둔다.
    const menuTime = changed.includes('menu') ? 0.4 : 0
    const menuFrom = changed.includes('menu') ? !state.menu : state.menu
    const bar = (open: boolean, y: number, rotation: number) => ({ y: open ? y : 0, rotation: open ? rotation : 0 })
    const origin = { svgOrigin: '12 12' }
    tl.fromTo('.bar-top', { ...bar(menuFrom, 6, 45), ...origin }, { ...bar(state.menu, 6, 45), ...origin, duration: menuTime }, 0)
    tl.fromTo('.bar-bottom', { ...bar(menuFrom, -6, -45), ...origin }, { ...bar(state.menu, -6, -45), ...origin, duration: menuTime }, 0)
    tl.fromTo('.bar-middle', { autoAlpha: menuFrom ? 0 : 1 }, { autoAlpha: state.menu ? 0 : 1, duration: menuTime / 2 }, 0)

    const saveChanged = changed.includes('save')
    const shape = (saved: boolean) => (saved ? CHECK_PATH : BOOKMARK_PATH)
    tl.set('.save-shape', { attr: { d: shape(saveChanged ? !state.save : state.save) } }, 0)
    if (saveChanged) tl.to('.save-shape', { morphSVG: shape(state.save), duration: 0.5, ease: 'power2.inOut' }, 0)
  })

  function change(next: typeof state, targets: MorphTarget[]) {
    setState(next)
    setChanged(targets)
    stageProps.onReplay()
  }

  const buttonClass =
    'flex w-full flex-col items-center gap-1 rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700 aria-expanded:border-indigo-700 aria-expanded:font-semibold aria-pressed:border-indigo-700 aria-pressed:font-semibold'

  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps} onReplay={() => change({ menu: true, save: true }, ['menu', 'save'])}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <p className="text-center text-xs font-semibold text-indigo-800">Morphing</p>
            <button
              type="button"
              aria-expanded={state.menu}
              onClick={() => change({ ...state, menu: !state.menu }, ['menu'])}
              className={buttonClass}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-12" stroke="#4338ca" strokeWidth="2.5" strokeLinecap="round">
                <path className="bar-top" d="M5 6 H19" />
                <path className="bar-middle" d="M5 12 H19" />
                <path className="bar-bottom" d="M5 18 H19" />
              </svg>
              {state.menu ? '메뉴 닫기' : '메뉴 열기'}
            </button>
            <button
              type="button"
              aria-pressed={state.save}
              onClick={() => change({ ...state, save: !state.save }, ['save'])}
              className={buttonClass}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-12" fill="#4338ca">
                <path className="save-shape" d={BOOKMARK_PATH} />
              </svg>
              {state.save ? '저장됨' : '저장'}
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-center text-xs font-semibold text-slate-600">그냥 교체</p>
            <div data-testid="swap-menu" className="flex flex-col items-center gap-1 rounded-md border border-dashed border-slate-300 p-2 text-xs text-slate-600">
              {state.menu ? <XIcon aria-hidden="true" className="size-12" /> : <MenuIcon aria-hidden="true" className="size-12" />}
              {state.menu ? 'X 아이콘' : '☰ 아이콘'}
            </div>
            <div data-testid="swap-save" className="flex flex-col items-center gap-1 rounded-md border border-dashed border-slate-300 p-2 text-xs text-slate-600">
              {state.save ? <CheckIcon aria-hidden="true" className="size-12" /> : (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-12" fill="currentColor"><path d={BOOKMARK_PATH} /></svg>
              )}
              {state.save ? '체크 아이콘' : '저장 아이콘'}
            </div>
          </div>
        </div>
        <p className="mt-2 min-h-5 text-center text-xs text-slate-700">
          {state.menu ? '열린 메뉴: 홈 · 상품 · 문의' : '메뉴 닫힘'}
        </p>
      </MotionStage>
    </div>
  )
}

const BRANDS = ['◆ Acme', '● Orbit', '▲ Summit', '■ Cubic', '★ Nova', '✚ Pulse']

function BrandList({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} aria-label={hidden ? undefined : '고객사'} className="flex shrink-0 gap-3 pr-3">
      {BRANDS.map((brand) => (
        <li key={brand} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold whitespace-nowrap text-slate-700">
          {brand}
        </li>
      ))}
    </ul>
  )
}

export function MarqueeDemo() {
  const { scopeRef, loop, holdProps } = useLoopPlayback((tl) => {
    // 같은 목록 둘을 이어 붙였으므로 절반(-50%)을 지나면 처음 화면과 같아진다.
    tl.to('.marquee-track', { xPercent: -50, duration: 12, ease: 'none', repeat: -1 })
  })

  return (
    <div ref={scopeRef}>
      <MotionStage loop={loop}>
        <section
          {...holdProps}
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 키보드 focus로 흐름을 멈춘다
          tabIndex={0}
          aria-label="고객사 로고 띠. 마우스를 올리거나 focus하면 멈춘다"
          className="my-5 overflow-hidden rounded-md py-2 focus-visible:outline-2 focus-visible:outline-indigo-700"
        >
          <div className="marquee-track flex w-max">
            <BrandList />
            <BrandList hidden />
          </div>
        </section>
        <p className="text-xs text-slate-600">재생 중에도 마우스를 올리거나 Tab으로 focus하면 멈춘다.</p>
      </MotionStage>
    </div>
  )
}

const CART_START = { x: 45, y: 118 }
const CART_PATH = `M${CART_START.x} ${CART_START.y} C 80 10, 220 0, 278 38`

export function MotionPathDemo() {
  const [showPath, setShowPath] = useState(true)
  const { scopeRef, stageProps } = useMotionPlayback((tl) => {
    tl.set('.cart-count', { autoAlpha: 0 }, 0)
    // 이동과 축소를 겹친 두 요소로 나눈다. 같은 요소에 주면 축소 기준점만큼 경로에서 벗어난다.
    tl.to('.cart-thumb', { motionPath: { path: CART_PATH }, duration: 1.1, ease: 'power1.in' }, 0)
    tl.to('.cart-thumb-art', { scale: 0.35, svgOrigin: '0 0', duration: 1.1, ease: 'power1.in' }, 0)
    tl.set('.cart-thumb', { autoAlpha: 0 })
    tl.set('.cart-count', { autoAlpha: 1 })
  })

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        controls={
          <Choice pressed={showPath} onClick={() => setShowPath((value) => !value)}>
            경로선 {showPath ? '켜짐' : '꺼짐'}
          </Choice>
        }
      >
        <div className="relative">
          <svg viewBox="0 0 320 150" aria-hidden="true" className="w-full">
            {showPath && <path data-testid="cart-path" d={CART_PATH} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />}
            <ShoppingCartIcon x={262} y={22} width={32} height={32} color="#334155" />
            <g className="cart-thumb" transform={`translate(${CART_START.x} ${CART_START.y})`}>
              <g className="cart-thumb-art">
                <rect x="-24" y="-24" width="48" height="48" rx="8" fill="#f59e0b" />
                <text textAnchor="middle" dominantBaseline="central" fontSize="24">👟</text>
              </g>
            </g>
            <g className="cart-count" opacity="0">
              <circle cx="296" cy="22" r="9" fill="#4338ca" />
              <text x="296" y="22" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#ffffff">1</text>
            </g>
          </svg>
          <button
            type="button"
            onClick={stageProps.onReplay}
            className="rounded-md border border-indigo-700 bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
          >
            담기
          </button>
        </div>
      </MotionStage>
    </div>
  )
}
