import type { ComponentType } from 'react'

export interface TermRelation {
  kind: 'alias' | 'part' | 'variant' | 'api'
  target: string
  description: string
}

export interface Term {
  id: string
  name: string
  aliases: string[]
  definition: string
  details?: string[]
  whenToUse: string
  request: string
  implementation: string
  relations: TermRelation[]
  related?: { names: string[]; description: string }
  shadcn?: { name: string; command: string; note?: string }[]
}

export interface TermCategory {
  id: string
  name: string
  terms: Term[]
  loadDemos: () => Promise<Record<string, ComponentType>>
}

export interface TermSection {
  id: string
  name: string
  categories: TermCategory[]
}
