import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import section from '@terms/data/motion'
import {
  BounceDemo,
  DurationDelayDemo,
  EasingDemo,
  KeyframeDemo,
  LoopDemo,
  SpringDemo,
  StaggerDemo,
  TimelineDemo,
} from '@terms/demos/motion-timing'
import {
  BOUNCE_STEPS,
  EASES,
  positionParam,
  snapOverlap,
  springDuration,
  springEase,
  springOvershoot,
  springValue,
  timelineStarts,
} from '@terms/lib/motion-timing-sequence-math'

afterEach(() => {
  cleanup()
})

const IDS = ['easing', 'spring', 'bounce', 'duration-delay', 'stagger', 'loop', 'keyframe', 'timeline']
const tweens = () => gsap.globalTimeline.getChildren(true, true, true)
const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const slide = (name: string, value: number) =>
  fireEvent.change(screen.getByRole('slider', { name }), { target: { value: String(value) } })
/** 마지막에 만든 timeline */
const root = () => gsap.globalTimeline.getChildren(false, false, true).at(-1) as gsap.core.Timeline
const jump = (time: number) => act(() => void root().pause().time(time))
const all = (container: HTMLElement, selector: string) => Array.from(container.querySelectorAll<HTMLElement>(selector))
const prop = (element: Element, name: string) => Number(gsap.getProperty(element, name))

describe('Motion · Timing & Sequence data', () => {
  const timing = section.categories.find(({ id }) => id === 'timing-sequence')!

  it('registers the 8 cards in document order with matching demos', async () => {
    expect(timing.terms.map(({ id }) => id)).toEqual(IDS)
    expect(Object.keys(await timing.loadDemos())).toEqual(IDS)
  })

  it('connects excluded terms and shows the repo example only on Easing', () => {
    const aliases = (id: string) => timing.terms.find((term) => term.id === id)!.aliases
    expect(aliases('easing')).toContain('Smooth Transition')
    expect(aliases('duration-delay')).toContain('Smooth Transition')
    expect(aliases('timeline')).toContain('Reverse')
    expect(timing.terms.filter(({ repoExample }) => repoExample).map(({ id }) => id)).toEqual(['easing'])
  })
})

describe('Motion · Timing & Sequence math', () => {
  it('uses velocity curves that are the derivative of the GSAP eases', () => {
    for (const { gsapEase, velocity } of EASES) {
      const ease = gsap.parseEase(gsapEase)
      for (const t of [0.1, 0.3, 0.7, 0.9]) {
        expect((ease(t + 1e-4) - ease(t - 1e-4)) / 2e-4).toBeCloseTo(velocity(t), 3)
      }
    }
  })

  it('overshoots and settles an underdamped spring, never overshoots a heavily damped one', () => {
    const loose = { stiffness: 180, damping: 14 }
    const samples = Array.from({ length: 200 }, (_, i) => springValue(loose, i / 100))
    expect(samples[0]).toBeCloseTo(0)
    expect(Math.max(...samples) - 1).toBeCloseTo(springOvershoot(loose), 2)
    expect(springValue(loose, springDuration(loose))).toBeCloseTo(1, 2)
    expect(springEase(loose)(1)).toBe(1)

    for (const heavy of [{ stiffness: 100, damping: 20 }, { stiffness: 50, damping: 40 }]) {
      expect(springOvershoot(heavy)).toBe(0)
      const values = Array.from({ length: 600 }, (_, i) => springValue(heavy, i / 100))
      expect(Math.max(...values)).toBeLessThanOrEqual(1)
      expect(values.at(-1)).toBeCloseTo(1, 2)
    }
    expect(springOvershoot({ stiffness: 180, damping: 5 })).toBeGreaterThan(springOvershoot(loose))
  })

  it('bounces exactly twice after the fall, each lower than before', () => {
    const peaks = BOUNCE_STEPS.map(({ height }) => height).filter((height) => height > 0)
    expect(peaks).toHaveLength(2)
    expect(peaks[1]).toBeLessThan(peaks[0]!)
    expect(BOUNCE_STEPS.at(-1)!.height).toBe(0)
  })

  it('places tracks from the overlaps', () => {
    const starts = timelineStarts(0.15, 0)
    expect(starts.subtitle).toBeCloseTo(0.35)
    expect(starts.button).toBeCloseTo(0.85)
    expect(starts.end).toBeCloseTo(1.25)
    expect(positionParam(0.15)).toBe('-=0.15')
    expect(positionParam(-0.1)).toBe('+=0.1')
    expect([snapOverlap(0.17), snapOverlap(9), snapOverlap(-9)]).toEqual([0.15, 0.4, -0.3])
  })
})

