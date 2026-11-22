import { TokenList } from "@terms/components/TokenList"
import { Card, CardTitle } from "@terms/components/ui/card"
import { Checkbox } from "@terms/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@terms/components/ui/popover"
import { Table, TableBody, TableCell, TableRow } from "@terms/components/ui/table"

import { lazy, useEffect, useRef, useState } from 'react'
import { ChevronRightIcon, LinkIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@terms/components/ui/accordion'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@terms/components/ui/carousel'
import { useReducedMotion } from '@terms/lib/motion'
import { AccountTable, CompareColumns, OrderTable, TypesetPreview, type AccountRow, type AccountSort } from '@terms/components/DataPreviews'
import { previewPicture } from '@terms/components/preview-picture'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@terms/components/ui/avatar'
import { Badge } from '@terms/components/ui/badge'
import { Button } from '@terms/components/ui/button'
import { CodeBlock, CodeBlockActions, CodeBlockContent, CodeBlockCopyButton, CodeBlockHeader, CodeBlockLine, CodeBlockTitle } from '@terms/components/ui/code-block'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@terms/components/ui/collapsible'
import { Input } from '@terms/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@terms/components/ui/input-group'
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@terms/components/ui/item'
import { Kbd } from '@terms/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipTrigger } from '@terms/components/ui/tooltip'
import { useHighlightedCode } from '@terms/hooks/use-highlighted-code'


const questions = [
  ['무료로 시작할 수 있나요?', '개인 플랜은 무료입니다.'],
  ['팀원을 초대할 수 있나요?', '팀 메뉴에서 초대 링크를 만들 수 있습니다.'],
  ['언제든 취소할 수 있나요?', '설정에서 구독을 종료할 수 있습니다.'],
]

export function AccordionDemo() {
  const [multiple, setMultiple] = useState(false)
  const [open, setOpen] = useState<string[]>([])
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">열림 방식
        <select value={String(multiple)} onChange={(event) => {
          const next = event.currentTarget.value === 'true'
          setMultiple(next)
          if (!next) setOpen((items) => items.slice(-1))
        }}>
          <option value="false">하나만 열림</option><option value="true">여러 개 열림</option>
        </select>
      </label>
      <Accordion multiple={multiple} value={open} onValueChange={setOpen}>
        {questions.map(([question, answer]) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger className="gap-2 [&>[data-slot=accordion-trigger-icon]]:hidden!">
              {question}
              <ChevronRightIcon aria-hidden className="ml-auto size-4 shrink-0 transition-transform group-aria-expanded/accordion-trigger:rotate-90" />
            </AccordionTrigger>
            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

const reviews = ['팀이 같은 화면에서 진행 상황을 확인해요.', '아이디어를 정리하는 시간이 줄었어요.', '새 팀원에게 작업 흐름을 보여 주기 쉬워요.', '리뷰할 내용을 한곳에서 찾을 수 있어요.', '진행 중인 과제를 놓치지 않게 됐어요.']

export function CarouselDemo() {
  const reduced = useReducedMotion()
  return (
    <Carousel aria-label="고객 리뷰" aria-roledescription="Carousel" tabIndex={0} className="mx-9"
      opts={reduced ? { duration: 0, watchDrag: false } : undefined}>
      <CarouselContent className="touch-pan-y touch-pinch-zoom">
        {reviews.map((review, index) => (
          <CarouselItem key={review} aria-roledescription="리뷰" aria-label={`${index + 1} / ${reviews.length}`}>
            <div className="min-h-[5.5rem] rounded-lg border bg-white p-3">
              <p className="mb-1 text-xs font-semibold text-indigo-800">리뷰 {index + 1} / {reviews.length}</p>
              <p>{review}</p>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-9" aria-label="이전 리뷰" />
      <CarouselNext className="-right-9" aria-label="다음 리뷰" />
    </Carousel>
  )
}

export function CollapsibleDemo() {
  return (
    <CompareColumns>
      <Collapsible className="rounded border bg-white p-2">
        <CollapsibleTrigger render={<Button variant="outline" className="group w-full justify-between" />}>
          고급 설정<ChevronRightIcon aria-hidden className="group-aria-expanded:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">자동 저장 주기 · 5분</CollapsibleContent>
      </Collapsible>
      <Accordion aria-label="여러 설정 항목">
        {['계정 설정', '알림 설정'].map((item) =>
          <AccordionItem key={item} value={item}><AccordionTrigger>{item}</AccordionTrigger><AccordionContent>{item} 상세 옵션</AccordionContent></AccordionItem>)}
      </Accordion>
    </CompareColumns>
  )
}

export function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <Avatar><AvatarImage src={previewPicture} alt="산과 해" /><AvatarFallback>민</AvatarFallback></Avatar>
        <p>이미지</p>
      </div>
      <div className="space-y-1">
        <Avatar aria-label="서윤"><AvatarImage src="data:image/png;base64,AAAA" alt="" /><AvatarFallback>서</AvatarFallback></Avatar>
        <p>실패 · 이니셜</p>
      </div>
      <div className="space-y-1">
        <AvatarGroup aria-label="팀원 6명">
          {['정','민','윤'].map((name) => <Avatar key={name}><AvatarFallback>{name}</AvatarFallback></Avatar>)}
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
        <p>겹친 그룹</p>
      </div>
    </div>
  )
}

export function BadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">✓ 성공</Badge>
      <Badge variant="secondary">! 경고</Badge>
      <Badge variant="destructive">× 오류</Badge>
      <Badge variant="outline">○ 베타</Badge>
    </div>
  )
}

export function KbdDemo() {
  const [saved, setSaved] = useState(false)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setSaved(true)}>저장 <Kbd>Ctrl+S</Kbd></Button>
        <Tooltip><TooltipTrigger render={<Button variant="outline" />}>단축키 도움말</TooltipTrigger>
          <TooltipContent>취소 <Kbd>Esc</Kbd></TooltipContent>
        </Tooltip>
      </div>
      <InputGroup><InputGroupInput aria-label="문서 검색" placeholder="문서 검색" />
        <InputGroupAddon align="inline-end"><Kbd>⌘K</Kbd></InputGroupAddon>
      </InputGroup>
      {saved && <output>✓ 예시 문서를 저장했습니다.</output>}
    </div>
  )
}

const services = [['문서','문서와 노트를 공유합니다.'],['저장소','코드 변경을 가져옵니다.'],['일정','회의 일정을 가져옵니다.']]

export function ItemDemo() {
  const [variant, setVariant] = useState<'default' | 'outline' | 'muted'>('outline')
  const [small, setSmall] = useState(false)
  const [disconnected, setDisconnected] = useState<string[]>([])
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label>스타일 <select value={variant} onChange={(event) => setVariant(event.target.value as typeof variant)}>
          <option value="default">기본</option><option value="outline">외곽선</option><option value="muted">흐림</option>
        </select></label>
        <label><input type="checkbox" checked={small} onChange={(event) => setSmall(event.target.checked)} /> 작은 크기</label>
      </div>
      <ul className="space-y-1">
        {services.map(([name, description]) => name && (
          <li key={name}>
            <Item variant={variant} size={small ? 'sm' : 'default'}>
              <ItemMedia variant="icon"><LinkIcon aria-hidden /></ItemMedia>
              <ItemContent className="min-w-0"><ItemTitle>{name}</ItemTitle><ItemDescription>{description}</ItemDescription></ItemContent>
              <ItemActions>
                <Button size="sm" variant="outline" aria-label={`${name} ${disconnected.includes(name) ? '다시 연결' : '연결 해제'}`}
                  onClick={() => setDisconnected((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name])}>
                  {disconnected.includes(name) ? '다시 연결' : '연결 해제'}
                </Button>
              </ItemActions>
            </Item>
          </li>
        ))}
      </ul>
    </div>
  )
}

