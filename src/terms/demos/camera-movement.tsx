import { useFrame } from '@react-three/fiber'
import { useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { SceneDiagram } from '@terms/components/diagram/SceneDiagram'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import type { Vec3 } from '@terms/components/scene/scene-layout'
import { CameraStage } from '@terms/components/stages/CameraStage'
import { useCameraPlayback } from '@terms/hooks/use-camera-playback'
import { computeDollyOptics, DOLLY_D_FAR, DOLLY_D_NEAR, type DollyDirection } from '@terms/lib/demo-math'

const DOLLY_CAMERA_Y = 1.35
const DOLLY_TARGET: Vec3 = [0, 1.05, 0]

function DollyCameraRig({ stateRef }: { stateRef: RefObject<{ dist: number; fov: number }> }) {
  useFrame(({ camera }) => {
    const { dist, fov } = stateRef.current
    camera.position.set(0, DOLLY_CAMERA_Y, dist)
    camera.lookAt(...DOLLY_TARGET)
    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return <SharedScene timeOfDay="day" />
}

export function DollyZoomDemo() {
  const initialOptics = computeDollyOptics(0, 'out-in')
  const cameraStateRef = useRef({ dist: initialOptics.dist, fov: initialOptics.fov })

  const [direction, setDirection] = useState<DollyDirection>('out-in')
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({
    duration: 2.4,
    ease: 'power2.inOut',
    onTick: (p) => {
      cameraStateRef.current = computeDollyOptics(p, direction)
    },
  })
  const optics = computeDollyOptics(progress, direction)

  function selectDirection(nextDir: DollyDirection) {
    reset()
    setDirection(nextDir)
    cameraStateRef.current = computeDollyOptics(0, nextDir)
  }

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        controls={
          <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend className="sr-only">Dolly Zoom 방향</legend>
            <button
              type="button"
              aria-pressed={direction === 'out-in'}
              onClick={() => selectDirection('out-in')}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
            >
              후진 + 줌인
            </button>
            <button
              type="button"
              aria-pressed={direction === 'in-out'}
              onClick={() => selectDirection('in-out')}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
            >
              전진 + 줌아웃
            </button>
          </fieldset>
        }
        diagram={
          <SceneDiagram
            view="top"
            label="카메라 위치와 시야각 평면도"
            cameras={[{ position: [0, DOLLY_CAMERA_Y, optics.dist], target: DOLLY_TARGET, fov: optics.fov }]}
            paths={[
              {
                points: [
                  [0, DOLLY_CAMERA_Y, DOLLY_D_NEAR],
                  [0, DOLLY_CAMERA_Y, DOLLY_D_FAR],
                ],
              },
            ]}
            footer={
              <>
                <span>거리 {optics.dist.toFixed(1)}m</span>
                <span>화각 {Math.round(optics.fov)}°</span>
              </>
            }
          >
            {({ point }) => {
              const [x, y] = point([-8.5, 0, -15.5])
              return (
                <text x={x} y={y} fontSize="9" fill="#cbd5e1">
                  원경 (언덕·나무)
                </text>
              )
            }}
          </SceneDiagram>
        }
        cameraView={
          <ViewportCanvas
            label="Dolly Zoom 3D 카메라 화면"
            placeholderTone="day"
            camera={{ position: [0, DOLLY_CAMERA_Y, initialOptics.dist], fov: initialOptics.fov, near: 0.1, far: 100 }}
          >
            <DollyCameraRig stateRef={cameraStateRef} />
          </ViewportCanvas>
        }
      />
    </div>
  )
}