describe('Motion · Timing & Sequence demos', () => {
  it.each([
    ['Easing', EasingDemo, '재생'],
    ['Spring', SpringDemo, '재생'],
    ['Bounce', BounceDemo, '재생'],
    ['Duration / Delay', DurationDelayDemo, '재생'],
    ['Stagger', StaggerDemo, '재생'],
    ['Loop', LoopDemo, '재생'],
    ['Keyframe', KeyframeDemo, '재생'],
    ['Timeline', TimelineDemo, '재생'],
  ])('%s: no tween before 재생, a speed slider, nothing left after unmount', (_, Demo, button) => {
    const before = tweens().length
    const { unmount } = render(createElement(Demo))
    expect(tweens().length).toBe(before)
    expect(screen.getByRole('slider', { name: '재생 속도' })).toBeDefined()
    press(button)
    expect(tweens().length).toBeGreaterThan(before)
    unmount()
    expect(tweens().length).toBe(before)
  })

  it('Easing moves the balls and curve dots by their own ease', () => {
    const { container } = render(<EasingDemo />)
    press('재생')
    jump(0.35)
    const x = EASES.map(({ kind }) => prop(container.querySelector(`.ease-mover-${kind}`)!, 'xPercent'))
    expect(x[0]).toBeCloseTo(25, 1)
    expect(x[1]).toBeLessThan(x[3]!)
    expect(x[2]).toBeGreaterThan(x[0]!)
    expect(all(container, '.ease-dot').map((dot) => Number(dot.getAttribute('cx')))).toEqual([27, 27, 27, 27])
  })

  it('Spring starts from the card and reports overshoot as text', () => {
    const { container } = render(<SpringDemo />)
    expect(screen.getByText('목표를 15% 지나쳤다 돌아옴')).toBeDefined()
    slide('damping', 30)
    expect(screen.getByText('목표를 지나치지 않음')).toBeDefined()
    slide('damping', 14)
    press('카드 누르기')
    const card = container.querySelector('.spring-card')!
    act(() => void root().progress(1))
    expect(prop(card, 'scaleX')).toBeCloseTo(1.35)
  })

  it('Bounce never goes below the floor while Spring passes the target line', () => {
    const { container } = render(<BounceDemo />)
    press('재생')
    const bounce: number[] = []
    const spring: number[] = []
    const duration = root().duration()
    for (let i = 0; i <= 200; i++) {
      jump((duration * i) / 200)
      bounce.push(prop(container.querySelector('.bounce-check')!, 'y'))
      spring.push(prop(container.querySelector('.spring-check')!, 'y'))
    }
    expect(Math.max(...bounce)).toBeLessThanOrEqual(0)
    expect(Math.max(...spring)).toBeGreaterThan(5)
    expect(bounce.at(-1)).toBe(0)
    const landings = bounce.filter((y, i) => i > 0 && bounce[i - 1]! < y && (bounce[i + 1] ?? y) <= y && y > -3)
    expect(landings).toHaveLength(3)
  })

  it('Duration / Delay holds the description for 0.2s', () => {
    const { container } = render(<DurationDelayDemo />)
    press('재생')
    jump(0.1)
    expect(prop(container.querySelector('.delay-title')!, 'opacity')).toBeGreaterThan(0)
    expect(prop(container.querySelector('.delay-description')!, 'opacity')).toBe(0)
    jump(0.6)
    expect(prop(container.querySelector('.delay-description')!, 'opacity')).toBe(1)
  })

  it('Stagger orders the cards from the start or the center with the chosen gap', () => {
    const { container } = render(<StaggerDemo />)
    const opacities = () => all(container, '.stagger-card').map((card) => prop(card, 'opacity'))
    slide('간격', 0.3)
    press('재생')
    jump(0.2)
    expect(opacities()[0]).toBeGreaterThan(0)
    expect(opacities().slice(1)).toEqual([0, 0, 0, 0, 0])

    press('가운데부터')
    press('재생')
    jump(0.2)
    const center = opacities()
    expect(center[2]).toBeGreaterThan(0)
    expect(center[3]).toBe(center[2])
    expect(center[0]).toBe(0)
    expect(center[5]).toBe(0)
  })

  it('Loop starts stopped, keeps a 4s cycle, and changes speed without restarting', () => {
    const before = tweens().length
    const { unmount } = render(<LoopDemo />)
    expect(screen.getAllByTestId('loop-float')).toHaveLength(1)
    press('다섯 개 동시')
    expect(screen.getAllByTestId('loop-float')).toHaveLength(5)
    expect(tweens().length).toBe(before)

    press('재생')
    const timeline = root()
    expect(timeline.paused()).toBe(false)
    const first = screen.getAllByTestId('loop-float')[0]!
    for (const [time, y] of [[2, -14], [4, 0], [10, -14], [12, 0]] as const) {
      jump(time)
      expect(prop(first, 'y')).toBeCloseTo(y)
    }
    act(() => void timeline.resume())
    slide('재생 속도', 2)
    expect(root()).toBe(timeline)
    expect(timeline.timeScale()).toBe(2)

    press('한 개만')
    expect(root().paused()).toBe(false)
    expect(root().timeScale()).toBe(2)
    press('일시정지')
    expect(root().paused()).toBe(true)
    unmount()
    expect(tweens().length).toBe(before)
  })

  it('Keyframe peaks at the chosen middle point while Transition never passes 1', () => {
    const { container } = render(<KeyframeDemo />)
    const scale = (name: string) => prop(container.querySelector(`.${name}-badge`)!, 'scaleX')
    slide('중간 keyframe 위치', 25)
    press('재생')
    jump(1.6 * 0.25)
    expect(scale('keyframe')).toBeCloseTo(1.2)
    expect(scale('transition')).toBeLessThan(0.5)
    jump(1.6)
    expect(scale('keyframe')).toBeCloseTo(1)
    expect(scale('transition')).toBeCloseTo(1)
    slide('중간 keyframe 위치', 0)
    expect((screen.getByRole('slider', { name: '중간 keyframe 위치' }) as HTMLInputElement).value).toBe('10')
  })

  it('Timeline replays on an overlap change, scrubs, and reverses even after a speed change', () => {
    const { container, unmount } = render(<TimelineDemo />)
    const before = tweens().length
    const reverse = () => screen.getByRole('button', { name: /되감기/ }) as HTMLButtonElement
    expect(reverse().disabled).toBe(true)

    fireEvent.keyDown(screen.getByRole('button', { name: /부제 막대: 0.15초 겹침/ }), { key: 'ArrowLeft' })
    expect(screen.getByRole('button', { name: /부제 막대: 0.20초 겹침/ })).toBeDefined()
    expect(root().paused()).toBe(false)
    expect(root().duration()).toBeCloseTo(1.2)

    slide('타임라인 스크러버', 50)
    expect(root().paused()).toBe(true)
    expect(root().progress()).toBeCloseTo(0.5)
    expect(prop(container.querySelector('.tl-title')!, 'opacity')).toBe(1)
    expect(prop(container.querySelector('.tl-button')!, 'opacity')).toBe(0)

    fireEvent.click(reverse())
    expect([root().reversed(), root().paused()]).toEqual([true, false])
    slide('재생 속도', 2)
    expect([root().reversed(), Math.abs(root().timeScale())]).toEqual([true, 2])
    unmount()
    expect(tweens().length).toBeLessThanOrEqual(before)
  })
})
