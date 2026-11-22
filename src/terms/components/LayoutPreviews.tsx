import { ArrowRightIcon, ImageIcon, MenuIcon, UserIcon } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { termHash } from '@terms/lib/term-hash'
import { previewPicture } from './preview-picture'
import { AspectRatio } from './ui/aspect-ratio'
import { Button } from './ui/button'
import { DirectionProvider } from './ui/direction'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

const surface = 'rounded-lg border border-slate-200 bg-white p-4'
const picture = 'flex min-h-28 items-center justify-center gap-2 rounded-md bg-indigo-100 p-4 text-indigo-900'

function LabeledPart({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip disableHoverablePopup={false}>
      <TooltipTrigger type="button" className="block w-fit rounded-sm text-left">{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function HeroPreview({ narrow }: { narrow: boolean }) {
  return (
    <section className={`${surface} grid items-center gap-5 ${narrow ? 'grid-cols-1' : 'grid-cols-2'}`}>
      <div className="space-y-2">
        <LabeledPart label="제목"><strong className="text-2xl">팀 작업을 한곳에</strong></LabeledPart>
        <LabeledPart label="설명">계획부터 완료까지<br />한 화면에서 확인하세요.</LabeledPart>
        <a href={termHash('ui', 'layout', 'hero-section')} className="group relative inline-block rounded bg-indigo-700 px-3 py-2 text-white">
          Start for Free
          <span className="absolute bottom-full left-0 hidden rounded bg-slate-900 px-2 group-hover:block group-focus-visible:block">CTA</span>
        </a>
      </div>
      <div className={picture}>
        <LabeledPart label="이미지"><ImageIcon className="inline size-5" aria-hidden /> 제품 이미지</LabeledPart>
      </div>
    </section>
  )
}

export function GridPreview({ columns, guides, span }: { columns: number; guides: boolean; span: boolean }) {
  return (
    <div className={`${surface} grid gap-2 ${guides ? 'bg-indigo-100' : ''}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {['요약', '방문', '전환', '매출', '팀', '활동'].map((item, index) => (
        <div key={item} className={`min-h-14 rounded p-2 ${guides ? 'border border-dashed border-indigo-500' : 'bg-slate-100'}`}
          style={{ gridColumn: index === 0 && span ? `span ${Math.min(2, columns)}` : undefined }}>
          {item}{index === 0 && span && columns > 1 ? ' · 2열' : ''}
        </div>
      ))}
    </div>
  )
}

export function BentoPreview({ columns, bento }: { columns: number; bento: boolean }) {
  return (
    <div className={`${surface} grid auto-rows-[3rem] gap-2 ${bento ? 'grid-flow-dense' : ''}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {['핵심 기능', '알림', '보고서', '팀', '설정'].map((item, index) => (
        <div key={item} className={`rounded p-2 ${bento && index === 0 ? 'row-span-2 bg-indigo-100 font-semibold' : 'bg-slate-100'}`}
          style={{ gridColumn: bento && index === 0 && columns > 1 ? 'span 2' : undefined }}>
          {item}
        </div>
      ))}
    </div>
  )
}

const tileHeights = [58, 92, 43, 80, 48, 102, 57, 40, 83, 72]

export function MasonryPreview({ columns, masonry }: { columns: number; masonry: boolean }) {
  return (
    <div className={`${surface} gap-2 ${masonry ? '' : 'grid items-start'}`}
      style={masonry ? { columnCount: columns } : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {tileHeights.map((height, index) => (
        <div key={index} className={`flex break-inside-avoid items-center justify-center rounded bg-indigo-100 ${masonry ? 'mb-2' : ''}`}
          style={{ height }}>
          사진 {index + 1}
        </div>
      ))}
    </div>
  )
}

const sidebarItems = ['개요', '팀', '설정']

export function SidebarPreview({ narrow, expanded, selected, onToggle, onSelect }: {
  narrow: boolean
  expanded: boolean
  selected: string
  onToggle: () => void
  onSelect: (item: string) => void
}) {
  return (
    <div className={`${surface} grid gap-3 ${narrow ? 'grid-cols-1' : 'grid-cols-[minmax(8rem,240px)_1fr]'}`}>
      <div>
        {narrow && <button type="button" aria-expanded={expanded} onClick={onToggle} className="flex items-center gap-2 rounded bg-slate-100 px-3 py-2"><MenuIcon className="size-4" /> 메뉴</button>}
        {(!narrow || expanded) && (
          <nav className="grid gap-1 pt-1" aria-label="미니 관리자 메뉴">
            {sidebarItems.map((item) => (
              <button key={item} type="button" aria-current={selected === item ? 'true' : undefined}
                onClick={() => onSelect(item)} className="rounded px-2 py-1 text-left aria-[current=true]:bg-indigo-100 aria-[current=true]:font-bold">
                {selected === item && <span aria-hidden>› </span>}{item}
              </button>
            ))}
          </nav>
        )}
      </div>
      <div className="min-h-24 rounded bg-slate-100 p-3" aria-live="polite"><strong>{selected}</strong><p>{selected} 작업 영역</p></div>
    </div>
  )
}

export function StickyPreview() {
  const scroll = useRef<HTMLElement>(null)
  return (
    <div className="space-y-2"><Button size="sm" variant="outline" onClick={() => scroll.current?.focus()}>스크롤 영역에 포커스</Button>
    <section ref={scroll} tabIndex={-1} aria-label="Sticky Header와 일반 헤더 비교 스크롤" className="grid h-40 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-100">
      {[true, false].map((sticky) => (
        <div key={String(sticky)} className="min-w-0 bg-white">
          <div className={`z-10 border-b bg-indigo-100 p-2 font-semibold ${sticky ? 'sticky top-0' : ''}`}>
            {sticky ? 'Sticky Header' : '일반 헤더'}
          </div>
          {['개요', '주요 기능', '팀 소개', '요금 안내', '문의'].map((item) => <p key={item} className="border-b px-2 py-4">{item}</p>)}
        </div>
      ))}
    </section></div>
  )
}

export function SplitPreview({ narrow, ratio }: { narrow: boolean; ratio: '50/50' | '40/60' }) {
  const columns = ratio === '50/50' ? 'grid-cols-[1fr_1fr]' : 'grid-cols-[2fr_3fr]'
  return (
    <div className={`${surface} grid items-stretch gap-3 ${narrow ? 'grid-cols-1' : columns}`}>
      <div className={picture}><ImageIcon className="size-5" aria-hidden /> 제품 이미지</div>
      <div className="rounded bg-slate-100 p-4"><strong>제품 설명</strong><p>하나의 화면에서 팀의 작업을 관리하세요.</p></div>
    </div>
  )
}

export function RatioPreview({ ratio, fixed, loaded }: { ratio: number; fixed: boolean; loaded: boolean }) {
  const photo = <img src={previewPicture} alt="산 너머의 해" className={fixed ? 'absolute inset-0 size-full object-cover' : 'block w-full'} />
  return (
    <div className={surface}>
      {fixed ? <AspectRatio ratio={ratio} className="overflow-hidden rounded bg-indigo-100">
        {loaded ? photo : <span className="absolute inset-0 grid place-items-center">이미지 자리</span>}
      </AspectRatio> : loaded && photo}
      <p className="mt-2 rounded bg-slate-100 p-2">아래 내용 · {loaded ? '로드 후' : '로드 전'}</p>
    </div>
  )
}

export function ResizablePreview({ vertical }: { vertical: boolean }) {
  return (
    <ResizablePanelGroup key={String(vertical)} orientation={vertical ? 'vertical' : 'horizontal'} className="h-60! rounded-lg border bg-white">
      <ResizablePanel defaultSize="28%" minSize="18%"><div className="p-2">파일 목록</div></ResizablePanel>
      <ResizableHandle withHandle aria-label="파일 목록 크기 조절" />
      <ResizablePanel defaultSize="44%" minSize="24%"><div className="p-2">편집기</div></ResizablePanel>
      <ResizableHandle withHandle aria-label="미리보기 크기 조절" />
      <ResizablePanel defaultSize="28%" minSize="18%"><div className="p-2">미리보기</div></ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function ScrollAreaPreview({ horizontal }: { horizontal: boolean }) {
  const native = useRef<HTMLElement>(null)
  const tags = <ul className={horizontal ? 'flex w-max gap-2 p-2' : 'space-y-2 p-2'}>
    {Array.from({ length: 20 }, (_, index) => <li key={index} className="rounded border bg-white px-2 py-1">태그 {index + 1}</li>)}
  </ul>

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="min-w-0 space-y-1">
        <strong>Scroll Area</strong>
        <ScrollArea orientation={horizontal ? 'horizontal' : 'vertical'} viewportLabel="Scroll Area 비교" className={`${horizontal ? 'h-24' : 'h-[200px]'} w-full rounded border bg-slate-100`}>
          {tags}
        </ScrollArea>
      </div>
      <div className="min-w-0 space-y-1">
        <Button variant="outline" size="sm" onClick={() => native.current?.focus()}>기본 스크롤</Button>
        <section ref={native} tabIndex={-1} aria-label="기본 스크롤 비교" className={`${horizontal ? 'h-24' : 'h-[200px]'} overflow-auto rounded border bg-slate-100`}>{tags}</section>
      </div>
    </div>
  )
}

export function SeparatorPreview() {
  return (
    <div className={`${surface} space-y-2`}>
      <p>계정 설정</p><Separator /><p>알림 설정</p>
      <div className="flex h-9 items-center gap-2">
        <Button size="sm" variant="outline">편집</Button>
        <Separator orientation="vertical" />
        <Button size="sm" variant="outline">보기</Button>
      </div>
    </div>
  )
}

export function DirectionPreview({ direction }: { direction: 'ltr' | 'rtl' }) {
  return (
    <DirectionProvider direction={direction}>
      <div dir={direction} className={`${surface} flex items-center gap-3`}>
        <UserIcon className="shrink-0" aria-hidden />
        <div><strong>팀 계정</strong><p>세부 정보</p></div>
        <ArrowRightIcon className="ms-auto shrink-0 rtl:rotate-180" aria-hidden />
      </div>
    </DirectionProvider>
  )
}

export function AppShellPreview({ page, onChange, narrow }: {
  page: string
  onChange: (name: string) => void
  narrow: boolean
}) {
  return <div className="rounded-lg border bg-white">
    <p className="border-b bg-slate-100 p-3 font-semibold">팀 작업공간</p>
    <div className={narrow ? 'grid' : 'grid grid-cols-[10rem_1fr]'}>
      <nav aria-label="미니 작업공간" className="flex flex-wrap content-start gap-1 border-e p-2">
        {['문서', '알림'].map((name) => <Button key={name} size="sm" variant={page === name ? 'default' : 'ghost'} aria-pressed={page === name} onClick={() => onChange(name)}>{name}</Button>)}
      </nav>
      <section aria-label={page} className="min-h-28 p-4"><strong>{page}</strong><p>{page === '문서' ? '팀 문서 3건' : '읽지 않은 알림 1건'}</p></section>
    </div>
  </div>
}

export function ContainerPreview({ width, constrained }: { width: number; constrained: boolean }) {
  return <div className="rounded-lg bg-indigo-100 p-3">
    <p className="pb-2 font-mono">화면 {width}px</p>
    <div style={{ maxWidth: constrained ? 720 : undefined }} className="mx-auto rounded bg-white p-3 text-center">
      본문 {Math.min(width - 24, constrained ? 720 : width)}px · {constrained ? '최대 720px' : '제한 없음'}
    </div>
  </div>
}

export function StackPreview({ vertical, gap }: { vertical: boolean; gap: number }) {
  return <div className={`flex flex-wrap rounded-lg border bg-white p-3 ${vertical ? 'flex-col' : 'flex-row'}`} style={{ gap }}>
    {['프로필', '알림', '권한'].map((name) => <div className="rounded bg-indigo-100 p-2" key={name}>{name}</div>)}
  </div>
}
