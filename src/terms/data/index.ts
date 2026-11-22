import type { TermSection } from './types'

const sectionOrder = ['ui', 'motion', 'style']

function order(id: string) {
  const position = sectionOrder.indexOf(id)
  return position === -1 ? sectionOrder.length : position
}

export const sections = Object.values(
  import.meta.glob<TermSection>(['./*.ts', '!./index.ts', '!./types.ts'], {
    eager: true,
    import: 'default',
  }),
).sort((left, right) => order(left.id) - order(right.id))

const plannedSections = [
  { id: 'motion', name: 'Motion' },
  { id: 'style', name: 'Style' },
]

export const sectionOptions = [
  ...sections.map(({ id, name, categories }) => ({ id, name, firstCategory: categories[0]?.id })),
  ...plannedSections.filter(({ id }) => !sections.some((section) => section.id === id))
    .map((section) => ({ ...section, firstCategory: undefined })),
].sort((left, right) => order(left.id) - order(right.id))
