import { createPortal, useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import {
  COMPOSER_MODES,
  DEFAULT_LOOK_POST_EFFECT,
  WIPE_SHAPES,
  createDualComposerResources,
  setLensUniforms,
  type ComposerMode,
  type LensPostEffect,
  type LookPostEffect,
  type WipeShape,
} from './look-post'
import { DEFAULT_CAMERA } from './scene-layout'

interface CameraSpec {
  position: [number, number, number]
  lookAt: [number, number, number]
  fov: number
  /** 화면 폭·높이 비율 단위의 view offset. 분할 칸 중앙에 피사체를 둘 때 쓴다 */
  viewShift?: [number, number]
}

interface DualSceneComposerProps {
  sceneA: ReactNode
  sceneB: ReactNode
  mode: ComposerMode
  progressRef: RefObject<number>
  postEffectRef?: RefObject<LookPostEffect>
  cameraA?: CameraSpec
  cameraB?: CameraSpec
  /** mode='split'의 분할 방향. 'x'는 A 왼쪽·B 오른쪽, 'y'는 A 위·B 아래 */
  splitAxis?: 'x' | 'y'
  /** mode='wipe'의 경계선 모양 */
  wipeShape?: WipeShape
  /** 가로 블러 폭(화면 너비 비율) */
  blurRef?: RefObject<number>
  /**
   * 렌즈·초점 후처리. 처음부터 주거나 끝까지 주지 않는다(depth texture를 처음에 만든다).
   * 있으면 다시 렌더될 때와 크기가 바뀔 때만 그리므로, 장면의 변화는 prop으로 전달해야 한다.
   */
  lens?: LensPostEffect
}

/** lens 화면이 한 번의 변화 뒤에 다시 그리는 프레임 수 */
const LENS_FRAMES = 3

function configureCamera(cam: THREE.PerspectiveCamera, spec: CameraSpec, aspect: number) {
  cam.position.set(...spec.position)
  cam.fov = spec.fov
  cam.aspect = aspect
  cam.lookAt(...spec.lookAt)
  if (spec.viewShift) {
    const [x, y] = spec.viewShift
    cam.setViewOffset(aspect, 1, x * aspect, y, aspect, 1)
  } else {
    cam.clearViewOffset()
    cam.updateProjectionMatrix()
  }
}

export function DualSceneComposer({
  sceneA,
  sceneB,
  mode,
  progressRef,
  postEffectRef,
  cameraA = DEFAULT_CAMERA,
  cameraB = DEFAULT_CAMERA,
  splitAxis = 'x',
  wipeShape = 'horizontal',
  blurRef,
  lens,
}: DualSceneComposerProps) {
  const resRef = useRef<ReturnType<typeof createDualComposerResources> | null>(null)
  if (!resRef.current) {
    resRef.current = createDualComposerResources(mode, lens !== undefined)
  }

  const lastSizeRef = useRef({ w: 0, h: 0 })
  const pendingFramesRef = useRef(LENS_FRAMES)

  useLayoutEffect(() => {
    pendingFramesRef.current = LENS_FRAMES
  })

  useEffect(() => {
    if (resRef.current) {
      resRef.current.uniforms.uMode.value = COMPOSER_MODES[mode]
    }
  }, [mode])

  useEffect(() => {
    return () => {
      resRef.current?.dispose()
      resRef.current = null
    }
  }, [])

  useFrame(({ gl, size }) => {
    const res = resRef.current
    if (!res) return

    const dpr = gl.getPixelRatio() * (lens?.mode === 'fisheye' ? lens.renderScale : 1)
    const w = Math.max(1, Math.floor(size.width * dpr))
    const h = Math.max(1, Math.floor(size.height * dpr))
    if (lastSizeRef.current.w !== w || lastSizeRef.current.h !== h) {
      res.targetA.setSize(w, h)
      res.targetB.setSize(w, h)
      lastSizeRef.current = { w, h }
      pendingFramesRef.current = LENS_FRAMES
    }

    if (lens) {
      // 비싼 흐림을 정지 화면에서 매 프레임 반복하지 않는다. 그리지 않으면 canvas는 마지막 화면을 유지한다.
      if (pendingFramesRef.current === 0) return
      pendingFramesRef.current -= 1
    }

    const aspect = size.width / Math.max(1, size.height)
    configureCamera(res.camA, cameraA, aspect)
    configureCamera(res.camB, cameraB, aspect)

    const fx = postEffectRef?.current ?? DEFAULT_LOOK_POST_EFFECT
    res.uniforms.uProgress.value = progressRef.current
    res.uniforms.uSplitAxis.value = splitAxis === 'y' ? 1 : 0
    res.uniforms.uWipeShape.value = WIPE_SHAPES[wipeShape]
    res.uniforms.uBlurX.value = blurRef?.current ?? 0
    res.uniforms.uGradePreset.value = fx.gradePreset
    res.uniforms.uDfnDarken.value = fx.dfnDarken
    res.uniforms.uDfnBlue.value = fx.dfnBlue
    res.uniforms.uDfnSkyDarken.value = fx.dfnSkyDarken
    res.uniforms.uGrainAmount.value = fx.grainAmount
    res.uniforms.uLetterboxBar.value = fx.letterboxBar
    res.uniforms.uVignetteAmount.value = fx.vignetteAmount
    res.uniforms.uVignetteFeather.value = fx.vignetteFeather
    res.uniforms.uAspect.value = aspect
    if (lens) setLensUniforms(res.uniforms, lens)
    else res.uniforms.uLens.value = 0

    const prevTarget = gl.getRenderTarget()
    gl.setRenderTarget(res.targetA)
    gl.clear()
    gl.render(res.offscreenSceneA, res.camA)

    // motion은 B의 빈 곳을 투명하게 남겨야 한다
    const clearAlpha = gl.getClearAlpha()
    if (lens?.mode === 'motion') gl.setClearAlpha(0)
    gl.setRenderTarget(res.targetB)
    gl.clear()
    gl.render(res.offscreenSceneB, res.camB)
    gl.setClearAlpha(clearAlpha)

    gl.setRenderTarget(prevTarget)
    gl.render(res.quadScene, res.quadCam)
  }, 1)

  const { offscreenSceneA, offscreenSceneB } = resRef.current

  return (
    <>
      {createPortal(sceneA, offscreenSceneA)}
      {createPortal(sceneB, offscreenSceneB)}
    </>
  )
}
