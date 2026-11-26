import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { useEffect } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MotionStage } from '@terms/components/stages/MotionStage'
import motion from '@terms/data/motion'
import { FINE_POINTER_QUERY, useFinePointer } from '@terms/hooks/use-fine-pointer'
import { useInnerScroller } from '@terms/hooks/use-inner-scroller'
import { useLoopPlayback } from '@terms/hooks/use-loop-playback'
import { useMotionPlayback } from '@terms/hooks/use-motion-playback'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  cleanup()
  window.matchMedia = originalMatchMedia
})

const tweens = () => gsap.globalTimeline.getChildren(true, true, true)
const button = (name: string) => screen.getByRole('button', { name })

let playback: ReturnType<typeof useMotionPlayback>

function PlaybackDemo() {
  const api = useMotionPlayback((timeline) => {
    timeline.to('.box', { x: 100, duration: 1, ease: 'none' })
  })
  const { scopeRef, stageProps, speed } = api
  useEffect(() => {
    playback = api
  })
  return (
    <div ref={scopeRef}>
      <MotionStage {...stageProps} speed={speed}>
        <div className="box" data-testid="box" />
      </MotionStage>
    </div>
  )
}

let loopPlayback: ReturnType<typeof useLoopPlayback>

function LoopDemo({ distance = 10 }: { distance?: number }) {
  const api = useLoopPlayback(
    (timeline) => {
      timeline.to('.box', { x: distance, duration: 1, repeat: -1, yoyo: true })
    },
    { dependencies: [distance] },
  )
  const { scopeRef, loop, holdProps } = api
  useEffect(() => {
    loopPlayback = api
  })
  return (
    <div ref={scopeRef}>
      <MotionStage loop={loop}>
        <div {...holdProps} data-testid="area">
          <button type="button" className="box">항목</button>
        </div>
      </MotionStage>
    </div>
  )
}

