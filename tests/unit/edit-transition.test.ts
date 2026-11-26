import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { sections } from '@terms/data'
import {
  FadeToBlackDemo,
  IrisDemo,
  JCutLCutDemo,
  JumpCutDemo,
  MatchCutDemo,
  SmashCutDemo,
  WhipPanDemo,
  WipeDemo,
} from '@terms/demos/edit-transition'
import {
  FADE_DURATION,
  IRIS_DURATION,
  JUMP_EDITED_DURATION,
  SMASH_CUT_AT,
  WHIP_DURATION,
  WHIP_WINDOW,
  WIPE_DURATION,
  audioClipAt,
  audioLevelAt,
  fadeStateAt,
  hardCutAt,
  irisRadiusAt,
  jumpCutHeroX,
  jumpCutSourceAt,
  matchedDistance,
  sphereScreenRadius,
  splitEditAudioCut,
  whipPanAt,
  wipeProgressAt,
} from '@terms/lib/edit-transition-math'

afterEach(() => {
  cleanup()
})

describe('Edit · Transition cards', () => {
  it('registers 9 cards in document order with filmmaking text', () => {
    const transition = sections.find((s) => s.id === 'edit')!.categories.find((c) => c.id === 'transition')!
    expect(transition.terms.map((t) => t.id)).toEqual([
      'jump-cut',
      'dissolve',
      'wipe',
      'match-cut',
      'whip-pan',
      'smash-cut',
      'iris',
      'fade-to-black',
      'j-cut-l-cut',
    ])
    for (const term of transition.terms) {
      expect(term.filmmaking?.trim().length).toBeGreaterThan(0)
    }
  })
})

describe('Edit · Transition math', () => {
  it('switches a hard cut without intermediate values', () => {
    expect(hardCutAt(SMASH_CUT_AT - 0.001, SMASH_CUT_AT)).toBe(0)
    expect(hardCutAt(SMASH_CUT_AT, SMASH_CUT_AT)).toBe(1)
  })

  it('skips the removed source time in a Jump Cut', () => {
    expect(jumpCutSourceAt(0)).toEqual({ index: 0, sourceTime: 0 })
    expect(jumpCutSourceAt(0.999).sourceTime).toBeCloseTo(0.999)
    expect(jumpCutSourceAt(1)).toEqual({ index: 1, sourceTime: 3 })
    expect(jumpCutSourceAt(2)).toEqual({ index: 2, sourceTime: 6 })
    expect(jumpCutSourceAt(JUMP_EDITED_DURATION)).toEqual({ index: 2, sourceTime: 7 })
    expect(jumpCutHeroX(3) - jumpCutHeroX(1)).toBeCloseTo(0.6)
  })

  it('moves the Wipe boundary only inside the transition window', () => {
    expect(wipeProgressAt(0)).toBe(0)
    expect(wipeProgressAt(1.5)).toBeCloseTo(0.5)
    expect(wipeProgressAt(WIPE_DURATION)).toBe(1)
  })

  it('matches the on-screen size of both Match Cut spheres', () => {
    const distance = matchedDistance(1.15, 20, 0.5)
    expect(sphereScreenRadius(0.5, distance, 24)).toBeCloseTo(sphereScreenRadius(1.15, 20, 24), 10)
  })

  it('hides the Whip Pan cut at the blur peak', () => {
    expect(whipPanAt(0)).toEqual({ scene: 0, pan: 0, blur: 0 })
    const before = whipPanAt(WHIP_WINDOW.cut - 0.001)
    const atCut = whipPanAt(WHIP_WINDOW.cut)
    expect(before.scene).toBe(0)
    expect(atCut.scene).toBe(1)
    expect(before.pan).toBeGreaterThan(0.99)
    expect(atCut.pan).toBe(-1)
    expect(atCut.blur).toBeGreaterThan(before.blur * 0.99)
    expect(whipPanAt(WHIP_DURATION).blur).toBe(0)
  })

  it('closes and opens the Iris', () => {
    expect(irisRadiusAt(0, 'out')).toBe(75)
    expect(irisRadiusAt(IRIS_DURATION, 'out')).toBe(0)
    expect(irisRadiusAt(0, 'in')).toBe(0)
    expect(irisRadiusAt(IRIS_DURATION, 'in')).toBe(75)
  })

  it('passes through full black only in Fade to Black mode', () => {
    expect(fadeStateAt(0, 'fade')).toEqual({ mix: 0, brightness: 1 })
    expect(fadeStateAt(2, 'fade').brightness).toBe(0)
    expect(fadeStateAt(1.99, 'fade').mix).toBe(0)
    expect(fadeStateAt(2, 'fade').mix).toBe(1)
    expect(fadeStateAt(FADE_DURATION, 'fade')).toEqual({ mix: 1, brightness: 1 })
    expect(fadeStateAt(2, 'dissolve').brightness).toBe(1)
    expect(fadeStateAt(2, 'dissolve').mix).toBeCloseTo(0.5)
  })

  it('moves the audio cut one second earlier for J-Cut and later for L-Cut', () => {
    expect(splitEditAudioCut('straight')).toBe(2)
    expect(splitEditAudioCut('j')).toBe(1)
    expect(splitEditAudioCut('l')).toBe(3)
  })

  it('keeps the quiet waveform near zero and the alarm near maximum', () => {
    for (let t = 0; t < 4; t += 0.05) {
      expect(audioLevelAt('quiet', t)).toBeLessThan(0.1)
      expect(audioLevelAt('alarm', t)).toBeGreaterThan(0.8)
      expect(audioLevelAt('alarm', t)).toBeLessThanOrEqual(1)
    }
    const clips = [
      { label: 'a', kind: 'quiet' as const, start: 0, end: 2 },
      { label: 'b', kind: 'alarm' as const, start: 2, end: 4 },
    ]
    expect(audioClipAt(clips, 1.99).label).toBe('a')
    expect(audioClipAt(clips, 2).label).toBe('b')
    expect(audioClipAt(clips, 4).label).toBe('b')
  })
})

describe('Edit · Transition GSAP cleanup', () => {
  const demos = {
    JumpCutDemo,
    WipeDemo,
    MatchCutDemo,
    WhipPanDemo,
    SmashCutDemo,
    IrisDemo,
    FadeToBlackDemo,
    JCutLCutDemo,
  }

  it.each(Object.entries(demos))('%s starts idle and leaves no tween after unmount', (_name, Demo) => {
    const tweens = () => gsap.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive())
    const before = gsap.globalTimeline.getChildren(true, true, true).length
    const { unmount } = render(createElement(Demo))
    expect(gsap.globalTimeline.getChildren(true, true, true).length).toBe(before)
    fireEvent.click(screen.getByRole('button', { name: '재생' }))
    expect(screen.getByRole('button', { name: '재생 중…' })).toBeTruthy()
    unmount()
    expect(tweens().length).toBe(0)
  })
})
