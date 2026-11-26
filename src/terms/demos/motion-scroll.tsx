import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, useState, type ReactNode } from 'react'
import { MotionStage } from '@terms/components/stages/MotionStage'
import { useInnerScroller } from '@terms/hooks/use-inner-scroller'
import {
  PIN_DISTANCE,
  horizontalShift,
  isSnapAligned,
  parallaxShift,
  pinStateAt,
  storyStepAt,
  type PinPhase,
} from '@terms/lib/motion-scroll-math'

gsap.registerPlugin(useGSAP, ScrollTrigger)

type ScrubOption = 0 | 0.5 | 2

const SCRUB_OPTIONS: { value: ScrubOption; label: string }[] = [
  { value: 0, label: '0 (즉시)' },
  { value: 0.5, label: '0.5' },
  { value: 2, label: '2 (관성)' },
]

export function ScrollScrubDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const shapeRef = useRef<SVGGElement>(null)
  const fillRef = useRef<SVGRectElement>(null)
  const markerRef = useRef<SVGLineElement>(null)

  const [scrub, setScrub] = useState<ScrubOption>(0.5)
  const [scrollPct, setScrollPct] = useState(0)
  const [animPct, setAnimPct] = useState(0)

  const { scrollerRef, scrollerProps } = useInnerScroller({
    label: 'Scroll Scrub 내부 스크롤 영역',
    onScroll: (ratio) => {
      setScrollPct(Math.round(ratio * 100))
      if (markerRef.current) {
        const x = String(32 + ratio * 256)
        markerRef.current.setAttribute('x1', x)
        markerRef.current.setAttribute('x2', x)
      }
    },
  })

  useGSAP(
    () => {
      const scroller = scrollerRef.current
      const track = trackRef.current
      const shape = shapeRef.current
      const fill = fillRef.current
      if (!scroller || !track || !shape || !fill) return

      gsap.set(shape, { x: 0, rotation: 0, scale: 0.85, transformOrigin: '50% 50%' })
      gsap.set(fill, { attr: { width: 0 } })

      const tl = gsap.timeline({
        scrollTrigger: {
          scroller,
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: scrub === 0 ? true : scrub,
          onUpdate: (self) => {
            setAnimPct(Math.round(self.animation ? self.animation.progress() * 100 : self.progress * 100))
          },
        },
      })

      tl.to(shape, { x: 220, rotation: 180, scale: 1.25, ease: 'none' }, 0)
      tl.to(fill, { attr: { width: 256 }, ease: 'none' }, 0)
    },
    { scope: rootRef, dependencies: [scrub], revertOnUpdate: true },
  )

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
          <legend className="sr-only">scrub 값 선택</legend>
          <span className="mr-1 text-xs font-semibold text-slate-600">scrub:</span>
          {SCRUB_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={scrub === option.value}
              onClick={() => setScrub(option.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
            >
              {option.label}
            </button>
          ))}
        </fieldset>
      </div>

      {/* D-8, D-12 #3: 내부 스크롤러. 키보드로 스크롤할 수 있고 Tab으로 바로 빠져나간다 */}
      <section {...scrollerProps} className={`h-56 ${scrollerProps.className}`}>
        <div ref={trackRef} className="relative h-[540px]">
          <div className="sticky top-0 flex h-56 flex-col justify-between p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">이 영역을 위아래로 스크롤하세요</span>
              <span className="tabular-nums font-semibold text-slate-800">
                스크롤 {scrollPct}% · 애니메이션 {animPct}%
              </span>
            </div>

            {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
            <svg viewBox="0 0 320 110" role="img" aria-label="스크롤 진행률에 따른 도형 변화" className="h-28 w-full">
              {/* Track rail */}
              <rect x="32" y="78" width="256" height="8" rx="4" fill="#e2e8f0" />
              <rect ref={fillRef} x="32" y="78" width="0" height="8" rx="4" fill="#4338ca" />

              {/* Ticks */}
              <text x="32" y="102" fontSize="10" fill="#64748b" textAnchor="middle">0%</text>
              <text x="160" y="102" fontSize="10" fill="#64748b" textAnchor="middle">50%</text>
              <text x="288" y="102" fontSize="10" fill="#64748b" textAnchor="middle">100%</text>

              {/* Raw scroll marker */}
              <line ref={markerRef} x1="32" y1="70" x2="32" y2="92" stroke="#f97316" strokeWidth="2.5" />

              {/* GSAP animated shape */}
              <g ref={shapeRef}>
                <rect x="36" y="24" width="28" height="28" rx="6" fill="#4f46e5" />
                <circle cx="50" cy="38" r="4.5" fill="#ffffff" />
              </g>
            </svg>

            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>주황 선: 실제 스크롤 위치</span>
              <span>보라 막대·도형: GSAP scrub 진행률</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
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

function Status({ hint = '이 영역을 위아래로 스크롤하세요', children }: { hint?: string; children: ReactNode }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="text-slate-600">{hint}</span>
      <output className="font-semibold tabular-nums text-slate-800">{children}</output>
    </div>
  )
}

