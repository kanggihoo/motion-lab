import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useRef, useState } from 'react'

gsap.registerPlugin(useGSAP)

/**
 * Motion 데모의 시간 재생(D-9, D-12). `replay()`를 부르기 전에는 tween이 하나도 없다.
 * `build`는 빈 timeline을 받아 채운다. 재시작·`reset()`·언마운트 때 되돌려진다.
 * `build` 안의 selector 문자열은 `scopeRef` 아래에서만 찾는다.
 */
export function useMotionPlayback(build: (timeline: gsap.core.Timeline) => void) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const rateRef = useRef(1)
  /** 다음에 만들 timeline의 시작 위치. null이면 처음부터 재생, 숫자면 그 진행률에 멈춘다. */
  const seekRef = useRef<number | null>(null)
  // id는 늘기만 한다. 한 event에서 reset() 뒤 replay()를 불러도 다시 만들어진다.
  const [run, setRun] = useState({ id: 0, active: false })
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)

  useGSAP(
    () => {
      if (!run.active) return
      const timeline = gsap.timeline({
        onComplete: () => setPlaying(false),
        onReverseComplete: () => setPlaying(false),
      })
      timelineRef.current = timeline
      build(timeline)
      timeline.timeScale(rateRef.current)
      if (seekRef.current !== null) timeline.pause().progress(seekRef.current)
      return () => {
        timelineRef.current = null
      }
    },
    { scope: scopeRef, dependencies: [run.id], revertOnUpdate: true },
  )

  function replay() {
    seekRef.current = null
    setPlaying(true)
    setRun(({ id }) => ({ id: id + 1, active: true }))
  }

  /** 재생 전의 정지 화면으로. 설정(방향 등)을 바꿀 때 부른다. */
  function reset() {
    setPlaying(false)
    setRun(({ id }) => ({ id: id + 1, active: false }))
  }

  /** 진행률(0~1)로 옮기고 멈춘다. 스크러버용. */
  function seek(progress: number) {
    seekRef.current = progress
    setPlaying(false)
    if (timelineRef.current) timelineRef.current.pause().progress(progress)
    else setRun(({ id }) => ({ id: id + 1, active: true }))
  }

  function changeRate(next: number) {
    rateRef.current = next
    setRate(next)
    timelineRef.current?.timeScale(next)
  }

  return {
    scopeRef,
    timelineRef,
    playing,
    replay,
    reset,
    seek,
    /** `<MotionStage {...stageProps}>` */
    stageProps: { playing, replayLabel: run.active ? ('다시 재생' as const) : ('재생' as const), onReplay: replay },
    /** 속도 슬라이더가 필요한 카드만 `<MotionStage speed={speed}>` */
    speed: { rate, onChange: changeRate },
  }
}