const users: AccountRow[] = [
  '지우','민서','서준','예진','도윤','나연','윤서','지안','재민','하준',
  '현우','서연','지원','준우','아린','민준','하린','유진','시우','예준',
].map((name, index) => ({ id: index + 1, name, email: `team${index + 1}@example.com`, date: `2026-11-${String(21 - index).padStart(2, '0')}` }))

export function DataTableDemo() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<AccountSort>({ field: 'name', direction: 'ascending' })
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set())
  const rows = users.filter(({ name, email }) => `${name} ${email}`.includes(query.trim().toLowerCase()))
    .toSorted((left, right) => left[sort.field].localeCompare(right[sort.field], 'ko') * (sort.direction === 'ascending' ? 1 : -1))
  return (
    <div className="space-y-2">
      <Input type="search" aria-label="사용자 이름 또는 이메일 검색" placeholder="이름 또는 이메일 검색" value={query} onChange={(event) => setQuery(event.target.value)} />
      <output className="block">{rows.length}명 표시 · {selected.size}명 선택</output>
      <AccountTable rows={rows} sort={sort} selected={selected} onSort={(field) =>
        setSort({ field, direction: sort.field === field && sort.direction === 'ascending' ? 'descending' : 'ascending' })}
      onSelect={(id, checked) => {
        const next = new Set(selected)
        if (checked) next.add(id)
        else next.delete(id)
        setSelected(next)
      }} />
    </div>
  )
}

