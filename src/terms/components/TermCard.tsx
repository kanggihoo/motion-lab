import { Suspense, type ComponentType, type ReactNode } from 'react'
import type { Term, TermRelation } from '@terms/data/types'

const relationLabels: Record<TermRelation['kind'], string> = {
  alias: '별칭',
  part: '구성 요소',
  variant: '변형',
  api: '구현 API',
}

function formatText(value: string) {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })
}

export function TermCard({ term, Demo, selected, renderRelated }: {
  term: Term
  Demo: ComponentType
  selected: boolean
  renderRelated: (name: string) => ReactNode
}) {
  return (
    <article id={term.id} aria-labelledby={`${term.id}-title`} data-term-card data-selected={selected || undefined} className="term-card min-w-0 scroll-mt-4 rounded-2xl border bg-white p-5 sm:p-6">
      <h3 id={`${term.id}-title`} tabIndex={-1} className="text-2xl leading-tight font-bold tracking-tight">{term.name}</h3>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-slate-700">{formatText(term.definition)}</p>
      {term.details && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
          {term.details.map((detail) => <li key={detail}>{formatText(detail)}</li>)}
        </ul>
      )}

      <div className="mt-5 rounded-xl border border-indigo-100 bg-slate-50 p-3 text-sm sm:p-4">
        <h4 className="card-label text-indigo-800">라이브 데모</h4>
        <div className="mt-2.5 min-w-0"><Suspense fallback={<output>데모 불러오는 중…</output>}><Demo /></Suspense></div>
        <p className="mt-3 border-t border-indigo-100 pt-2.5 text-sm leading-relaxed text-slate-700">{formatText(term.whenToUse)}</p>
      </div>

      <dl className="mt-4 grid gap-3 text-sm leading-relaxed">
        <div>
          <dt className="card-label">구현</dt>
          <dd className="mt-1 text-slate-700">{formatText(term.implementation)}</dd>
        </div>
        {term.shadcn && (
          <div>
            <dt className="card-label">shadcn/ui</dt>
            <dd>
              <ul className="mt-1 space-y-1 text-slate-700">
                {term.shadcn.map(({ name, command, note }) => <li key={name}>{name}{command && <> · <code>{command}</code></>}{note && <> {formatText(note)}</>}</li>)}
              </ul>
            </dd>
          </div>
        )}
        {(term.relations.length > 0 || term.related) && (
          <div>
            <dt className="card-label">관계</dt>
            <dd>
              {term.relations.length > 0 && (
                <ul className="mt-1 space-y-1 text-slate-700">
                  {term.relations.map(({ kind, target, description }) => (
                    <li key={target}><strong>{relationLabels[kind]}</strong> · {renderRelated(target)}. {formatText(description)}</li>
                  ))}
                </ul>
              )}
              {term.related && (
                <div className="mt-1 text-slate-700">
                  <p>{formatText(term.related.description)}</p>
                  {term.related.names.length > 0 && <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1" aria-label="함께 볼 용어">
                    {term.related.names.map((name) => <li key={name}>{renderRelated(name)}</li>)}
                  </ul>}
                </div>
              )}
            </dd>
          </div>
        )}
      </dl>
    </article>
  )
}
