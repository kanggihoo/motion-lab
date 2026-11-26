import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MotionStage } from '@terms/components/stages/MotionStage'
import { useMotionPlayback } from '@terms/hooks/use-motion-playback'

gsap.registerPlugin(useGSAP, Flip)

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

type PageEffect = 'fade' | 'slide-up' | 'wipe'

const PAGE_EFFECTS: PageEffect[] = ['fade', 'slide-up', 'wipe']

const PAGES = [
  { name: '홈', title: '홈 화면', body: '새로 나온 상품을 만나 보세요.', tone: 'bg-indigo-50 text-indigo-950' },
  { name: '소개', title: '소개 화면', body: '우리는 오래 쓰는 물건을 만듭니다.', tone: 'bg-amber-100 text-amber-950' },
]

export function PageTransitionDemo() {
  const [effect, setEffect] = useState<PageEffect>('slide-up')
  const [page, setPage] = useState(0)
  const { scopeRef, stageProps, reset } = useMotionPlayback((tl) => {
    // JSX는 항상 홈만 보이는 상태다. 직전 화면 → 현재 화면을 매번 처음부터 만든다.
    const next = `.page-${page}`
    const previous = `.page-${1 - page}`
    gsap.set(previous, { autoAlpha: 1 })
    gsap.set(next, { autoAlpha: 0 })
    if (effect === 'wipe') {
      tl.fromTo('.page-cover', { xPercent: -101, autoAlpha: 1 }, { xPercent: 0, duration: 0.35, ease: 'power2.in' })
      tl.set(previous, { autoAlpha: 0 })
      tl.set(next, { autoAlpha: 1 })
      tl.to('.page-cover', { xPercent: 101, duration: 0.35, ease: 'power2.out' })
      return
    }
    tl.to(previous, { autoAlpha: 0, duration: 0.3 })
    tl.fromTo(
      next,
      { autoAlpha: 0, y: effect === 'slide-up' ? 24 : 0 },
      { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', immediateRender: false },
    )
  })

  function go(target: number) {
    if (target === page) return
    setPage(target)
    stageProps.onReplay()
  }

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        onReplay={() => {
          if (page === 0 && stageProps.replayLabel === '재생') setPage(1)
          stageProps.onReplay()
        }}
        controls={
          <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend className="sr-only">전환 방식</legend>
            {PAGE_EFFECTS.map((value) => (
              <Choice key={value} pressed={effect === value} onClick={() => { setEffect(value); setPage(0); reset() }}>
                {value}
              </Choice>
            ))}
          </fieldset>
        }
      >
        <div className="overflow-hidden rounded-md border border-slate-200">
          <nav aria-label="미니 앱" className="flex gap-1 border-b border-slate-200 bg-white p-1.5">
            {PAGES.map(({ name }, index) => (
              <button
                key={name}
                type="button"
                aria-current={page === index ? 'page' : undefined}
                onClick={() => go(index)}
                className="rounded px-2.5 py-1 text-xs text-slate-700 aria-[current=page]:font-semibold aria-[current=page]:underline aria-[current=page]:underline-offset-4"
              >
                {name}
              </button>
            ))}
          </nav>
          <div className="relative h-36 overflow-hidden">
            {PAGES.map(({ title, body, tone }, index) => (
              <div key={title} className={`page-${index} absolute inset-0 p-4 ${tone} ${index === 0 ? '' : 'invisible'}`}>
                <p className="text-lg font-bold">{title}</p>
                <p className="mt-1 text-sm">{body}</p>
              </div>
            ))}
            <div aria-hidden="true" className="page-cover invisible absolute inset-0 bg-slate-900" />
          </div>
        </div>
      </MotionStage>
    </div>
  )
}

const PRODUCTS = [
  { id: 'mug', name: '머그컵', price: '12,000원', color: '#0f766e', mark: 'circle' },
  { id: 'lamp', name: '조명', price: '48,000원', color: '#b45309', mark: 'triangle' },
  { id: 'bag', name: '가방', price: '36,000원', color: '#6d28d9', mark: 'square' },
] as const

type Product = (typeof PRODUCTS)[number]

/** Flip 대상은 SVG를 감싼 HTML 상자다. */
function ProductArt({ product, className }: { product: Product; className: string }) {
  return (
    <div aria-hidden="true" data-flip-id={`product-${product.id}`} className={className}>
      <svg viewBox="0 0 100 100" className="size-full">
        <rect width="100" height="100" rx="12" fill={product.color} />
        {product.mark === 'circle' && <circle cx="50" cy="50" r="26" fill="#ffffff" />}
        {product.mark === 'triangle' && <path d="M50 22 L78 74 L22 74 Z" fill="#ffffff" />}
        {product.mark === 'square' && <rect x="26" y="26" width="48" height="48" fill="#ffffff" />}
      </svg>
    </div>
  )
}