const SalesChart = lazy(() => import('@terms/components/SalesChart'))

export function ChartDemo() {
  const [kind, setKind] = useState<'bar' | 'line' | 'area'>('bar')
  return (
    <div className="space-y-2">
      <label>차트 종류 <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
        <option value="bar">막대</option><option value="line">선</option><option value="area">영역</option>
      </select></label>
      <SalesChart kind={kind} />
    </div>
  )
}

const codeSamples = {
  tsx: { title: 'panel.tsx', text: 'export function Panel() {\n  return <section>요약</section>\n}' },
  bash: { title: '터미널', text: '$ pnpm build\n✓ built in 213ms\n$ pnpm check\nsim ok: 92 trips' },
  diff: { title: 'heading.diff', text: '-<h2>제목</h2>\n+<h2>프로젝트 요약</h2>' },
}

export function CodeBlockDemo() {
  const [language, setLanguage] = useState<keyof typeof codeSamples>('tsx')
  const { title, text } = codeSamples[language]
  const highlights = useHighlightedCode(text, language)
  return (
    <div className="space-y-2">
      <label>코드 예시 <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
        <option value="tsx">TSX</option><option value="bash">터미널</option><option value="diff">diff</option>
      </select></label>
      <CodeBlock className="bg-white">
        <CodeBlockHeader><CodeBlockTitle>{title}</CodeBlockTitle>
          <CodeBlockActions><CodeBlockCopyButton value={text} /></CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent wrap lineNumbers className="overflow-x-auto">
          {highlights.map((line, index) => (
            <CodeBlockLine key={index} variant={language === 'diff' ? (index === 0 ? 'removed' : 'added') : 'default'}>{line}</CodeBlockLine>
          ))}
        </CodeBlockContent>
        <p className="hidden px-3 pb-2 group-has-[[data-copied]]/code-block:block">✓ 복사됨</p>
      </CodeBlock>
    </div>
  )
}

export function TypographyDemo() {
  const [styled, setStyled] = useState(false)
  const [large, setLarge] = useState(false)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <label><input type="checkbox" checked={styled} onChange={(event) => setStyled(event.target.checked)} /> Typeset 적용</label>
        <label><input type="checkbox" disabled={!styled} checked={large} onChange={(event) => setLarge(event.target.checked)} /> 큰 글자와 넓은 줄 간격</label>
      </div>
      <TypesetPreview styled={styled} large={large} />
    </div>
  )
}

export { OrderTable }

const documents = [['회의록','오늘의 회의 안건과 담당자'], ['가이드','팀 온보딩에 필요한 절차']]

