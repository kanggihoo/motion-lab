import { useEffect, useRef, useState } from 'react'
import { ArrowUpRightIcon, SearchIcon } from 'lucide-react'
import type { Term } from '@terms/data/types'
import { Button } from './ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './ui/command'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './ui/dialog'
import { Kbd } from './ui/kbd'

export interface SearchTerm {
  term: Term
  category: string
  section: string
  href: string
}

function normalize(value: string) {
  return value.normalize('NFKC').toLowerCase().replace(/[-–—]/g, ' ').trim()
}

const visibleLimit = 40

export function TermSearch({ terms, activeCategoryHash, onNavigate }: {
  terms: SearchTerm[]
  activeCategoryHash: string
  onNavigate: (href: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const pending = useRef<string>(null)

  function changeOpen(next: boolean) {
    if (next) setQuery('')
    setOpen(next)
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      if (!open && document.querySelector('[data-open][role=dialog], [data-open][role=alertdialog]')) return
      event.preventDefault()
      if (!open) setQuery('')
      setOpen(!open)
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [open])

  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  const matches = tokens.length
    ? terms.filter(({ term }) => {
      const names = [term.name, ...term.aliases].map(normalize)
      return tokens.every((token) => names.some((name) => name.includes(token)))
    })
    : terms.filter(({ href }) => href.startsWith(`${activeCategoryHash}/`))

  return (
    <Dialog open={open} onOpenChange={changeOpen} onOpenChangeComplete={(next) => {
      if (next || !pending.current) return
      const href = pending.current
      pending.current = null
      requestAnimationFrame(() => onNavigate(href))
    }}>
      <DialogTrigger render={<Button variant="outline" className="order-last w-full justify-start bg-white sm:order-none sm:w-auto sm:min-w-56" aria-label="전체 용어 검색" />}>
        <SearchIcon aria-hidden /> <span className="mr-auto">전체 용어 검색</span> <Kbd className="hidden sm:inline-flex">⌘K / Ctrl+K</Kbd>
      </DialogTrigger>
      <DialogContent showCloseButton={false} initialFocus={input} finalFocus={() => pending.current === null}
        className="max-h-[85dvh] min-w-0 gap-2 overflow-hidden p-3 sm:max-w-xl">
        <div className="flex items-center justify-between gap-2">
          <DialogTitle>전체 용어 검색</DialogTitle>
          <DialogClose render={<Button variant="outline" size="sm" />}>닫기</DialogClose>
        </div>
        <DialogDescription className="sr-only">이름이나 별칭을 입력하고 화살표와 Enter로 용어로 이동하세요.</DialogDescription>
        <Command shouldFilter={false} label="용어 검색 결과" className="min-w-0">
          <CommandInput ref={input} aria-label="용어 이름 또는 별칭" placeholder="이름·별칭으로 검색" value={query} onValueChange={setQuery} />
          <p className="px-2 pt-2 pb-1 text-xs text-slate-600">{tokens.length ? `검색 결과 ${matches.length}개` : '현재 범주'}{matches.length > visibleLimit && ` · 첫 ${visibleLimit}개 표시`}</p>
          <CommandList className="max-h-[58dvh]">
            <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
            {matches.slice(0, visibleLimit).map(({ term, href, section, category }) => (
              <CommandItem key={href} value={href} className="min-w-0 data-selected:font-semibold"
                onSelect={() => { pending.current = href; setOpen(false) }}>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="wrap-anywhere">{term.name}</span>
                  <span className="text-xs font-normal text-slate-600">{section} · {category}</span>
                </span>
                <ArrowUpRightIcon aria-hidden className="shrink-0" />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
