import { lazy, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { MenuIcon } from 'lucide-react'
import { TermCard } from './components/TermCard'
import { TermNavigation } from './components/TermNavigation'
import { Button } from './components/ui/button'
import { TermSearch } from './components/TermSearch'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './components/ui/sheet'
import { TooltipProvider } from './components/ui/tooltip'
import { sectionOptions, sections } from './data'
import { ReducedMotionContext, useReducedMotionPreference } from './lib/motion'
import { termHash } from './lib/term-hash'

const desktopQuery = '(min-width: 64rem)'

const categories = sections.flatMap((section) => section.categories.map((category) => {
  let pending: ReturnType<typeof category.loadDemos> | undefined
  return {
    section,
    category,
    demos: Object.fromEntries(category.terms.map((term) => [term.id, lazy(async () => {
      pending ??= category.loadDemos()
      return { default: (await pending)[term.id]! }
    })])),
  }
}))

const searchTerms = categories.flatMap(({ section, category }) => category.terms.map((term) => ({
  term, section: section.name, category: category.name, href: termHash(section.id, category.id, term.id),
})))
const termsByName = new Map(searchTerms.map(({ term, href }) => [term.name, href]))

function readLocation(hash: string) {
  const [sectionId, categoryId, termId] = hash.slice(1).split('/')
  const base = categories.find(({ section, category }) => section.id === sectionId && category.id === categoryId)
    ?? (categoryId === 'component' && termId ? categories.find(({ section, category }) =>
      section.id === sectionId && category.terms.some(({ id }) => id === termId)) : undefined)
    ?? categories.find(({ section }) => section.id === sectionId)
    ?? categories[0]!
  const term = base.category.terms.find(({ id }) => id === termId)
  return { ...base, term, hash: termHash(base.section.id, base.category.id, term?.id) }
}

function syncLocation() {
  const route = readLocation(window.location.hash)
  if (route.hash !== window.location.hash) history.replaceState(history.state, '', route.hash)
  return route
}

export function Dashboard() {
  const [visit, setVisit] = useState(() => ({ route: readLocation(window.location.hash), focus: Boolean(window.location.hash) }))
  const [menuOpen, setMenuOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const menuNavigating = useRef(false)
  const mainTitle = useRef<HTMLHeadingElement>(null)
  const menuClose = useRef<HTMLButtonElement>(null)
  const osReduce = useReducedMotionPreference()
  const reduced = osReduce || preview
  const current = visit.route

  useLayoutEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced)
    return () => { delete document.documentElement.dataset.reducedMotion }
  }, [reduced])

  useLayoutEffect(() => {
    const restoration = history.scrollRestoration
    history.scrollRestoration = 'manual'
    syncLocation()
    return () => { history.scrollRestoration = restoration }
  }, [])

  useLayoutEffect(() => {
    function handleHashChange() {
      if (menuOpen) menuNavigating.current = true
      setMenuOpen(false)
      setVisit({ route: syncLocation(), focus: true })
    }

    const desktop = window.matchMedia(desktopQuery)
    function closeMenuOnDesktop() {
      if (desktop.matches) setMenuOpen(false)
    }

    window.addEventListener('hashchange', handleHashChange)
    if (menuOpen) desktop.addEventListener('change', closeMenuOnDesktop)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      desktop.removeEventListener('change', closeMenuOnDesktop)
    }
  }, [menuOpen])

  function showLocation(termId?: string) {
    const title = termId ? document.getElementById(`${termId}-title`) : mainTitle.current
    title?.focus({ preventScroll: true })
    if (termId) document.getElementById(termId)?.scrollIntoView({ block: 'start' })
    else window.scrollTo(0, 0)
  }

  useLayoutEffect(() => {
    if (visit.focus && !menuNavigating.current) showLocation(visit.route.term?.id)
  }, [visit])

  function navigate(event: MouseEvent<HTMLAnchorElement>, fromMenu = false) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    visitHash(event.currentTarget.hash, fromMenu)
  }

  function visitHash(hash: string, fromMenu = false) {
    const route = readLocation(hash)
    if (window.location.hash !== route.hash) history.pushState(null, '', route.hash)
    menuNavigating.current = fromMenu
    if (fromMenu) setMenuOpen(false)
    setVisit({ route, focus: true })
  }

  function renderRelated(name: string) {
    const href = termsByName.get(name)
    return href ? <a href={href} className="term-link" onClick={(event) => navigate(event)}>{name}</a> : name
  }

  return (
    <ReducedMotionContext value={reduced}>
      <TooltipProvider>
        <header className="terms-header border-b border-indigo-200">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:py-5">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen} onOpenChangeComplete={(open) => {
              if (open || !menuNavigating.current) return
              requestAnimationFrame(() => {
                showLocation(current.term?.id)
                menuNavigating.current = false
              })
            }}>
              <SheetTrigger render={<Button variant="outline" className="lg:hidden" aria-label="용어 메뉴 열기" />}>
                <MenuIcon aria-hidden /> 메뉴
              </SheetTrigger>
              <SheetContent side="left" showCloseButton={false} initialFocus={menuClose}
                finalFocus={() => !menuNavigating.current && !window.matchMedia(desktopQuery).matches} className="gap-0 bg-white">
                <SheetHeader className="flex-row items-center justify-between border-b">
                  <div>
                    <SheetTitle>용어 메뉴</SheetTitle>
                    <SheetDescription className="sr-only">범주와 용어를 선택하세요.</SheetDescription>
                  </div>
                  <SheetClose ref={menuClose} render={<Button variant="outline" />}>닫기</SheetClose>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                  <TermNavigation key={`${current.section.id}/${current.category.id}`} section={current.section} activeCategory={current.category.id} activeHash={current.hash} onNavigate={(event) => navigate(event, true)} />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="mr-auto text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">용어 대시보드</h1>
            <TermSearch terms={searchTerms} activeCategoryHash={termHash(current.section.id, current.category.id)} onNavigate={visitHash} />
            <label className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm">
              <input type="checkbox" checked={reduced} disabled={osReduce} onChange={(event) => setPreview(event.target.checked)} />
              <span>Reduced Motion 미리보기{osReduce && <span className="ml-1 text-slate-600">· OS 설정</span>}</span>
            </label>
          </div>
          <nav aria-label="용어 섹션" className="flex flex-wrap gap-1 border-t border-indigo-100 px-4 py-2 sm:px-6">
            {sectionOptions.map(({ id, name, firstCategory }) => firstCategory ?
              <a key={id} href={termHash(id, firstCategory)} aria-current={current.section.id === id ? 'page' : undefined}
                onClick={(event) => navigate(event)} className="terms-section-link rounded-md px-3 py-1.5 text-sm font-semibold">{name}</a> :
              <Button key={id} variant="ghost" size="sm" disabled className="text-slate-600 opacity-100!">{name} <span className="text-xs">준비 중</span></Button>)}
          </nav>
        </header>

        <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="sticky top-0 hidden max-h-dvh self-start overflow-y-auto overscroll-contain border-r bg-white p-4 lg:block">
            <TermNavigation key={`${current.section.id}/${current.category.id}`} section={current.section} activeCategory={current.category.id} activeHash={current.hash} onNavigate={(event) => navigate(event)} />
          </aside>
          <main className="min-w-0 px-4 pt-5 pb-12 sm:px-6 lg:px-8">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b pb-3">
              <h2 ref={mainTitle} tabIndex={-1} className="rounded-sm text-2xl font-bold tracking-tight sm:text-3xl">
                {current.category.name}
              </h2>
              <output className="text-sm tabular-nums text-slate-600">용어 {current.category.terms.length}개</output>
            </div>
            <section key={termHash(current.section.id, current.category.id)} aria-label={current.category.name} data-term-category className="mb-6">
              <div className="grid items-start gap-4 md:grid-cols-2 sm:gap-5">
                {current.category.terms.map((term) => {
                  const Demo = current.demos[term.id]
                  return Demo && <TermCard key={term.id} term={term} Demo={Demo} selected={current.term?.id === term.id} renderRelated={renderRelated} />
                })}
              </div>
            </section>
          </main>
        </div>
      </TooltipProvider>
    </ReducedMotionContext>
  )
}