export function ClickableCardDemo() {
  const [selected, setSelected] = useState('')
  return <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      {documents.map(([name]) => <a key={name} aria-label={`${name} 상세 보기`} href="#demo-document" className="rounded-lg" onClick={(event) => {
        event.preventDefault()
        setSelected(name ?? '')
        document.getElementById('demo-document')?.focus()
      }}><Card className="p-2"><CardTitle>{name} ↗</CardTitle></Card></a>)}
    </div>
    <p id="demo-document" tabIndex={-1} className="rounded border bg-white p-2">{documents.find(([name]) => name === selected)?.[1] ?? '카드를 선택하세요.'}</p>
  </div>
}

export function TokenDemo() {
  const initial = ['업데이트', '디자인', '기능']
  const [tokens, setTokens] = useState(initial)
  return <div className="space-y-2">
    <TokenList tokens={tokens} remove={(token) => setTokens(tokens.filter((item) => item !== token))} />
    <Button variant="outline" size="sm" onClick={() => setTokens(initial)}>다시 채우기</Button>
  </div>
}

export function DescriptionListDemo() {
  const [columns, setColumns] = useState(false)
  return <div className="space-y-2">
    <label><input type="checkbox" checked={columns} onChange={(event) => setColumns(event.target.checked)} /> 두 열로 보기</label>
    <dl className={`grid gap-x-3 gap-y-1 rounded border bg-white p-3 ${columns ? 'grid-cols-[max-content_1fr]' : ''}`}>
      <dt className="font-semibold">작성자</dt><dd>민서</dd>
      <dt className="font-semibold">수정일</dt><dd>11월 22일</dd>
      <dt className="font-semibold">공개 여부</dt><dd>팀 공개</dd>
    </dl>
  </div>
}

const treeRoot = '프로젝트'
const treeChildren = ['회의록.txt', '계획.md']
const treeLast = '안내.md'

export function TreeViewDemo() {
  const [expanded, setExpanded] = useState(true)
  const [focused, setFocused] = useState(treeRoot)
  const [opened, setOpened] = useState('')
  const nodes = useRef<Record<string, HTMLLIElement | null>>({})
  const visible = [treeRoot, ...(expanded ? treeChildren : []), treeLast]

  function item(name: string) {
    return {
      tabIndex: focused === name ? 0 : -1,
      ref: (node: HTMLLIElement | null) => { nodes.current[name] = node },
      onFocus: (event: React.FocusEvent<HTMLLIElement>) => { if (event.target === event.currentTarget) setFocused(name) },
      onClick: (event: React.MouseEvent<HTMLLIElement>) => {
        event.stopPropagation()
        nodes.current[name]?.focus()
        if (name === treeRoot) setExpanded(!expanded)
        else setOpened(name)
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLLIElement>) => {
        if (event.target !== event.currentTarget) return
        const index = visible.indexOf(name)
        let next: string | undefined
        switch (event.key) {
          case 'ArrowDown': next = visible[index + 1]; break
          case 'ArrowUp': next = visible[index - 1]; break
          case 'Home': next = treeRoot; break
          case 'End': next = treeLast; break
          case 'ArrowRight': if (name === treeRoot) { if (expanded) next = treeChildren[0]; else setExpanded(true) }; break
          case 'ArrowLeft': if (name === treeRoot) setExpanded(false); else if (treeChildren.includes(name)) next = treeRoot; break
          case 'Enter':
          case ' ': if (name === treeRoot) setExpanded(!expanded); else setOpened(name); break
          default: return
        }
        event.preventDefault()
        event.stopPropagation()
        if (next) nodes.current[next]?.focus()
      },
    }
  }

  return <div className="space-y-2">
    <ul role="tree" aria-label="파일 트리" className="rounded border bg-white p-2">
      <li role="treeitem" aria-label={treeRoot} aria-expanded={expanded} {...item(treeRoot)} className="cursor-pointer rounded p-1">
        {expanded ? '▾' : '▸'} {treeRoot}
        {expanded && <fieldset className="border-s ps-3"><ul role="presentation">
          {treeChildren.map((name) => <li role="treeitem" aria-current={opened === name ? 'true' : undefined} key={name} {...item(name)} className="cursor-pointer rounded p-1">{name}</li>)}
        </ul></fieldset>}
      </li>
      <li role="treeitem" aria-current={opened === treeLast ? 'true' : undefined} {...item(treeLast)} className="cursor-pointer rounded p-1">{treeLast}</li>
    </ul>
    <output className="block">{opened ? `열린 파일 · ${opened}` : '열린 파일 없음'}</output>
  </div>
}

