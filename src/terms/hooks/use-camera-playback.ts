import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useLayoutEffect, useRef, useState } from 'react'

gsap.registerPlugin(useGSAP)

interface CameraPlaybackOptions {
  /** 재생 시간(초) */
  duration: number
  /** GSAP ease. progress에 적용된다. */
  ease?: string
  /** 매 프레임과 재생·reset 직전(0)에 불린다. 3D 카메라 ref 갱신용. */
  onTick?: (progress: number) => void
}

/**
 * Camera 데모의 재생 시계. 버튼을 눌러야 시작해 progress를 0 → 1로 한 번 진행한다(D-9, D-12).
 * tween은 언마운트·reset·재시작 때 되돌려진다.
 */
export function useCameraPlayback({ duration, ease = 'none', onTick }: CameraPlaybackOptions) {
  const scopeRef = useRef<HTMLDivElement>(null)
  const onTickRef = useRef(onTick)
  const [progress, setProgress] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [playing, setPlaying] = useState(false)

  useLayoutEffect(() => {
    onTickRef.current = onTick
  })

  useGSAP(
    () => {
      if (playCount === 0) return
      const proxy = { p: 0 }
      gsap.to(proxy, {
        p: 1,
        duration,
        ease,
        onUpdate: () => {
          onTickRef.current?.(proxy.p)
          setProgress(proxy.p)
        },
        onComplete: () => setPlaying(false),
      })
    },
    { scope: scopeRef, dependencies: [playCount], revertOnUpdate: true },
  )

  function replay() {
    onTick?.(0)
    setProgress(0)
    setPlaying(true)
    setPlayCount((count) => count + 1)
  }

  /** 정지 상태의 처음으로. 방향 토글처럼 설정을 바꿀 때 부른다. */
  function reset() {
    onTick?.(0)
    setProgress(0)
    setPlaying(false)
    setPlayCount(0)
  }

  const stageProps = { playing, replayLabel: playCount > 0 ? '다시 재생' : '재생', onReplay: replay }

  return { scopeRef, progress, playing, reset, stageProps }
}
