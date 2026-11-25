import { useGSAP } from '@gsap/react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { CameraStage } from '@terms/components/stages/CameraStage'
import { computeDollyOptics, DOLLY_D_FAR, DOLLY_D_NEAR, type DollyDirection } from '@terms/lib/demo-math'

gsap.registerPlugin(useGSAP)

function DollyCameraRig({ stateRef }: { stateRef: RefObject<{ dist: number; fov: number }> }) {
  useFrame(({ camera }) => {
    const { dist, fov } = stateRef.current
    camera.position.set(0, 1.35, dist)
    camera.lookAt(0, 1.05, 0)
    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })

  return <SharedScene timeOfDay="day" />
}

export function DollyZoomDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const initialOptics = computeDollyOptics(0, 'out-in')
  const cameraStateRef = useRef({ dist: initialOptics.dist, fov: initialOptics.fov })

  const [direction, setDirection] = useState<DollyDirection>('out-in')
  const [optics, setOptics] = useState(initialOptics)
  const [playCount, setPlayCount] = useState(0)
  const [playing, setPlaying] = useState(false)

  useGSAP(
    () => {
      if (playCount === 0) return
      const proxy = { p: 0 }
      gsap.to(proxy, {
        p: 1,
        duration: 2.4,
        ease: 'power2.inOut',
        onUpdate: () => {
          const next = computeDollyOptics(proxy.p, direction)
          cameraStateRef.current = next
          setOptics(next)
        },
        onComplete: () => {
          setPlaying(false)
        },
      })
    },
    { scope: rootRef, dependencies: [playCount, direction], revertOnUpdate: true },
  )

  function handleReplay() {
    const reset = computeDollyOptics(0, direction)
    cameraStateRef.current = reset
    setOptics(reset)
    setPlaying(true)
    setPlayCount((c) => c + 1)
  }

  function selectDirection(nextDir: DollyDirection) {
    setPlaying(false)
    setPlayCount(0)
    setDirection(nextDir)
    const reset = computeDollyOptics(0, nextDir)
    cameraStateRef.current = reset
    setOptics(reset)
  }

  // Top-down SVG coordinates: world z in [-14, 14] mapped to y in [18, 178]
  const zToSvgY = (z: number) => 98 + z * 5.6
  const camY = zToSvgY(optics.dist)
  const halfFovRad = (optics.fov * Math.PI) / 360
  const frustumTopY = 18
  const spanY = camY - frustumTopY
  const halfSpreadX = Math.min(92, Math.tan(halfFovRad) * spanY)

  return (
    <div ref={rootRef}>
      <CameraStage
        playing={playing}
        replayLabel={playCount > 0 ? '다시 재생' : '재생'}
        onReplay={handleReplay}
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
        topView={
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-2 text-white">
            {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
            <svg viewBox="0 0 200 190" role="img" aria-label="카메라 위치와 시야각 평면도" className="aspect-[16/15] w-full">
              {/* Background zone */}
              <rect x="8" y="10" width="184" height="36" rx="4" fill="#1e293b" opacity="0.8" />
              <text x="14" y="24" fontSize="9" fill="#94a3b8">원경 (언덕·나무)</text>

              {/* Camera FOV frustum */}
              <polygon
                points={`100,${camY} ${100 - halfSpreadX},${frustumTopY} ${100 + halfSpreadX},${frustumTopY}`}
                fill="#818cf8"
                opacity="0.24"
              />
              <line x1="100" y1={camY} x2={100 - halfSpreadX} y2={frustumTopY} stroke="#a5b4fc" strokeWidth="1.2" />
              <line x1="100" y1={camY} x2={100 + halfSpreadX} y2={frustumTopY} stroke="#a5b4fc" strokeWidth="1.2" />

              {/* Dolly track */}
              <line x1="100" y1={zToSvgY(DOLLY_D_NEAR)} x2="100" y2={zToSvgY(DOLLY_D_FAR)} stroke="#475569" strokeDasharray="3 3" strokeWidth="1.5" />

              {/* Foreground objects */}
              <rect x="64" y={zToSvgY(2.3) - 3} width="22" height="5" rx="1" fill="#a1887f" />
              <rect x="122" y={zToSvgY(1.85) - 3} width="16" height="6" rx="1" fill="#8d6e63" />

              {/* Midground characters */}
              <circle cx="72" cy={zToSvgY(-0.45)} r="5.5" fill="#2563eb" />
              <circle cx="100" cy={zToSvgY(0)} r="6.5" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
              <text x="110" y={zToSvgY(0) + 3} fontSize="9" fill="#fed7aa">주인공</text>

              {/* Camera body */}
              <g transform={`translate(100, ${camY})`}>
                <rect x="-10" y="-6" width="20" height="12" rx="2.5" fill="#e2e8f0" />
                <polygon points="-5,-6 5,-6 3,-11 -3,-11" fill="#94a3b8" />
              </g>
            </svg>
            <div className="mt-1 flex items-center justify-between text-[11px] tabular-nums text-slate-300">
              <span>거리 {optics.dist.toFixed(1)}m</span>
              <span>화각 {Math.round(optics.fov)}°</span>
            </div>
          </div>
        }
        cameraView={
          <ViewportCanvas
            label="Dolly Zoom 3D 카메라 화면"
            placeholderTone="day"
            camera={{ position: [0, 1.35, initialOptics.dist], fov: initialOptics.fov, near: 0.1, far: 100 }}
          >
            <DollyCameraRig stateRef={cameraStateRef} />
          </ViewportCanvas>
        }
      />
    </div>
  )
}
