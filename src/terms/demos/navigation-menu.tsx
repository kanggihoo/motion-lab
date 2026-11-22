import { Fragment, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@terms/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@terms/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@terms/components/ui/tabs'
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@terms/components/ui/breadcrumb'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@terms/components/ui/command'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@terms/components/ui/context-menu'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@terms/components/ui/dialog'
import { Kbd } from '@terms/components/ui/kbd'
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from '@terms/components/ui/menubar'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@terms/components/ui/navigation-menu'


const tabs = [
  ['개요', '프로젝트를 한곳에서 확인하세요.'],
  ['기능', '진행 상황과 피드백을 팀에 공유할 수 있습니다.'],
  ['가격', '개인 플랜은 무료로 시작할 수 있습니다.'],
]

export function TabsDemo() {
  return (
    <Tabs defaultValue="개요">
      <TabsList aria-label="제품 정보" activateOnFocus>
        {tabs.map(([name]) => <TabsTrigger value={name} key={name} className="data-active:font-bold data-active:underline data-active:underline-offset-4">{name}</TabsTrigger>)}
      </TabsList>
      {tabs.map(([name, text]) => <TabsContent key={name} value={name} className="rounded-lg border bg-white p-3">{text}</TabsContent>)}
    </Tabs>
  )
}

const commands = [
  ['복제', '카드를 복제했습니다.'],
  ['이름 변경', '카드 이름을 바꿨습니다.'],
  ['삭제', '카드를 삭제했습니다.'],
] as const

export function DropdownDemo() {
  const [status, setStatus] = useState('실행한 명령이 없습니다.')
  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="카드 명령" />}>⋯</DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {commands.map(([name, result]) => <DropdownMenuItem key={name} onClick={() => setStatus(result)}>{name}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <output className="block">{status}</output>
    </div>
  )
}

export function BreadcrumbDemo() {
  const [page, setPage] = useState(2)
  const [longPath, setLongPath] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const path = longPath ? ['홈', '팀', '프로젝트', '설정', '알림'] : ['홈', '설정', '알림']
  const current = Math.min(page, path.length - 1)

  return (
    <div className="space-y-3">
      <label><input type="checkbox" checked={longPath} onChange={(event) => {
        setLongPath(event.target.checked)
        setPage(event.target.checked ? 4 : 2)
        setExpanded(false)
      }} /> 긴 경로 보기</label>
      <Breadcrumb aria-label="설정 경로">
        <BreadcrumbList>
          {path.slice(0, current + 1).map((item, index) => {
            if (longPath && !expanded && current > 2 && index > 1 && index < current) return null
            return (
              <Fragment key={item}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === current ? <BreadcrumbPage>{item}</BreadcrumbPage> : index === 1 && longPath && !expanded && current > 2 ?
                    <Button size="icon-sm" variant="ghost" aria-label="접힌 경로 펼치기" onClick={() => setExpanded(true)}><BreadcrumbEllipsis /></Button> :
                    <BreadcrumbLink href="#ui/navigation-menu/breadcrumb" onClick={(event) => { event.preventDefault(); setPage(index) }}>{item}</BreadcrumbLink>}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <output className="block">현재 위치 · {path[current]}</output>
    </div>
  )
}

const products = [
  ['프로젝트', '팀의 작업을 한곳에 모읍니다.'],
  ['자동화', '반복 작업에 규칙을 적용합니다.'],
  ['리포트', '진행 상황을 요약합니다.'],
]

export function NavigationMenuDemo() {
  const [page, setPage] = useState('홈')
  return (
    <div className="space-y-2">
      <NavigationMenu aria-label="미니 사이트 메뉴">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>제품</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-56 max-w-[75vw]">
                {products.map(([name, description]) => (
                  <li key={name}>
                    <NavigationMenuLink href="#ui/navigation-menu/navigation-menu" className="block" closeOnClick
                      onClick={(event) => { event.preventDefault(); setPage(name ?? '홈') }}>
                      <strong>{name}</strong><p className="text-xs">{description}</p>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem><NavigationMenuLink href="#ui/navigation-menu/navigation-menu" onClick={(event) => { event.preventDefault(); setPage('자료') }}>자료</NavigationMenuLink></NavigationMenuItem>
          <NavigationMenuItem><NavigationMenuLink href="#ui/navigation-menu/navigation-menu" onClick={(event) => { event.preventDefault(); setPage('가격') }}>가격</NavigationMenuLink></NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <output className="block">현재 위치 · {page}</output>
    </div>
  )
}

export function MenubarDemo() {
  const [lineNumbers, setLineNumbers] = useState(true)
  const [mode, setMode] = useState('편집')
  const [action, setAction] = useState('')
  return (
    <div className="space-y-2">
      <Menubar aria-label="편집기 메뉴">
        <MenubarMenu>
          <MenubarTrigger>파일</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => setAction('새 파일을 만들었습니다.')}>새 파일 <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>내보내기</MenubarSubTrigger>
              <MenubarSubContent><MenubarItem onClick={() => setAction('텍스트 내보내기를 선택했습니다.')}>텍스트</MenubarItem></MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>편집</MenubarTrigger>
          <MenubarContent><MenubarItem onClick={() => setAction('실행을 취소했습니다.')}>실행 취소 <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem></MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>보기</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked={lineNumbers} onCheckedChange={setLineNumbers}>줄 번호 보기</MenubarCheckboxItem>
            <MenubarRadioGroup value={mode} onValueChange={setMode}>
              <MenubarRadioItem value="편집">편집 모드</MenubarRadioItem><MenubarRadioItem value="읽기">읽기 모드</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <p className="rounded border bg-white p-2 font-mono">{lineNumbers && '1  '}const note = '편집기'</p>
      <output className="block">{mode} 모드 · 줄 번호 {lineNumbers ? '표시' : '숨김'} {action}</output>
    </div>
  )
}

export function ContextMenuDemo() {
  const [action, setAction] = useState('명령 대기')
  const actions = ['이름 변경', '복제', '삭제']
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ContextMenu>
        <ContextMenuTrigger render={<Button variant="outline" />} onKeyDown={(event) => {
          if (!(event.shiftKey && event.key === 'F10') && event.key !== 'ContextMenu') return
          event.preventDefault()
          const bounds = event.currentTarget.getBoundingClientRect()
          event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: bounds.left, clientY: bounds.bottom }))
        }}>📄 회의록.txt</ContextMenuTrigger>
        <ContextMenuContent>{actions.map((name) => <ContextMenuItem key={name} onClick={() => setAction(`${name} 실행`)}>{name}</ContextMenuItem>)}</ContextMenuContent>
      </ContextMenu>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" aria-label="파일 명령" />}>⋯</DropdownMenuTrigger>
        <DropdownMenuContent>{actions.map((name) => <DropdownMenuItem key={name} onClick={() => setAction(`${name} 실행`)}>{name}</DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>
      <output className="block w-full">{action}</output>
    </div>
  )
}

const palette = [
  { group: '페이지', items: [['설정', '⌘,'], ['설정 문서', '⌘/'], ['프로젝트', '⌘P']] },
  { group: '명령', items: [['새 문서', '⌘N'], ['테마 변경', '⌘T']] },
] as const

export function CommandDemo() {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState('')
  const trigger = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)

  function handleDemoShortcut(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
    event.preventDefault()
    setOpen((value) => !value)
  }

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger onKeyDown={handleDemoShortcut} ref={trigger} render={<Button variant="outline" />}>데모 명령 검색 <Kbd>⌘K / Ctrl+K</Kbd></DialogTrigger>
        <DialogContent showCloseButton={false} initialFocus={input} finalFocus={trigger} className="min-w-0 p-2">
          <DialogTitle className="sr-only">명령 팔레트</DialogTitle>
          <DialogDescription className="sr-only">검색한 뒤 화살표와 Enter로 실행하세요.</DialogDescription>
          <Command label="명령 목록">
            <CommandInput onKeyDown={handleDemoShortcut} ref={input} aria-label="명령 검색" placeholder="명령이나 페이지 검색" />
            <CommandList>
              <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
              {palette.map(({ group, items }) => (
                <CommandGroup key={group} heading={group}>
                  {items.map(([name, shortcut]) => (
                    <CommandItem key={name} value={name} onSelect={() => { setAction(`${name} 실행`); setOpen(false) }}>
                      {name}<CommandShortcut>{shortcut}</CommandShortcut>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
      <output className="block">{action || '실행한 명령이 없습니다.'}</output>
    </div>
  )
}

const checkout = ['배송', '결제', '확인']

export function StepperDemo() {
  const [step, setStep] = useState(0)
  const title = useRef<HTMLHeadingElement>(null)
  function move(next: number) {
    setStep(next)
    title.current?.focus()
  }
  return <div className="space-y-3">
    <ol className="flex flex-wrap gap-2" aria-label="주문 단계">
      {checkout.map((name, index) => <li key={name} aria-current={index === step ? 'step' : undefined} className="rounded border bg-white px-2 py-1">
        {index + 1}. {name}{index < step ? ' ✓ 완료' : index === step ? ' · 현재' : ''}
      </li>)}
    </ol>
    <h5 ref={title} tabIndex={-1} className="font-semibold">{checkout[step]} 단계</h5>
    <div className="flex gap-2">
      <Button variant="outline" disabled={step === 0} onClick={() => move(step - 1)}>이전</Button>
      <Button disabled={step === checkout.length - 1} onClick={() => move(step + 1)}>다음</Button>
    </div>
  </div>
}

const outline = ['준비', '설치', '실행']

export function OutlineDemo() {
  const [active, setActive] = useState(0)
  const headings = useRef<Array<HTMLHeadingElement | null>>([])
  return <div className="space-y-2">
    <nav aria-label="미니 문서 목차" className="flex flex-wrap gap-3">{outline.map((label, index) =>
      <a key={label} href={`#demo-outline-${index}`} className="term-link" aria-current={index === active ? 'location' : undefined}
        onClick={(event) => { event.preventDefault(); setActive(index); headings.current[index]?.focus() }}>{label}{index === active ? ' · 현재' : ''}</a>)}</nav>
    <div className="max-h-28 overflow-auto rounded border bg-white p-2">
      {outline.map((label, index) => <section key={label} className="min-h-24">
        <h5 id={`demo-outline-${index}`} tabIndex={-1} ref={(node) => { headings.current[index] = node }} className="font-semibold">{label}</h5>
        <p>가이드의 {label} 절입니다.</p>
      </section>)}
    </div>
  </div>
}

const tools = [['왼쪽','text-left'], ['가운데','text-center'], ['오른쪽','text-right']] as const

export function ToolbarDemo() {
  const [tab, setTab] = useState(0)
  const [align, setAlign] = useState(0)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  return <div className="space-y-2">
    <div role="toolbar" aria-label="텍스트 정렬 도구" className="flex flex-wrap gap-1">
      {tools.map(([name], index) => <Button key={name} ref={(node) => { buttons.current[index] = node }} tabIndex={tab === index ? 0 : -1}
        variant={align === index ? 'default' : 'outline'} aria-pressed={align === index} onFocus={() => setTab(index)} onClick={() => setAlign(index)}
        onKeyDown={(event) => {
          const next = event.key === 'ArrowRight' ? (index + 1) % tools.length : event.key === 'ArrowLeft' ? (index + tools.length - 1) % tools.length : null
          if (next === null) return
          event.preventDefault()
          buttons.current[next]?.focus()
        }}>{name}</Button>)}
    </div>
    <p className={`rounded border bg-white p-3 ${tools[align]?.[1]}`}>현재 정렬 · {tools[align]?.[0]}</p>
  </div>
}
