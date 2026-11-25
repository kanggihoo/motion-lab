import type { TermSection } from './types'

const sectionOrder = ['ui', 'motion', 'style', 'camera', 'edit', 'look']

function order(id: string) {
  const position = sectionOrder.indexOf(id)
  return position === -1 ? sectionOrder.length : position
}

export const sections = Object.values(
  import.meta.glob<TermSection>(['./*.ts', '!./index.ts', '!./types.ts'], {
    eager: true,
    import: 'default',
  }),
)
  .map((section) => ({
    ...section,
    categories: section.categories.filter((category) => category.terms.length > 0),
  }))
  .filter((section) => section.categories.length > 0)
  .sort((left, right) => order(left.id) - order(right.id))

const plannedSections = [
  { id: 'motion', name: 'Motion' },
  { id: 'style', name: 'Style' },
  { id: 'camera', name: 'Camera' },
  { id: 'edit', name: 'Edit' },
  { id: 'look', name: 'Look' },
]

export const sectionOptions = [
  ...sections.map(({ id, name, categories }) => ({ id, name, firstCategory: categories[0]?.id })),
  ...plannedSections.filter(({ id }) => !sections.some((section) => section.id === id))
    .map((section) => ({ ...section, firstCategory: undefined })),
].sort((left, right) => order(left.id) - order(right.id))
