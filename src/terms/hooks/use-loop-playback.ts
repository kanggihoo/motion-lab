import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState, type FocusEvent } from 'react'

gsap.registerPlugin(useGSAP)

/**
 * Loop·Marquee의 반복 재생(D-12). 처음에는 멈춰 있고 tween도 없다. 토글로 시작·일시정지한다.
 * `build`는 빈 timeline에 `repeat: -1` tween을 채운다. `dependencies`가 바뀌면 처음부터 다시 만들고
 * 재생 중이었는지는 유지한다. 언마운트 때 되돌려진다.
 */
export function useLoopPlayback(
  build: (timeline: gsap.core.Timeline) => void,
  { dependencies = [] }: { dependencies?: unknown[] } = {},
) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const runningRef = useRef(false)
  const hoverRef = useRef(false)
  const focusRef = useRef(false)
  const [started, setStarted] = useState(false)
  const [running, setRunning] = useState(false)

  function apply() {
    timelineRef.current?.paused(!runningRef.current || hoverRef.current || focusRef.current)
  }

  useGSAP(
    () => {
      if (!started) return
      const timeline = gsap.timeline()
      timelineRef.current = timeline
      build(timeline)
      apply()
      return () => {
        timelineRef.current = null
      }
    },
    { scope: scopeRef, dependencies: [started, ...dependencies], revertOnUpdate: true },
  )

  function toggle() {
    runningRef.current = !runningRef.current
    setRunning(runningRef.current)
    setStarted(true)
    apply()
  }

  function hold(ref: { current: boolean }, value: boolean) {
    ref.current = value
    apply()
  }

  return {
    scopeRef,
    timelineRef,
    running,
    toggle,
    /** `<MotionStage loop={loop}>` */
    loop: { running, onToggle: toggle },
    /**
     * hover나 focus 동안만 잠깐 멈추는 영역에 펼친다(Marquee). 토글 상태는 바꾸지 않는다.
     * 키보드로도 멈추려면 그 영역이나 안쪽 요소가 focus를 받을 수 있어야 한다.
     */
    holdProps: {
      onPointerEnter: () => hold(hoverRef, true),
      onPointerLeave: () => hold(hoverRef, false),
      onFocus: () => hold(focusRef, true),
      onBlur: (event: FocusEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hold(focusRef, false)
      },
    },
  }
}
