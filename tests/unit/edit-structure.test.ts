import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { sections } from '@terms/data'
import { CrossCuttingDemo, InsertShotDemo, MontageDemo } from '@terms/demos/edit-structure'
import {
  clipAt,
  clipRanges,
  CROSS_CUT_CLIPS,
  insertShotClips,
  MONTAGE_CLIPS,
  splitViewShift,
  totalDuration,
} from '@terms/lib/edit-structure-math'

describe('Edit · Structure data', () => {
  it('registers the 5 Structure cards between Transition and Time with doc aliases', () => {
    const edit = sections.find((s) => s.id === 'edit')!
    const ids = edit.categories.map((c) => c.id)
    expect(ids.indexOf('structure')).toBeGreaterThan(ids.indexOf('transition'))

    const structure = edit.categories.find((c) => c.id === 'structure')!
    expect(structure.terms.map((t) => t.id)).toEqual([
      'montage',
      'cross-cutting',
      'split-screen',
      'insert-shot',
      'flashback',
    ])
    expect(structure.terms.find((t) => t.id === 'montage')!.aliases).toEqual(['Montage Sequence'])
    expect(structure.terms.find((t) => t.id === 'cross-cutting')!.aliases).toEqual(['Parallel Editing'])
    for (const term of structure.terms) {
      expect(term.filmmaking?.trim().length).toBeGreaterThan(0)
      expect(term.implementation.trim().length).toBeGreaterThan(0)
      expect(term.request.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('Edit · Structure timing math', () => {
  it('picks the clip and local progress at a given time, clamped to both ends', () => {
    expect(clipAt(MONTAGE_CLIPS, -1)).toMatchObject({ index: 0, progress: 0 })
    expect(clipAt(MONTAGE_CLIPS, 1.5)).toMatchObject({ index: 1, progress: 0.5 })
    expect(clipAt(MONTAGE_CLIPS, 2)).toMatchObject({ index: 2, progress: 0 })
    expect(clipAt(MONTAGE_CLIPS, 99)).toMatchObject({ index: 3, progress: 1 })
  })

  it('switches exactly at every accumulated cut boundary', () => {
    clipRanges(CROSS_CUT_CLIPS).forEach((range, index) => {
      expect(clipAt(CROSS_CUT_CLIPS, range.start).index).toBe(index)
    })
  })

  it('builds Montage from four 1-second clips', () => {
    expect(MONTAGE_CLIPS.map((c) => c.duration)).toEqual([1, 1, 1, 1])
    expect(totalDuration(MONTAGE_CLIPS)).toBe(4)
  })

  it('alternates A/B and strictly shortens every Cross-cutting cut', () => {
    CROSS_CUT_CLIPS.forEach((clip, index) => {
      expect(clip.side).toBe(index % 2 === 0 ? 'A' : 'B')
      if (index > 0) expect(clip.duration).toBeLessThan(CROSS_CUT_CLIPS[index - 1]!.duration)
    })
  })

  it('inserts a 1-second clock clip only when Insert Shot is on, keeping total length', () => {
    const on = insertShotClips(true)
    const off = insertShotClips(false)
    expect(on.map((c) => c.id)).toEqual(['before', 'insert', 'after'])
    expect(on[1]!.duration).toBe(1)
    expect(off.some((c) => c.id === 'insert')).toBe(false)
    expect(totalDuration(on)).toBe(totalDuration(off))
  })

  it('centers each split subject in its own half', () => {
    expect(splitViewShift('x')).toEqual({ a: [0.25, 0], b: [-0.25, 0] })
    expect(splitViewShift('y')).toEqual({ a: [0, 0.25], b: [0, -0.25] })
  })
})

describe('Edit · Structure GSAP lifecycle', () => {
  afterEach(() => {
    cleanup()
  })

  const activeTweens = () =>
    gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())

  it.each([
    ['Montage', MontageDemo],
    ['Cross-cutting', CrossCuttingDemo],
    ['Insert Shot', InsertShotDemo],
  ])('%s starts no tween until 재생 and leaves none after unmount', (_, Demo) => {
    const before = gsap.globalTimeline.getChildren(true, true, true).length
    const { unmount } = render(createElement(Demo))
    expect(gsap.globalTimeline.getChildren(true, true, true).length).toBe(before)

    fireEvent.click(screen.getByRole('button', { name: '재생' }))
    expect(gsap.globalTimeline.getChildren(true, true, true).length).toBeGreaterThan(before)

    unmount()
    expect(activeTweens()).toHaveLength(0)
  })
})
