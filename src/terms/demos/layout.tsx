import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { AppShellPreview, ContainerPreview, StackPreview, BentoPreview, DirectionPreview, GridPreview, HeroPreview, MasonryPreview, RatioPreview, ResizablePreview, ScrollAreaPreview, SeparatorPreview, SidebarPreview, SplitPreview, StickyPreview } from '@terms/components/LayoutPreviews'

function WidthDemo({ children }: { children: (width: number) => ReactNode }) {
  const [width, setWidth] = useState(640)
  const [available, setAvailable] = useState(320)
  const frame = useRef<HTMLDivElement>(null)
  const id = useId()

  useLayoutEffect(() => {
    const node = frame.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailable(entry.contentRect.width)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const zoom = Math.min(1, available / width)

  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between gap-2" htmlFor={id}>
        <span>미니 화면 폭</span><output htmlFor={id} className="font-mono tabular-nums">{width} px</output>
      </label>
      <input id={id} type="range" min={320} max={1280} step={16} value={width} onChange={(event) => setWidth(event.currentTarget.valueAsNumber)} className="block w-full accent-indigo-700" />
      <div ref={frame} className="min-w-0">
        <div style={{ width, zoom, fontSize: Math.min(42, Math.max(16, 11 / zoom)) }} className="mx-auto min-w-0 text-slate-900">
          {children(width)}
        </div>
      </div>
    </div>
  )
}

export function HeroDemo() {
  return <WidthDemo>{(width) => <HeroPreview narrow={width < 640} />}</WidthDemo>
}

export function GridDemo() {
  const [guides, setGuides] = useState(true)
  const [span, setSpan] = useState(false)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <label><input type="checkbox" checked={guides} onChange={(event) => setGuides(event.target.checked)} /> 격자선</label>
        <label><input type="checkbox" checked={span} onChange={(event) => setSpan(event.target.checked)} /> 요약 카드가 2열 차지</label>
      </div>
      <WidthDemo>{(width) => <GridPreview columns={width < 480 ? 1 : width < 640 ? 2 : 4} guides={guides} span={span} />}</WidthDemo>
    </div>
  )
}

export function BentoDemo() {
  const [bento, setBento] = useState(true)
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">배치 <select value={String(bento)} onChange={(event) => setBento(event.target.value === 'true')}><option value="false">Grid · 같은 크기</option><option value="true">Bento · 크기 차등</option></select></label>
      <WidthDemo>{(width) => <BentoPreview columns={width < 640 ? 1 : 3} bento={bento} />}</WidthDemo>
    </div>
  )
}

export function MasonryDemo() {
  const [masonry, setMasonry] = useState(true)
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">배치 <select value={String(masonry)} onChange={(event) => setMasonry(event.target.value === 'true')}><option value="false">Grid · 행 정렬</option><option value="true">Masonry · 세로 흐름</option></select></label>
      <WidthDemo>{(width) => <MasonryPreview columns={width < 480 ? 1 : width < 640 ? 2 : 3} masonry={masonry} />}</WidthDemo>
      <p>CSS Masonry는 초안, 지원 진행 중. 이 데모는 CSS columns로 근사합니다.</p>
    </div>
  )
}

export function SidebarDemo() {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState('개요')
  return (
    <WidthDemo>{(width) => (
      <SidebarPreview narrow={width < 640} expanded={expanded} selected={selected}
        onToggle={() => setExpanded(!expanded)} onSelect={setSelected} />
    )}</WidthDemo>
  )
}

export function StickyDemo() {
  return (
    <WidthDemo>{(width) => (
      <div className={width < 640 ? 'text-sm' : ''}>
        <StickyPreview />
      </div>
    )}</WidthDemo>
  )
}

export function SplitDemo() {
  const [ratio, setRatio] = useState<'50/50' | '40/60'>('50/50')
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">이미지 / 설명 <select value={ratio} onChange={(event) => setRatio(event.target.value === '40/60' ? '40/60' : '50/50')}><option>50/50</option><option>40/60</option></select></label>
      <WidthDemo>{(width) => <SplitPreview narrow={width < 640} ratio={ratio} />}</WidthDemo>
    </div>
  )
}

export function AspectRatioDemo() {
  const [ratio, setRatio] = useState(16 / 9)
  const [fixed, setFixed] = useState(true)
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="space-y-3">
      <label>비율 <select value={ratio} onChange={(event) => setRatio(Number(event.target.value))}>
        <option value={16 / 9}>16:9</option><option value={4 / 3}>4:3</option><option value={1}>1:1</option>
      </select></label>
      <label className="block"><input type="checkbox" checked={fixed} onChange={(event) => setFixed(event.target.checked)} /> 비율 고정</label>
      <button type="button" className="rounded border bg-white px-2 py-1" onClick={() => setLoaded(!loaded)}>{loaded ? '로드 전 보기' : '이미지 로드'}</button>
      <WidthDemo>{() => <RatioPreview ratio={ratio} fixed={fixed} loaded={loaded} />}</WidthDemo>
    </div>
  )
}

export function ResizableDemo() {
  const [vertical, setVertical] = useState(false)
  return (
    <div className="space-y-3">
      <label><input type="checkbox" checked={vertical} onChange={(event) => setVertical(event.target.checked)} /> 세로 분할</label>
      <WidthDemo>{() => <ResizablePreview vertical={vertical} />}</WidthDemo>
    </div>
  )
}

export function ScrollAreaDemo() {
  const [horizontal, setHorizontal] = useState(false)
  return (
    <div className="space-y-3">
      <label><input type="checkbox" checked={horizontal} onChange={(event) => setHorizontal(event.target.checked)} /> 가로 스크롤</label>
      <WidthDemo>{() => <ScrollAreaPreview horizontal={horizontal} />}</WidthDemo>
    </div>
  )
}

export function SeparatorDemo() {
  return <WidthDemo>{() => <SeparatorPreview />}</WidthDemo>
}

export function DirectionDemo() {
  const [rtl, setRtl] = useState(false)
  return (
    <div className="space-y-3">
      <label><input type="checkbox" checked={rtl} onChange={(event) => setRtl(event.target.checked)} /> RTL 사용</label>
      <WidthDemo>{() => <DirectionPreview direction={rtl ? 'rtl' : 'ltr'} />}</WidthDemo>
    </div>
  )
}

export function AppShellDemo() {
  const [page, setPage] = useState('문서')
  return <WidthDemo>{(width) => <AppShellPreview page={page} onChange={setPage} narrow={width < 640} />}</WidthDemo>
}

export function ContainerDemo() {
  const [constrained, setConstrained] = useState(true)
  return <div className="space-y-2">
    <label><input type="checkbox" checked={constrained} onChange={(event) => setConstrained(event.target.checked)} /> 최대 너비 720px</label>
    <WidthDemo>{(width) => <ContainerPreview width={width} constrained={constrained} />}</WidthDemo>
  </div>
}

export function StackDemo() {
  const [vertical, setVertical] = useState(true)
  const [gap, setGap] = useState(12)
  return <div className="space-y-2">
    <label><input type="checkbox" checked={vertical} onChange={(event) => setVertical(event.target.checked)} /> 세로 배치</label>
    <label className="flex flex-wrap items-center gap-2">간격 <input type="range" min={0} max={32} value={gap} onChange={(event) => setGap(event.currentTarget.valueAsNumber)} /> <output>{gap}px</output></label>
    <WidthDemo>{() => <StackPreview vertical={vertical} gap={gap} />}</WidthDemo>
  </div>
}
