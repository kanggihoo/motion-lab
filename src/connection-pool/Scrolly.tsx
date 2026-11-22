import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef, type ReactNode } from 'react'
import bg from '../../art/connection-pool/bg-b.png'
import { BEATS, ENTER, LANE, POOL_SIZE, T_END, TO_SLOT, WAIT_LIMIT, beatAt, countsAt, trips, type Beat, type Trip } from './sim'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const UNIT_VH = 9 // 화면 시간 1 = 스크롤 9vh

// 좌표 (viewBox 520×484). 위에서 아래로 대기열 → 풀 → DB
const QY = 88
const GATE_X = 260 // 대기열 맨 앞
const ENTRY_X = -20
const SPACING = 26
const SLOT_Y = 200
const DB_Y = 404
const slotX = (k: number) => 44 + k * 48

const SHIFT = 0.4 // 앞 요청이 빠질 때 한 칸 당기는 시간
const EXIT = 0.6 // 반납 후 사라지는 시간
const DIE = 0.9 // 타임아웃 ✕가 사라지는 시간
const FADE = 0.8 // 단계 사이 강조 전환
const RING = 2 * Math.PI * 11

const io = gsap.parseEase('power2.inOut')
const out = gsap.parseEase('power2.out')
const clamp = gsap.utils.clamp(0, 1)
const mix = (a: number, b: number, k: number) => a + (b - a) * k

type Spot = { x: number; y: number; o: number; dead: boolean; ring: number }
const spot = (x: number, y: number, o = 1, dead = false, ring = -1): Spot => ({ x, y, o, dead, ring })

const queueIndex = (p: Trip, t: number) => p.ahead.reduce((n, leave) => n + 1 - io(clamp((t - leave) / SHIFT)), 0)

// 요청 하나의 시각 t 상태. 화면에 없으면 null. t만의 함수라서 어느 방향으로 와도 같은 결과다.
function place(p: Trip, t: number): Spot | null {
  if (t < p.arrive - ENTER) return null
  const qx = GATE_X - queueIndex(p, t) * SPACING
  if (t < p.arrive) {
    const k = (t - p.arrive + ENTER) / ENTER
    return spot(mix(ENTRY_X, qx, out(k)), QY, clamp(k * 3))
  }
  if (t < p.leave) return spot(qx, QY, 1, false, (t - p.arrive) / WAIT_LIMIT)
  if (p.conn < 0) {
    const k = (t - p.leave) / DIE
    return k < 1 ? spot(qx, QY - 14 * out(k), 1 - k, true) : null
  }
  const sx = slotX(p.conn)
  const dead = p.slow && t >= p.done
  if (t < p.pick) {
    const k = io((t - p.leave) / TO_SLOT)
    return spot(mix(qx, sx, k), mix(QY, SLOT_Y, k))
  }
  if (t < p.atDb) return spot(sx, mix(SLOT_Y, DB_Y, io((t - p.pick) / LANE)))
  if (t < p.up) return spot(sx, DB_Y, 1, dead)
  if (t < p.release) return spot(sx, mix(DB_Y, SLOT_Y, io((t - p.up) / LANE)), 1, dead)
  const k = (t - p.release) / EXIT
  return k < 1 ? spot(sx, SLOT_Y - 16 * out(k), 1 - k, dead) : null
}

// 단계 i의 비중 0~1. 경계에서 FADE 동안 교차한다. 영역 강조와 본문 카드가 같은 값을 쓴다.
function weight(i: number, t: number) {
  const start = i === 0 ? -Infinity : BEATS[i]!.start
  const end = BEATS[i + 1]?.start ?? Infinity
  return clamp((t - start) / FADE + 0.5) - clamp((t - end) / FADE + 0.5)
}
const focus = (region: Beat['focus'], t: number) => BEATS.reduce((w, b, i) => (b.focus === region ? w + weight(i, t) : w), 0)

type Props = { header: ReactNode; text: Record<Beat['id'], ReactNode> }

