export function termHash(sectionId: string, categoryId: string, termId?: string) {
  const category = `#${sectionId}/${categoryId}`
  return termId ? `${category}/${termId}` : category
}