const tags = ['태그 A','태그 B','태그 C','태그 D']

export function OverflowListDemo() {
  const [width, setWidth] = useState(165)
  const frame = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(width)
  useEffect(() => {
    const node = frame.current
    if (!node) return
    const resize = new ResizeObserver(([entry]) => { if (entry) setActual(entry.contentRect.width) })
    resize.observe(node)
    return () => resize.disconnect()
  }, [])
  const shown = actual >= 240 ? tags.length : Math.max(0, Math.floor((actual - 46) / 60))
  const hidden = tags.slice(shown)
  return <div className="space-y-2">
    <label className="flex flex-wrap items-center gap-2">목록 너비 <input type="range" min={90} max={300} value={width} onChange={(event) => setWidth(event.currentTarget.valueAsNumber)} /> <output>{width}px</output></label>
    <div ref={frame} style={{ width }} className="flex max-w-full items-center gap-1 rounded border bg-white p-1">
      {tags.slice(0, shown).map((tag) => <Badge key={tag} variant="outline" className="w-14 shrink-0">{tag}</Badge>)}
      {hidden.length > 0 && <Popover>
        <PopoverTrigger render={<Button size="xs" variant="outline" aria-label={`숨겨진 태그 ${hidden.length}개`} />}>+{hidden.length}</PopoverTrigger>
        <PopoverContent className="w-40"><PopoverTitle>나머지 태그</PopoverTitle><ul>{hidden.map((tag) => <li key={tag}>{tag}</li>)}</ul></PopoverContent>
      </Popover>}
    </div>
  </div>
}

const timestamp = new Date('2026-11-22T09:25:00+09:00')
const referenceTime = new Date('2026-11-22T09:30:00+09:00')
const exactTime = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' })
const relativeTime = new Intl.RelativeTimeFormat('ko-KR')

export function TimestampDemo() {
  const [relative, setRelative] = useState(true)
  return <div className="space-y-2">
    <label><input type="checkbox" checked={relative} onChange={(event) => setRelative(event.target.checked)} /> 상대 시간 사용</label>
    <p>작성 · <time dateTime={timestamp.toISOString()}>
      {relative ? relativeTime.format((timestamp.getTime() - referenceTime.getTime()) / 60000, 'minute') : exactTime.format(timestamp)}
    </time></p>
    <p className="text-slate-600">기준 · {exactTime.format(referenceTime)}</p>
  </div>
}

const messages = ['회의 안건', '디자인 검토', '팀 공지']

export function BulkActionBarDemo() {
  const [rows, setRows] = useState(messages)
  const [selected, setSelected] = useState<string[]>([])
  const [archived, setArchived] = useState(0)
  return <div className="space-y-2">
    {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded border bg-indigo-50 p-2">
      <output>{selected.length}건 선택</output>
      <Button size="sm" onClick={() => {
        setRows(rows.filter((row) => !selected.includes(row)))
        setArchived(selected.length)
        setSelected([])
      }}>선택한 행 보관</Button>
    </div>}
    <Table><TableBody>{rows.map((row) => <TableRow key={row}>
      <TableCell><Checkbox aria-label={`${row} 선택`} checked={selected.includes(row)} onCheckedChange={(checked) =>
        setSelected((previous) => checked ? [...previous, row] : previous.filter((item) => item !== row))} /></TableCell>
      <TableCell>{row}</TableCell>
    </TableRow>)}</TableBody></Table>
    {archived > 0 && <output className="block">✓ {archived}건 보관됨</output>}
    <Button variant="outline" size="sm" onClick={() => { setRows(messages); setSelected([]); setArchived(0) }}>목록 복원</Button>
  </div>
}
