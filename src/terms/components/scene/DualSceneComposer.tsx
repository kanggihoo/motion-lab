import { createPortal, useFrame } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import {
  COMPOSER_MODES,
  DEFAULT_LOOK_POST_EFFECT,
  WIPE_SHAPES,
  createDualComposerResources,
  type ComposerMode,
  type LookPostEffect,
  type WipeShape,
} from './look-post'

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
}

const DEFAULT_CAMERA: CameraSpec = {
  position: [0.1, 1.65, 5.8],
  lookAt: [0, 1.0, 0],
  fov: 42,
}

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
}: DualSceneComposerProps) {
  const resRef = useRef<ReturnType<typeof createDualComposerResources> | null>(null)
  if (!resRef.current) {
    resRef.current = createDualComposerResources(mode)
  }

  const lastSizeRef = useRef({ w: 0, h: 0 })

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

    const dpr = gl.getPixelRatio()
    const w = Math.max(1, Math.floor(size.width * dpr))
    const h = Math.max(1, Math.floor(size.height * dpr))
    if (lastSizeRef.current.w !== w || lastSizeRef.current.h !== h) {
      res.targetA.setSize(w, h)
      res.targetB.setSize(w, h)
      lastSizeRef.current = { w, h }
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

    const prevTarget = gl.getRenderTarget()
    gl.setRenderTarget(res.targetA)
    gl.clear()
    gl.render(res.offscreenSceneA, res.camA)

    gl.setRenderTarget(res.targetB)
    gl.clear()
    gl.render(res.offscreenSceneB, res.camB)

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