describe('MotionStage', () => {
  it('renders no control row without optional props', () => {
    render(<MotionStage>데모</MotionStage>)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('exposes labelled controls and the card slot', () => {
    const onToggle = vi.fn()
    const onChange = vi.fn()
    render(
      <MotionStage controls={<button type="button">방향</button>} loop={{ running: true, onToggle }} speed={{ rate: 1, onChange }}>
        데모
      </MotionStage>,
    )
    expect(button('방향')).toBeDefined()
    fireEvent.click(button('일시정지'))
    expect(onToggle).toHaveBeenCalledOnce()
    const slider = screen.getByRole('slider', { name: '재생 속도' }) as HTMLInputElement
    expect([slider.min, slider.max, slider.getAttribute('aria-valuetext')]).toEqual(['0.25', '2', '1×'])
    fireEvent.change(slider, { target: { value: '0.25' } })
    expect(onChange).toHaveBeenCalledWith(0.25)
    expect(screen.queryByRole('button', { name: /다시 재생/ })).toBeNull()
  })
})

describe('useMotionPlayback', () => {
  it('creates no tween before the button, then applies speed and cleans up on unmount', () => {
    const before = tweens().length
    const { unmount } = render(<PlaybackDemo />)
    expect(tweens().length).toBe(before)

    fireEvent.change(screen.getByRole('slider', { name: '재생 속도' }), { target: { value: '2' } })
    expect(tweens().length).toBe(before)

    fireEvent.click(button('재생'))
    expect(playback.timelineRef.current?.timeScale()).toBe(2)
    expect(button('재생 중…')).toBeDefined()
    fireEvent.change(screen.getByRole('slider', { name: '재생 속도' }), { target: { value: '0.5' } })
    expect(playback.timelineRef.current?.timeScale()).toBe(0.5)

    act(() => void playback.timelineRef.current?.progress(1))
    expect(button('다시 재생')).toBeDefined()

    unmount()
    expect(tweens().length).toBe(before)
  })

  it('replaces the timeline on replay, even right after reset, and reset restores the initial state', () => {
    const before = tweens().length
    render(<PlaybackDemo />)
    fireEvent.click(button('재생'))
    const first = playback.timelineRef.current
    const count = tweens().length

    act(() => {
      playback.reset()
      playback.replay()
    })
    expect(playback.timelineRef.current).not.toBe(first)
    expect(tweens().length).toBe(count)

    act(() => void playback.timelineRef.current?.progress(0.5))
    expect(screen.getByTestId('box').style.transform).not.toBe('')
    act(() => playback.reset())
    expect(tweens().length).toBe(before)
    expect(screen.getByTestId('box').style.transform).toBe('')
    expect(button('재생')).toBeDefined()
  })

  it('seeks to a paused position before and after playing', () => {
    render(<PlaybackDemo />)
    act(() => playback.seek(0.25))
    expect(playback.timelineRef.current?.paused()).toBe(true)
    expect(playback.timelineRef.current?.progress()).toBeCloseTo(0.25)
    act(() => playback.seek(0.75))
    expect(playback.timelineRef.current?.progress()).toBeCloseTo(0.75)
  })
})

describe('useLoopPlayback', () => {
  it('starts stopped, toggles, and leaves nothing after unmount', () => {
    const before = tweens().length
    const { unmount, rerender } = render(<LoopDemo />)
    expect(tweens().length).toBe(before)

    fireEvent.click(button('재생'))
    expect(loopPlayback.timelineRef.current?.paused()).toBe(false)
    const count = tweens().length
    fireEvent.click(button('일시정지'))
    expect(loopPlayback.timelineRef.current?.paused()).toBe(true)

    // 설정이 바뀌면 다시 만들되 정지 상태를 유지하고 이전 tween은 남기지 않는다.
    rerender(<LoopDemo distance={20} />)
    expect(loopPlayback.timelineRef.current?.paused()).toBe(true)
    expect(tweens().length).toBe(count)

    unmount()
    expect(tweens().length).toBe(before)
  })

  it('holds while hovered or focused without changing the toggle', () => {
    render(<LoopDemo />)
    fireEvent.click(button('재생'))
    const paused = () => loopPlayback.timelineRef.current?.paused()
    const area = screen.getByTestId('area')

    fireEvent.pointerEnter(area)
    fireEvent.focus(button('항목'))
    fireEvent.pointerLeave(area)
    expect(paused()).toBe(true)
    expect(button('일시정지')).toBeDefined()
    fireEvent.blur(button('항목'))
    expect(paused()).toBe(false)
  })
})

describe('useFinePointer', () => {
  function Probe() {
    return <output>{useFinePointer() ? 'fine' : 'coarse'}</output>
  }

  it('follows the (hover: hover) and (pointer: fine) media query', () => {
    let matches = false
    const listeners = new Set<() => void>()
    window.matchMedia = ((query: string) => ({
      matches: query === FINE_POINTER_QUERY && matches,
      media: query,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    })) as unknown as typeof window.matchMedia

    const { unmount } = render(<Probe />)
    expect(screen.getByRole('status').textContent).toBe('coarse')
    act(() => {
      matches = true
      listeners.forEach((listener) => listener())
    })
    expect(screen.getByRole('status').textContent).toBe('fine')
    unmount()
    expect(listeners.size).toBe(0)
  })
})

describe('useInnerScroller', () => {
  it('reports the scroll ratio on mount and on scroll through a focusable named region', () => {
    const onScroll = vi.fn()
    function Probe() {
      const { scrollerProps } = useInnerScroller({ label: '내부 스크롤', onScroll })
      return <section {...scrollerProps}>내용</section>
    }
    render(<Probe />)
    const region = screen.getByRole('region', { name: '내부 스크롤' })
    expect(region.tabIndex).toBe(0)
    expect(onScroll).toHaveBeenLastCalledWith(0)

    Object.defineProperties(region, { scrollHeight: { value: 300 }, clientHeight: { value: 100 } })
    region.scrollTop = 50
    fireEvent.scroll(region)
    expect(onScroll).toHaveBeenLastCalledWith(0.25)
  })
})

describe('Motion data skeleton', () => {
  it('declares six categories in document order', () => {
    expect(motion.categories.map(({ id }) => id)).toEqual([
      'basics', 'timing-sequence', 'text-graphic', 'scroll', 'transition', 'pointer-event',
    ])
  })
})