export function Scrolly({ header, text }: Props) {
  const root = useRef<HTMLElement>(null)
  const steps = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const svg = root.current!.querySelector('svg')!
      const all = <T extends Element>(sel: string) => [...svg.querySelectorAll<T>(sel)]
      const tripEls = all<SVGGElement>('[data-trip]').map((g) => ({
        g,
        body: g.querySelector<SVGElement>('[data-body]')!,
        cross: g.querySelector<SVGElement>('[data-cross]')!,
        ring: g.querySelector<SVGElement>('[data-ring]')!,
      }))
      const connEls = all<SVGRectElement>('[data-conn]')
      const holders = connEls.map((_, k) => trips.filter((p) => p.conn === k))
      const regions = all<SVGGElement>('[data-region]')
      // sticky 카드는 다음 카드가 아래에서 미리 올라온다. 다이어그램과 같은 단계의 카드만 진하게.
      const cards = [...root.current!.querySelectorAll<HTMLElement>('[data-card]')]
      const label = (name: string) => svg.querySelector(`[data-text=${name}]`)!
      const scene = label('scene')
      const queue = label('queue')
      const pool = label('pool')
      const db = label('db')

      const draw = (t: number) => {
        trips.forEach((p, i) => {
          const s = place(p, t)
          const el = tripEls[i]!
          el.g.style.display = s ? '' : 'none'
          if (!s) return
          el.g.setAttribute('transform', `translate(${s.x} ${s.y})`)
          el.g.setAttribute('opacity', String(s.o))
          el.body.style.display = s.dead ? 'none' : ''
          el.cross.style.display = s.dead ? '' : 'none'
          el.ring.style.display = s.ring < 0 ? 'none' : ''
          if (s.ring >= 0) el.ring.setAttribute('stroke-dasharray', `${RING * s.ring} ${RING}`)
        })
        connEls.forEach((el, k) => {
          const p = holders[k]!.find((h) => h.pick <= t && t < h.release)
          const s = p ? place(p, t)! : spot(slotX(k), SLOT_Y)
          el.setAttribute('transform', `translate(${s.x} ${s.y})`)
        })
        const c = countsAt(t)
        scene.textContent = BEATS[beatAt(t)]!.scene
        queue.textContent = `대기 ${c.waiting} · 타임아웃 ${c.timedOut}`
        pool.textContent = `가용 ${c.available} / ${POOL_SIZE}`
        db.textContent = `실행 중인 쿼리 ${c.running}`
        regions.forEach((g) => (g.style.opacity = String(0.35 + 0.65 * focus(g.dataset.region as Beat['focus'], t))))
        cards.forEach((card, i) => (card.style.opacity = String(0.3 + 0.7 * weight(i, t))))
      }

      gsap.matchMedia().add(
        { motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' },
        (ctx) => {
          // 움직임 줄이기: 스크롤 위치가 속한 단계의 정지 화면만 보여준다. 같은 내용, 움직임 없음.
          const reduce = ctx.conditions!.reduce
          const clock = { t: 0 }
          // 기준선 = 본문 카드가 붙는 높이(--read). 단계 블록의 위끝이 이 선을 지날 때 그 단계가 시작된다.
          const line = () => `${parseFloat(getComputedStyle(steps.current!.querySelector('[data-card]')!).top)}px`
          gsap.to(clock, {
            t: T_END,
            ease: 'none',
            scrollTrigger: { trigger: steps.current, start: () => `top ${line()}`, end: () => `bottom ${line()}`, scrub: reduce ? true : 0.5 },
          })
          // onUpdate 대신 매 프레임 clock을 읽는다. ScrollTrigger는 refresh 중 콜백 없이 진행률을 바꾸는 경로가 있다.
          let drawn = NaN
          const tick = () => {
            const t = reduce ? BEATS[beatAt(clock.t)]!.still : clock.t
            if (t !== drawn) draw((drawn = t))
          }
          tick()
          gsap.ticker.add(tick)
          return () => gsap.ticker.remove(tick)
        },
      )
    },
    { scope: root },
  )

  return (
    <section ref={root} className="flex flex-col md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* 배경은 분위기만. 설명은 이미지 없이도 성립해야 한다 (AGENTS.md) */}
      <img src={bg} alt="" className="pointer-events-none fixed inset-0 -z-10 h-full w-full object-cover opacity-60" />
      {/* 모바일: 본문이 다이어그램 밑으로 지나가므로 반투명 + 블러로 가린다 */}
      <div className="sticky top-0 z-10 h-(--diagram-h) bg-zinc-950/85 px-3 py-2 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none md:col-start-2 md:row-start-1 md:h-screen md:self-start md:p-10">
        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" + <title>이 표준 패턴. <img>로는 내부를 그릴 수 없다 */}
        <svg viewBox="0 0 520 484" className="h-full w-full" role="img" aria-labelledby="pool-title">
          <title id="pool-title">커넥션 풀 다이어그램. 위에서부터 대기열, 커넥션 10개가 든 풀, DB. 상태 변화는 본문이 단계별로 설명한다.</title>
          <text data-text="scene" x={16} y={24} className="fill-zinc-100 text-[21px] font-semibold md:text-[17px]" />
          <g className="text-[19px] md:text-[15px]">
            <g data-region="queue">
              <rect x={16} y={72} width={260} height={32} rx={16} className="fill-none stroke-zinc-600" />
              <text x={16} y={58} className="fill-zinc-300">대기열</text>
              <text data-text="queue" x={504} y={58} textAnchor="end" className="fill-zinc-100 tabular-nums" />
            </g>
            <g data-region="pool">
              <rect x={16} y={172} width={488} height={56} rx={10} className="fill-none stroke-zinc-600" />
              <text x={16} y={158} className="fill-zinc-300">커넥션 풀</text>
              <text data-text="pool" x={504} y={158} textAnchor="end" className="fill-zinc-100 tabular-nums" />
            </g>
            <g data-region="db">
              <rect x={16} y={380} width={488} height={64} rx={10} className="fill-none stroke-zinc-600" />
              <text x={16} y={470} className="fill-zinc-300">DB</text>
              <text data-text="db" x={504} y={470} textAnchor="end" className="fill-zinc-100 tabular-nums" />
            </g>
          </g>
          {Array.from({ length: POOL_SIZE }, (_, k) => (
            <line key={k} x1={slotX(k)} x2={slotX(k)} y1={228} y2={380} className="stroke-zinc-800" />
          ))}
          {Array.from({ length: POOL_SIZE }, (_, k) => (
            <rect key={k} data-conn x={-11} y={-11} width={22} height={22} rx={4} strokeWidth={1.5} className="fill-zinc-900 stroke-zinc-300" />
          ))}
          {trips.map((p, i) => (
            <g key={i} data-trip>
              <circle data-ring r={11} transform="rotate(-90)" strokeWidth={1.5} className="fill-none stroke-zinc-400" />
              {p.slow ? <path data-body d="M0-8 8 0 0 8-8 0Z" className="fill-amber-400" /> : <circle data-body r={6} className="fill-zinc-100" />}
              <path data-cross d="M-5-5 5 5M5-5-5 5" strokeWidth={2.5} strokeLinecap="round" className="stroke-rose-400" />
            </g>
          ))}
        </svg>
      </div>

      <div className="px-5 md:col-start-1 md:row-start-1 md:px-12">
        <div ref={steps}>
          {BEATS.map((b, i) => (
            <div key={b.id} style={{ height: `${((BEATS[i + 1]?.start ?? T_END) - b.start) * UNIT_VH}vh` }}>
              {i === 0 && header}
              <div data-card className="sticky top-(--read) max-w-md space-y-3 text-base leading-relaxed break-keep text-zinc-200 md:text-lg">
                {text[b.id]}
              </div>
            </div>
          ))}
        </div>
        {/* 마지막 단계가 끝날 때까지 다이어그램이 붙어 있도록 (데스크톱). 모바일은 다이어그램이 짧아 필요 없다 */}
        <div className="md:h-[calc(100vh_-_var(--read))]" />
      </div>
    </section>
  )
}
