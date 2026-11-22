import { useId, useState, type MouseEvent } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import type { TermSection } from '@terms/data/types'
import { termHash } from '@terms/lib/term-hash'
import { Button } from './ui/button'

export function TermNavigation({ section, activeCategory, activeHash, onNavigate }: {
  section: TermSection
  activeCategory: string
  activeHash: string
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const id = useId()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  return (
    <nav aria-label={`${section.name} 범주 탐색`}>
      <ul className="space-y-1">
        {section.categories.map((category) => {
          const href = termHash(section.id, category.id)
          const active = category.id === activeCategory
          const open = expanded[category.id] ?? active
          const listId = `${id}-${category.id}`
          const Icon = open ? ChevronDownIcon : ChevronRightIcon
          return (
            <li key={category.id}>
              <div data-active={active || undefined} className="terms-nav-category flex items-center gap-1 rounded-md">
                <a href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                  className="flex min-w-0 flex-1 items-baseline justify-between gap-2 rounded-md px-2 py-2 text-sm font-semibold">
                  <span>{category.name}</span>
                  <span className="text-xs tabular-nums text-slate-600" aria-label={`${category.terms.length}개`}>{category.terms.length}</span>
                </a>
                <Button size="icon-sm" variant="ghost" aria-expanded={open} aria-controls={listId} className="mr-1"
                  aria-label={`${category.name} 용어 ${open ? '접기' : '펼치기'}`}
                  onClick={() => setExpanded((previous) => ({ ...previous, [category.id]: !open }))}><Icon aria-hidden /></Button>
              </div>
              <ul id={listId} hidden={!open} className="my-1 ml-2 space-y-0.5 border-l pl-2">
                {category.terms.map((term) => {
                  const termHref = termHash(section.id, category.id, term.id)
                  return (
                    <li key={term.id}>
                      <a href={termHref} onClick={onNavigate} aria-current={activeHash === termHref ? 'location' : undefined}
                        className="terms-nav-term block rounded-md px-2 py-1 text-sm text-slate-700">{term.name}</a>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