const FEATURES = [
  { title: '① 빠른 검색', body: '입력하는 동안 결과가 좁혀집니다.' },
  { title: '② 자동 저장', body: '작성 중인 내용을 잃지 않습니다.' },
  { title: '③ 팀 공유', body: '링크 하나로 함께 편집합니다.' },
]

type RevealMode = 'once' | 'reverse'

export function ScrollRevealDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<RevealMode>('once')
  const { scrollerRef, scrollerProps } = useInnerScroller({ label: 'Scroll Reveal 내부 스크롤 영역' })

  useGSAP(
    () => {
      const scroller = scrollerRef.current
      if (!scroller) return
      for (const item of gsap.utils.toArray<HTMLElement>('[data-reveal]')) {
        // visibility는 건드리지 않는다. 숨은 상태에서도 스크린리더는 내용을 읽는다.
        gsap.fromTo(
          item,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
            scrollTrigger: {
              scroller,
              trigger: item.parentElement,
              start: 'top 85%',
              end: 'bottom 15%',
              toggleActions: mode === 'once' ? 'play none none none' : 'play reverse play reverse',
            },
          },
        )
      }
    },
    { scope: rootRef, dependencies: [mode], revertOnUpdate: true },
  )

  return (
    <div ref={rootRef}>
      <MotionStage
        controls={
          <>
            <Choice pressed={mode === 'once'} onClick={() => setMode('once')}>한 번만</Choice>
            <Choice pressed={mode === 'reverse'} onClick={() => setMode('reverse')}>나갈 때 되돌림</Choice>
          </>
        }
      >
        <Status>{mode === 'once' ? '한 번 나타나면 그대로' : '화면에서 나가면 다시 숨김'}</Status>
        <section {...scrollerProps} className={`h-56 ${scrollerProps.className}`}>
          <div className="flex h-56 items-center justify-center text-xs text-slate-600">↓ 기능 섹션 3개가 아래에 있습니다</div>
          {FEATURES.map((feature) => (
            // 움직이지 않는 바깥 상자가 trigger다. y로 움직이는 요소를 기준 삼으면 시작 위치가 흔들린다.
            <div key={feature.title} className="px-3 py-3">
              <div data-reveal className="h-24 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                <p className="text-sm font-semibold text-indigo-950">{feature.title}</p>
                <p className="mt-1 text-xs text-slate-700">{feature.body}</p>
              </div>
            </div>
          ))}
          <div className="h-40" />
        </section>
      </MotionStage>
    </div>
  )
}

const PIN_PHASE_LABEL: Record<PinPhase, string> = { before: '고정 전', pinned: '고정 중', after: '고정 해제' }