type SharedMode = 'shared' | 'page'

export function SharedElementTransitionDemo() {
  const [mode, setMode] = useState<SharedMode>('shared')
  const [selectedId, setSelectedId] = useState<Product['id'] | null>(null)
  const selected = PRODUCTS.find(({ id }) => id === selectedId)
  const backRef = useRef<HTMLButtonElement>(null)
  /** 카드나 「목록으로」를 눌러 화면이 바뀐 때만 focus를 옮긴다. */
  const focusTarget = useRef<'back' | Product['id'] | null>(null)
  const { scopeRef, stageProps, reset } = useMotionPlayback((tl) => {
    if (!selected) return
    // 상세 화면은 opacity만 바꾼다. visibility를 숨기면 「목록으로」로 focus를 옮길 수 없다.
    if (mode === 'page') {
      tl.fromTo('.product-list', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 })
      tl.fromTo('.product-detail', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35 })
      return
    }
    const [thumb] = gsap.utils.toArray<Element>(`.thumb-${selected.id}`)
    const [hero] = gsap.utils.toArray<Element>('.detail-art')
    if (!thumb || !hero) return
    tl.fromTo('.product-list', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.25 }, 0)
    tl.add(Flip.from(Flip.getState(thumb), { targets: hero, scale: true, duration: 0.6, ease: 'power2.inOut' }), 0)
    tl.fromTo('.detail-text', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.35)
  })

  useEffect(() => {
    const target = focusTarget.current
    focusTarget.current = null
    if (target === 'back') backRef.current?.focus({ preventScroll: true })
    else if (target) scopeRef.current?.querySelector<HTMLElement>(`[data-product="${target}"]`)?.focus({ preventScroll: true })
  }, [selectedId, scopeRef])

  function open(id: Product['id']) {
    focusTarget.current = 'back'
    setSelectedId(id)
    stageProps.onReplay()
  }

  function close() {
    focusTarget.current = selectedId
    setSelectedId(null)
    reset()
  }

  return (
    <div ref={scopeRef}>
      <MotionStage
        {...stageProps}
        onReplay={() => {
          if (!selectedId) setSelectedId(PRODUCTS[0].id)
          stageProps.onReplay()
        }}
        controls={
          <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend className="sr-only">비교할 전환</legend>
            <Choice pressed={mode === 'shared'} onClick={() => { setMode('shared'); setSelectedId(null); reset() }}>
              Shared Element
            </Choice>
            <Choice pressed={mode === 'page'} onClick={() => { setMode('page'); setSelectedId(null); reset() }}>
              Page Transition
            </Choice>
          </fieldset>
        }
      >
        <div className="relative h-52">
          <ul className={`product-list grid grid-cols-3 gap-2 ${selected ? 'invisible' : ''}`}>
            {PRODUCTS.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  data-product={product.id}
                  onClick={() => open(product.id)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 text-left focus-visible:outline-2 focus-visible:outline-indigo-700"
                >
                  {/* 고른 카드의 이미지는 상세 화면으로 옮겨 갔으므로 목록에서는 감춘다. */}
                  <span className={`block ${selectedId === product.id && mode === 'shared' ? 'opacity-0' : ''}`}>
                    <ProductArt product={product} className={`thumb-${product.id} block aspect-square w-full`} />
                  </span>
                  <span className="mt-1.5 block text-xs font-semibold text-slate-800">{product.name}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <section aria-label={`${selected.name} 상세`} className="product-detail absolute inset-0 flex items-start gap-3">
              <ProductArt key={selected.id} product={selected} className="detail-art block size-36 shrink-0" />
              <div className="detail-text min-w-0 space-y-1.5">
                <p className="text-lg font-bold text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-700">{selected.price}</p>
                <button
                  ref={backRef}
                  type="button"
                  onClick={close}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs focus-visible:outline-2 focus-visible:outline-indigo-700"
                >
                  목록으로
                </button>
              </div>
            </section>
          )}
        </div>
        <p className="text-xs text-slate-600">
          {mode === 'shared'
            ? 'Shared Element: 누른 이미지가 상세 위치로 커지며 이어진다.'
            : 'Page Transition: 이미지 연결 없이 화면 전체가 바뀐다.'}
        </p>
      </MotionStage>
    </div>
  )
}
