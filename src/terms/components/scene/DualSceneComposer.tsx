import { createPortal, useFrame } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { DEFAULT_LOOK_POST_EFFECT, createDualComposerResources, type LookPostEffect } from './look-post'

interface CameraSpec {
  position: [number, number, number]
  lookAt: [number, number, number]
  fov: number
}

interface DualSceneComposerProps {
  sceneA: ReactNode
  sceneB: ReactNode
  mode: 'dissolve' | 'split'
  progressRef: RefObject<number>
  postEffectRef?: RefObject<LookPostEffect>
  cameraA?: CameraSpec
  cameraB?: CameraSpec
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
  cam.updateProjectionMatrix()
}

export function DualSceneComposer({
  sceneA,
  sceneB,
  mode,
  progressRef,
  postEffectRef,
  cameraA = DEFAULT_CAMERA,
  cameraB = DEFAULT_CAMERA,
}: DualSceneComposerProps) {
  const resRef = useRef<ReturnType<typeof createDualComposerResources> | null>(null)
  if (!resRef.current) {
    resRef.current = createDualComposerResources(mode)
  }

  const lastSizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    if (resRef.current) {
      resRef.current.uniforms.uMode.value = mode === 'dissolve' ? 0 : 1
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
