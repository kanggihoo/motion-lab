import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, useState } from 'react'
import { useInnerScroller } from '@terms/hooks/use-inner-scroller'

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