function Boundary({ children, className }: { children: ReactNode; className: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 border-t-2 border-dashed ${className}`}>
      <span className="absolute top-0 right-1 rounded-b bg-white px-1 text-[11px] font-semibold text-slate-800">{children}</span>
    </div>
  )
}

export function PinDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const [pin, setPin] = useState(() => pinStateAt(0))
  const { scrollerRef, scrollerProps } = useInnerScroller({ label: 'Pin 내부 스크롤 영역' })

  useGSAP(
    () => {
      const scroller = scrollerRef.current
      const zone = zoneRef.current
      if (!scroller || !zone) return
      const sync = (self: ScrollTrigger) => setPin(pinStateAt(self.progress))
      ScrollTrigger.create({
        scroller,
        trigger: zone,
        start: 'top top',
        end: `+=${PIN_DISTANCE}`,
        onUpdate: sync,
        onRefresh: sync,
      })
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef}>
      <MotionStage>
        <Status>{PIN_PHASE_LABEL[pin.phase]} · 남은 고정 거리 {pin.remaining}px</Status>
        <section {...scrollerProps} className={`h-56 ${scrollerProps.className}`}>
          <div className="flex h-24 items-center justify-center text-xs text-slate-600">고정 전 본문 ↓</div>
          {/* 부모 높이 = 고정 요소 높이(h-32 = 128px) + 고정 구간 */}
          <div ref={zoneRef} className="relative" style={{ height: 128 + PIN_DISTANCE }}>
            <div data-pinned className="sticky top-0 flex h-32 flex-col items-center justify-center gap-2 bg-indigo-900 text-white">
              <p className="text-sm font-semibold">{pin.phase === 'pinned' ? '📌 ' : ''}고정되는 섹션</p>
              <p className="text-xs tabular-nums">{PIN_PHASE_LABEL[pin.phase]} · {pin.remaining}px 남음</p>
            </div>
            <Boundary className="top-0 border-emerald-600">▼ 고정 시작</Boundary>
            <Boundary className="bottom-0 border-rose-600">▲ 고정 끝</Boundary>
          </div>
          <div className="flex h-56 items-center justify-center text-xs text-slate-600">고정이 풀린 뒤의 본문</div>
        </section>
      </MotionStage>
    </div>
  )
}

type SnapMode = 'none' | 'proximity' | 'mandatory'

const SNAP_OPTIONS: { value: SnapMode; label: string; className: string }[] = [
  { value: 'none', label: 'snap 끔', className: 'snap-none' },
  { value: 'proximity', label: 'proximity', className: 'snap-y snap-proximity' },
  { value: 'mandatory', label: 'mandatory', className: 'snap-y snap-mandatory' },
]

const SNAP_SECTIONS = [
  { title: '섹션 1', className: 'bg-indigo-50' },
  { title: '섹션 2', className: 'bg-amber-50' },
  { title: '섹션 3', className: 'bg-emerald-50' },
]

export function ScrollSnapDemo() {
  const [mode, setMode] = useState<SnapMode>('mandatory')
  const [position, setPosition] = useState({ top: 0, aligned: true })
  const { scrollerProps, scrollerRef } = useInnerScroller({
    label: 'Scroll Snap 내부 스크롤 영역',
    onScroll: () => {
      const scroller = scrollerRef.current
      if (!scroller) return
      setPosition({ top: Math.round(scroller.scrollTop), aligned: isSnapAligned(scroller.scrollTop, scroller.clientHeight) })
    },
  })
  const snapClass = SNAP_OPTIONS.find((option) => option.value === mode)!.className

  return (
    <MotionStage
      controls={SNAP_OPTIONS.map((option) => (
        <Choice key={option.value} pressed={mode === option.value} onClick={() => setMode(option.value)}>
          {option.label}
        </Choice>
      ))}
    >
      <Status hint="스크롤하다 중간에서 멈춰 보세요">
        위치 {position.top}px · {position.aligned ? '경계에 정렬됨' : '경계에서 어긋남'}
      </Status>
      <section {...scrollerProps} className={`h-56 ${snapClass} ${scrollerProps.className}`}>
        {SNAP_SECTIONS.map((section) => (
          <div key={section.title} className={`flex h-full snap-start flex-col items-center justify-center border-t-4 border-slate-700 ${section.className}`}>
            <p className="text-lg font-bold text-slate-900">{section.title}</p>
            <p className="text-xs text-slate-600">굵은 선이 섹션 경계입니다</p>
          </div>
        ))}
      </section>
    </MotionStage>
  )
}

const STORY = [
  { title: '1단계 · 요청 도착', body: '요청 하나가 서버에 들어옵니다.', count: 1 },
  { title: '2단계 · 요청 증가', body: '요청이 늘어 자리가 차기 시작합니다.', count: 3 },
  { title: '3단계 · 가득 참', body: '다섯 자리가 모두 차서 다음 요청은 기다립니다.', count: 5 },
]

function StoryGraphic({ step }: { step: number }) {
  const { count } = STORY[step]!
  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴
    <svg viewBox="0 0 120 90" role="img" aria-label={`${step + 1}단계 그림: 다섯 자리 중 ${count}자리 사용`} className="h-28 w-full">
      {[0, 1, 2, 3, 4].map((slot) => (
        <rect key={slot} x={6 + slot * 22} y={30} width={18} height={30} rx={3} strokeWidth={1.5}
          className={slot < count ? 'fill-indigo-700 stroke-indigo-700' : 'fill-white stroke-slate-400'} />
      ))}
      <text x={60} y={80} textAnchor="middle" fontSize={11} className="fill-slate-800">{count} / 5 사용</text>
    </svg>
  )
}

export function ScrollytellingDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)
  const [step, setStep] = useState(0)
  const { scrollerRef, scrollerProps } = useInnerScroller({ label: 'Scrollytelling 내부 스크롤 영역' })

  useGSAP(
    () => {
      const scroller = scrollerRef.current
      const track = trackRef.current
      if (!scroller || !track) return
      const sync = (self: ScrollTrigger) => setStep(storyStepAt(self.progress, STORY.length))
      ScrollTrigger.create({ scroller, trigger: track, start: 'top top', end: 'bottom bottom', onUpdate: sync, onRefresh: sync })
      // Pin 없는 구성: 단계가 순서대로 나타난다. 첫 단계는 처음부터 보인다.
      for (const item of gsap.utils.toArray<HTMLElement>('[data-story-reveal]')) {
        gsap.fromTo(
          item,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, scrollTrigger: { scroller, trigger: item.parentElement, start: 'top 80%' } },
        )
      }
    },
    { scope: rootRef, dependencies: [pinned], revertOnUpdate: true },
  )

  function choose(next: boolean) {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0
    setStep(0)
    setPinned(next)
  }

  return (
    <div ref={rootRef}>
      <MotionStage
        controls={
          <>
            <Choice pressed={pinned} onClick={() => choose(true)}>Pin 사용</Choice>
            <Choice pressed={!pinned} onClick={() => choose(false)}>Pin 없이 순서대로 노출</Choice>
          </>
        }
      >
        <Status>{step + 1} / {STORY.length} 단계 · {pinned ? '그림 고정' : '그림도 함께 이동'}</Status>
        <section {...scrollerProps} className={`h-56 ${scrollerProps.className}`}>
          {pinned ? (
            <div key="pinned" ref={trackRef} className="grid grid-cols-2">
              <div data-story-graphic className="sticky top-0 flex h-56 items-center self-start px-2">
                <StoryGraphic step={step} />
              </div>
              <div>
                {STORY.map((item, index) => (
                  <div key={item.title} className="flex h-56 items-center px-2">
                    <div className={`border-l-4 pl-2 ${index === step ? 'border-indigo-700' : 'border-transparent'}`}>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-700">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key="flow" ref={trackRef}>
              {STORY.map((item, index) => (
                <div key={item.title} className="h-56">
                  <div data-story-reveal={index > 0 ? true : undefined} className="flex h-full flex-col justify-center px-3">
                    <StoryGraphic step={index} />
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-700">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </MotionStage>
      <p className="mt-2 text-xs text-slate-600">
        가장 큰 실물 예시: <a href="./connection-pool/" className="term-link">커넥션 풀 에세이</a>
      </p>
    </div>
  )
}

export function ParallaxScrollingDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [strength, setStrength] = useState(50)
  const { scrollerRef, scrollerProps } = useInnerScroller({ label: 'Parallax Scrolling 내부 스크롤 영역' })
  const ratio = strength / 100

  useGSAP(
    () => {
      const scroller = scrollerRef.current
      const track = trackRef.current
      if (!scroller || !track) return
      const timeline = gsap.timeline({
        scrollTrigger: { scroller, trigger: track, start: 'top top', end: 'bottom bottom', scrub: true },
      })
      for (const layer of ['back', 'middle', 'front'] as const) {
        timeline.fromTo(`[data-layer="${layer}"]`, { y: 0 }, { y: -parallaxShift(layer, ratio), ease: 'none' }, 0)
      }
    },
    { scope: rootRef, dependencies: [strength], revertOnUpdate: true },
  )

  return (
    <div ref={rootRef}>
      <MotionStage
        controls={
          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">강도</span>
            <input
              type="range"
              min={0}
              max={100}
              step={10}
              value={strength}
              aria-label="Parallax 강도"
              aria-valuetext={`${strength}%`}
              onChange={(event) => setStrength(event.currentTarget.valueAsNumber)}
              className="w-28 accent-indigo-700"
            />
            <span className="w-10 tabular-nums text-slate-600">{strength}%</span>
          </label>
        }
      >
        <Status>
          이동 거리: 배경 {parallaxShift('back', ratio)} · 중간 {parallaxShift('middle', ratio)} · 전경 {parallaxShift('front', ratio)}
        </Status>
        <section {...scrollerProps} className={`h-56 ${scrollerProps.className}`}>
          <div ref={trackRef} className="h-[560px]">
            <div className="sticky top-0 h-56 overflow-hidden">
              {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
              <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" role="img" aria-label="배경, 중간, 전경 세 층이 서로 다른 속도로 올라가는 풍경" className="h-full w-full bg-sky-100">
                <g data-layer="back">
                  <path d="M0 120 70 60 130 105 210 45 320 115V400H0Z" className="fill-sky-300" />
                  <text x={160} y={128} textAnchor="middle" fontSize={12} className="fill-slate-900">배경 층</text>
                </g>
                <g data-layer="middle">
                  <path d="M0 165Q80 125 160 160T320 150V400H0Z" className="fill-emerald-600" />
                  <text x={80} y={182} textAnchor="middle" fontSize={12} className="fill-white">중간 층</text>
                </g>
                <g data-layer="front">
                  <path d="M0 205 40 190 90 210 150 192 220 212 280 195 320 205V400H0Z" className="fill-slate-800" />
                  <text x={240} y={228} textAnchor="middle" fontSize={12} className="fill-white">전경 층</text>
                </g>
              </svg>
            </div>
          </div>
        </section>
      </MotionStage>
    </div>
  )
}

const PROJECTS = ['검색 개편', '결제 화면', '알림 센터', '팀 설정', '모바일 앱']

export function PinnedHorizontalScrollDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const [mobile, setMobile] = useState(false)
  const [percent, setPercent] = useState(0)
  const { scrollerRef, scrollerProps } = useInnerScroller({ label: 'Pinned Horizontal Scroll 내부 스크롤 영역' })

  useGSAP(
    () => {
      const scroller = scrollerRef.current
      const zone = zoneRef.current
      const track = trackRef.current
      if (mobile || !scroller || !zone || !track) return
      const sync = (self: ScrollTrigger) => setPercent(Math.round(self.progress * 100))
      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => horizontalShift(track.scrollWidth, track.parentElement!.clientWidth),
          ease: 'none',
          scrollTrigger: {
            scroller,
            trigger: zone,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: sync,
            onRefresh: sync,
          },
        },
      )
    },
    { scope: rootRef, dependencies: [mobile], revertOnUpdate: true },
  )

  function toggleMobile() {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0
    setPercent(0)
    setMobile((value) => !value)
  }

  return (
    <div ref={rootRef}>
      <MotionStage controls={<Choice pressed={mobile} onClick={toggleMobile}>모바일</Choice>}>
        <Status>{mobile ? '세로 목록' : `가로 이동 ${percent}%`}</Status>
        <section {...scrollerProps} className={`h-56 ${mobile ? 'mx-auto max-w-56' : ''} ${scrollerProps.className}`}>
          <div ref={zoneRef} className={mobile ? '' : 'h-[672px]'}>
            <div className={mobile ? 'p-2' : 'sticky top-0 flex h-56 items-center overflow-hidden'}>
              <ul ref={trackRef} aria-label="프로젝트 카드" className={mobile ? 'space-y-2' : 'flex w-max gap-3 px-3'}>
                {PROJECTS.map((project, index) => (
                  <li key={project} className={`flex flex-col justify-center rounded-lg border border-indigo-200 bg-indigo-50 p-3 ${mobile ? 'h-24' : 'h-40 w-36'}`}>
                    <span className="text-xs tabular-nums text-slate-600">{index + 1} / {PROJECTS.length}</span>
                    <span className="mt-1 text-sm font-semibold text-indigo-950">{project}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </MotionStage>
    </div>
  )
}
