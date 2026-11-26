import { useFrame } from '@react-three/fiber'
import { useRef, useState, type ReactNode, type RefObject } from 'react'
import * as THREE from 'three'
import { SceneDiagram } from '@terms/components/diagram/SceneDiagram'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { CAMERA_ASPECT, SWING, type Vec3 } from '@terms/components/scene/scene-layout'
import { CameraStage } from '@terms/components/stages/CameraStage'
import { Button } from '@terms/components/ui/button'
import { useCameraPlayback } from '@terms/hooks/use-camera-playback'
import {
  ARC_RADIUS,
  CRANE_HIGH,
  CRANE_LOW,
  CRANE_PIVOT,
  CRASH_ZOOM_DURATION,
  CRATE_SIZE,
  DOLLY_FAR_Z,
  DOLLY_NEAR_Z,
  HANDHELD_DURATION,
  IMPACT_TIME,
  KEN_BURNS_DURATION,
  KEN_BURNS_END,
  KEN_BURNS_START,
  LONG_TAKE_DURATION,
  LONG_TAKE_ZONES,
  SHAKE_CAMERA,
  SHAKE_DURATION,
  SLOW_ZOOM_DURATION,
  TRACK_FAR_TREE,
  TRACK_LAMP,
  TRACK_X,
  TRIPOD_POSITION,
  ZOOM_CAMERA,
  ZOOM_PLAY_DURATION,
  ZOOM_TARGET,
  arcAt,
  arcPath,
  craneAt,
  crashZoomAt,
  cratePositionAt,
  dollyCompareAt,
  handheldAt,
  impactShakeAt,
  jitteredPose,
  kenBurnsFrameAt,
  longTakeAt,
  longTakePath,
  panTiltAt,
  trackingAt,
  waveform,
  type ArcSweep,
  type CameraPose,
  type CraneMove,
  type DollyMove,
  type Frame,
  type Jitter,
  type PanTiltMode,
} from '@terms/lib/camera-movement-math'
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

// ── Movement 카드 공용 ───────────────────────────────────────────

/** 단일 장면 카드의 카메라. frame은 같은 화면의 일부만 잘라 보는 2D 프레임이다. */
function CameraRig({ pose, frame }: { pose: CameraPose; frame?: Frame }) {
  useFrame(({ camera }) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    camera.position.set(...pose.position)
    camera.lookAt(...pose.target)
    camera.fov = pose.fov
    if (frame) {
      camera.setViewOffset(
        CAMERA_ASPECT,
        1,
        frame.x * CAMERA_ASPECT,
        frame.y,
        frame.size * CAMERA_ASPECT,
        frame.size,
      )
    } else {
      camera.updateProjectionMatrix()
    }
  })

  return null
}

/** ViewportCanvas는 camera 객체가 바뀌면 카메라를 다시 만든다. 처음 값은 고정하고 rig가 움직인다. */
const INITIAL_CAMERA = { position: [0, 1.65, 6] as Vec3, fov: 42, near: 0.1, far: 100 }

const SPLIT_HALF = { current: 0.5 }
const SPLIT_NONE = { current: 1 }

function toSpec(pose: CameraPose, shift: number) {
  return { position: pose.position, lookAt: pose.target, fov: pose.fov, viewShift: [shift, 0] as [number, number] }
}

/** canvas 1개를 좌우로 나눠 두 장면(또는 두 카메라)을 보여 준다. labels가 없으면 left만 전체 화면이다. */
function CompareViewport({
  label,
  left,
  right,
  sceneLeft,
  sceneRight = sceneLeft,
  labels,
}: {
  label: string
  left: CameraPose
  right: CameraPose
  sceneLeft: ReactNode
  sceneRight?: ReactNode
  labels?: [string, string]
}) {
  return (
    <div className="relative">
      <ViewportCanvas label={label} camera={INITIAL_CAMERA}>
        <DualSceneComposer
          mode="split"
          progressRef={labels ? SPLIT_HALF : SPLIT_NONE}
          cameraA={toSpec(left, labels ? 0.25 : 0)}
          cameraB={toSpec(right, -0.25)}
          sceneA={sceneLeft}
          sceneB={sceneRight}
        />
      </ViewportCanvas>
      {labels && (
        <div className="pointer-events-none absolute inset-0 grid grid-cols-2">
          {labels.map((text, index) => (
            <div key={text} className={`flex items-end ${index === 0 ? 'border-r-2 border-white' : ''}`}>
              <span className="m-1.5 inline-block rounded bg-slate-950/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChoiceGroup<T extends string | number>({
  legend,
  options,
  value,
  onSelect,
}: {
  legend: string
  options: readonly { value: T; label: string }[]
  value: T
  onSelect: (value: T) => void
}) {
  return (
    <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <span aria-hidden="true" className="mr-1 text-xs font-semibold text-slate-600">
        {legend}:
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onSelect(option.value)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  )
}

function Status({ children }: { children: ReactNode }) {
  return <span data-testid="camera-status">{children}</span>
}

// ── Dolly In / Out ───────────────────────────────────────────────

export function DollyInOutDemo() {
  const [move, setMove] = useState<DollyMove>('in')
  const [compare, setCompare] = useState(false)
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({ duration: 2.6, ease: 'power1.inOut' })
  const { dolly, zoom } = dollyCompareAt(progress, move)
  const direction = move === 'in' ? 'In' : 'Out'

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        controls={
          <>
            <ChoiceGroup
              legend="방향"
              options={[
                { value: 'in', label: 'In (전진)' },
                { value: 'out', label: 'Out (후퇴)' },
              ]}
              value={move}
              onSelect={(next) => {
                reset()
                setMove(next)
              }}
            />
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={compare}
                onChange={(event) => {
                  reset()
                  setCompare(event.target.checked)
                }}
              />
              Zoom과 나란히 비교
            </label>
          </>
        }
        diagram={
          <SceneDiagram
            label="Dolly In / Out 평면도"
            bounds={{ z: [-9, 10] }}
            cameras={[
              ...(compare ? [{ ...zoom, color: '#facc15', label: 'Zoom 고정' }] : []),
              { ...dolly },
            ]}
            paths={[
              {
                points: [
                  [0, dolly.position[1], DOLLY_NEAR_Z],
                  [0, dolly.position[1], DOLLY_FAR_Z],
                ],
              },
            ]}
            footer={
              <Status>
                Dolly {direction} · 거리 {dolly.position[2].toFixed(1)}m
                {compare && ` | Zoom ${direction} · 화각 ${Math.round(zoom.fov)}°`}
              </Status>
            }
          />
        }
        cameraView={
          <CompareViewport
            label="Dolly In / Out 3D 카메라 화면"
            left={dolly}
            right={zoom}
            sceneLeft={<SharedScene timeOfDay="day" />}
            labels={compare ? [`Dolly ${direction} · 이동`, `Zoom ${direction} · 화각`] : undefined}
          />
        }
      />
    </div>
  )
}

// ── Pan / Tilt ───────────────────────────────────────────────────

export function PanTiltDemo() {
  const [mode, setMode] = useState<PanTiltMode>('pan')
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({ duration: 3, ease: 'power1.inOut' })
  const pose = panTiltAt(progress, mode)
  const view = mode === 'pan' ? 'top' : 'side'

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagramView={view}
        controls={
          <ChoiceGroup
            legend="회전 축"
            options={[
              { value: 'pan', label: 'Pan' },
              { value: 'tilt', label: 'Tilt' },
            ]}
            value={mode}
            onSelect={(next) => {
              reset()
              setMode(next)
            }}
          />
        }
        diagram={
          <SceneDiagram
            view={view}
            label={mode === 'pan' ? 'Pan 평면도' : 'Tilt 측면도'}
            bounds={mode === 'pan' ? { z: [-9, 10] } : { z: [-9, 9] }}
            cameras={[{ ...pose, range: 13 }]}
            footer={
              <>
                <Status>
                  {mode === 'pan'
                    ? `Pan 좌우 ${Math.round(pose.angle)}°`
                    : `Tilt Up 상하 ${Math.round(pose.angle)}°`}
                </Status>
                <span>카메라 위치 고정</span>
              </>
            }
          />
        }
        cameraView={
          <ViewportCanvas label="Pan / Tilt 3D 카메라 화면" camera={INITIAL_CAMERA}>
            <CameraRig pose={{ ...pose, position: TRIPOD_POSITION }} />
            <SharedScene timeOfDay="day" />
          </ViewportCanvas>
        }
      />
    </div>
  )
}

// ── Tracking Shot ────────────────────────────────────────────────

function LampPost() {
  return (
    <group position={TRACK_LAMP}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 2.4, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.17, 14, 14]} />
        <meshStandardMaterial color="#fde68a" roughness={0.4} />
      </mesh>
    </group>
  )
}

function ShiftBar({ label, percent, max }: { label: string; percent: number; max: number }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between gap-2">
        <span>{label}</span>
        <span className="shrink-0 tabular-nums">화면의 {Math.round(percent)}%</span>
      </div>
      <div aria-hidden="true" className="h-2 rounded bg-slate-800">
        <div className="h-full rounded bg-indigo-400" style={{ width: `${(percent / max) * 100}%` }} />
      </div>
    </div>
  )
}

export function TrackingShotDemo() {
  const { scopeRef, progress, stageProps } = useCameraPlayback({ duration: 3.5 })
  const shot = trackingAt(progress)
  const maxShift = trackingAt(1).nearShift

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagram={
          <SceneDiagram
            label="Tracking Shot 평면도"
            bounds={{ z: [-9, 10] }}
            cameras={[{ ...shot.camera, range: 9 }]}
            heroPosition={shot.heroPosition}
            markers={[
              { position: TRACK_LAMP, label: '전경 가로등', radius: 0.25 },
              { position: TRACK_FAR_TREE, label: '원경 나무', radius: 0.25 },
            ]}
            paths={[
              {
                points: [
                  [TRACK_X[0], 0, shot.heroPosition[2]],
                  [TRACK_X[1], 0, shot.heroPosition[2]],
                ],
                color: '#fb923c',
              },
              {
                points: [
                  [TRACK_X[0], 0, shot.camera.position[2]],
                  [TRACK_X[1], 0, shot.camera.position[2]],
                ],
              },
            ]}
            footer={
              <>
                <Status>카메라 이동 {(shot.camera.position[0] - TRACK_X[0]).toFixed(1)}m</Status>
                <span>주인공 이동 {(shot.heroPosition[0] - TRACK_X[0]).toFixed(1)}m</span>
              </>
            }
          />
        }
        cameraView={
          <div className="space-y-1.5">
            <ViewportCanvas label="Tracking Shot 3D 카메라 화면" camera={INITIAL_CAMERA}>
              <CameraRig pose={shot.camera} />
              <SharedScene
                timeOfDay="day"
                heroPosition={shot.heroPosition}
                heroYaw={Math.PI / 2}
                heroStride={shot.stride}
                prop={<LampPost />}
              />
            </ViewportCanvas>
            <div className="space-y-1 rounded-lg bg-slate-950 p-2 text-[11px] text-slate-200">
              <p className="text-slate-300">화면에서 흘러간 거리 (화면 폭 기준)</p>
              <ShiftBar label="전경 가로등 · 빠름" percent={shot.nearShift} max={maxShift} />
              <ShiftBar label="원경 나무 · 느림" percent={shot.farShift} max={maxShift} />
            </div>
          </div>
        }
      />
    </div>
  )
}

// ── Crane Shot ───────────────────────────────────────────────────

export function CraneShotDemo() {
  const [move, setMove] = useState<CraneMove>('up')
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({ duration: 3.2, ease: 'power2.inOut' })
  const pose = craneAt(progress, move)

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagramView="side"
        controls={
          <ChoiceGroup
            legend="방향"
            options={[
              { value: 'up', label: '상승' },
              { value: 'down', label: '하강' },
            ]}
            value={move}
            onSelect={(next) => {
              reset()
              setMove(next)
            }}
          />
        }
        diagram={
          <SceneDiagram
            view="side"
            label="Crane Shot 측면도"
            bounds={{ z: [-9, 14], y: [-1, 8] }}
            cameras={[{ ...pose, range: 12 }]}
            paths={[{ points: [CRANE_LOW.position, CRANE_HIGH.position] }]}
            footer={
              <>
                <Status>
                  {move === 'up' ? '상승' : '하강'} · 높이 {pose.position[1].toFixed(1)}m
                </Status>
                <span>노란 선 = 크레인 암</span>
              </>
            }
          >
            {({ point }) => {
              const base = point([0, 0, CRANE_PIVOT[2]])
              const pivot = point(CRANE_PIVOT)
              const head = point(pose.position)
              return (
                <g data-object="crane" stroke="#facc15" fill="none">
                  <line x1={base[0]} y1={base[1]} x2={pivot[0]} y2={pivot[1]} strokeWidth="3" />
                  <line x1={pivot[0]} y1={pivot[1]} x2={head[0]} y2={head[1]} strokeWidth="2" />
                </g>
              )
            }}
          </SceneDiagram>
        }
        cameraView={
          <ViewportCanvas label="Crane Shot 3D 카메라 화면" camera={INITIAL_CAMERA}>
            <CameraRig pose={pose} />
            <SharedScene timeOfDay="day" />
          </ViewportCanvas>
        }
      />
    </div>
  )
}

// ── Arc Shot ─────────────────────────────────────────────────────

export function ArcShotDemo() {
  const [sweep, setSweep] = useState<ArcSweep>(180)
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({
    duration: sweep === 180 ? 3.2 : 6,
    ease: 'power1.inOut',
  })
  const pose = arcAt(progress, sweep)

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        controls={
          <ChoiceGroup<ArcSweep>
            legend="회전 범위"
            options={[
              { value: 180, label: '180°' },
              { value: 360, label: '360°' },
            ]}
            value={sweep}
            onSelect={(next) => {
              reset()
              setSweep(next)
            }}
          />
        }
        diagram={
          <SceneDiagram
            label="Arc Shot 평면도"
            bounds={{ z: [-9, 8] }}
            otherPosition={null}
            cameras={[{ ...pose, range: ARC_RADIUS + 3 }]}
            paths={[{ points: arcPath(sweep) }]}
            footer={
              <>
                <Status>
                  회전 {Math.round(pose.angle)}° / {sweep}°
                </Status>
                <span>반지름 {ARC_RADIUS}m</span>
              </>
            }
          />
        }
        cameraView={
          <ViewportCanvas label="Arc Shot 3D 카메라 화면" camera={INITIAL_CAMERA}>
            <CameraRig pose={pose} />
            <SharedScene timeOfDay="day" hideOther />
          </ViewportCanvas>
        }
      />
    </div>
  )
}

// ── Crash Zoom ───────────────────────────────────────────────────

export function CrashZoomDemo() {
  const { scopeRef, progress, stageProps } = useCameraPlayback({ duration: ZOOM_PLAY_DURATION })
  const { slowFov, crashFov } = crashZoomAt(progress * ZOOM_PLAY_DURATION)
  const slow: CameraPose = { position: ZOOM_CAMERA, target: ZOOM_TARGET, fov: slowFov }
  const crash: CameraPose = { ...slow, fov: crashFov }

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagram={
          <SceneDiagram
            label="Crash Zoom 평면도"
            bounds={{ z: [-9, 8] }}
            cameras={[
              { ...slow, color: '#facc15', range: 12 },
              { ...crash, range: 9 },
            ]}
            footer={
              <Status>
                긴 부채 Zoom In {Math.round(slowFov)}° | 짧은 부채 Crash Zoom {Math.round(crashFov)}°
              </Status>
            }
          />
        }
        cameraView={
          <CompareViewport
            label="Crash Zoom 3D 카메라 화면"
            left={slow}
            right={crash}
            sceneLeft={<SharedScene timeOfDay="day" />}
            labels={[`Zoom In · ${SLOW_ZOOM_DURATION}초`, `Crash Zoom · ${CRASH_ZOOM_DURATION}초`]}
          />
        }
      />
    </div>
  )
}

// ── Handheld · Camera Shake ──────────────────────────────────────

interface WaveSeries {
  label: string
  jitterAt: (time: number) => Jitter
}

/** 두 흔들림의 세로 파형. 첫 계열은 점선, 둘째 계열은 실선이다. */
function Waveform({
  label,
  series,
  duration,
  time,
}: {
  label: string
  series: [WaveSeries, WaveSeries]
  duration: number
  time: number
}) {
  const waves = series.map((item) => waveform(item.jitterAt, duration))
  const peak = Math.max(...waves.flat().map((sample) => Math.abs(sample.value)))
  const x = (t: number) => (t / duration) * 320

  return (
    <div className="rounded-lg bg-slate-950 p-2 text-[11px] text-slate-200">
      <div className="flex flex-wrap justify-between gap-x-3">
        <span>┄ {series[0].label}</span>
        <span>━ {series[1].label}</span>
      </div>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
      <svg role="img" aria-label={label} viewBox="0 0 320 64" className="mt-1 w-full">
        {waves.map((wave, index) => (
          <polyline
            key={series[index]!.label}
            points={wave.map((sample) => `${x(sample.time)},${32 - (sample.value / peak) * 29}`).join(' ')}
            fill="none"
            stroke={index === 0 ? '#facc15' : '#a5b4fc'}
            strokeWidth="1.5"
            strokeDasharray={index === 0 ? '4 3' : undefined}
          />
        ))}
        <line x1={x(time)} x2={x(time)} y1="0" y2="64" stroke="#ffffff" />
      </svg>
    </div>
  )
}

const HANDHELD_POSE: CameraPose = { position: [0, 1.6, 5.4], target: [0, 1.05, 0], fov: 42 }
const NO_JITTER: Jitter = { x: 0, y: 0, yaw: 0, pitch: 0 }
/** 도식에서 흔들림이 보이도록 키우는 배율 */
const DIAGRAM_JITTER_SCALE = 8

export function HandheldDemo() {
  const { scopeRef, progress, stageProps } = useCameraPlayback({ duration: HANDHELD_DURATION })
  const time = progress * HANDHELD_DURATION
  const jitter = handheldAt(time)
  const shaken = jitteredPose(HANDHELD_POSE, jitter)

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagram={
          <SceneDiagram
            label="Handheld 평면도"
            bounds={{ z: [-9, 8] }}
            cameras={[
              { ...HANDHELD_POSE, color: '#facc15', range: 9, dimmed: true },
              { ...jitteredPose(HANDHELD_POSE, jitter, DIAGRAM_JITTER_SCALE), range: 9 },
            ]}
            footer={
              <>
                <Status>
                  {time.toFixed(1)}s / {HANDHELD_DURATION.toFixed(1)}s
                </Status>
                <span>흐림 = 삼각대 · 흔들림 {DIAGRAM_JITTER_SCALE}배 과장</span>
              </>
            }
          />
        }
        cameraView={
          <div className="space-y-1.5">
            <CompareViewport
              label="Handheld 3D 카메라 화면"
              left={HANDHELD_POSE}
              right={shaken}
              sceneLeft={<SharedScene timeOfDay="day" />}
              labels={['삼각대 고정', 'Handheld']}
            />
            <Waveform
              label="Handheld 흔들림 파형"
              duration={HANDHELD_DURATION}
              time={time}
              series={[
                { label: '삼각대 · 흔들림 없음', jitterAt: () => NO_JITTER },
                { label: 'Handheld · 지속적이고 잔잔함', jitterAt: handheldAt },
              ]}
            />
          </div>
        }
      />
    </div>
  )
}

function Crate({ position }: { position: Vec3 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[CRATE_SIZE, CRATE_SIZE, CRATE_SIZE]} />
      <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
    </mesh>
  )
}

const shakeHandheldAt = (time: number) => handheldAt(time, SHAKE_DURATION)

export function CameraShakeDemo() {
  const { scopeRef, progress, stageProps } = useCameraPlayback({ duration: SHAKE_DURATION })
  const time = progress * SHAKE_DURATION
  const crate = cratePositionAt(time)
  const shake = impactShakeAt(time)
  const landed = time >= IMPACT_TIME
  const scene = <SharedScene timeOfDay="day" prop={<Crate position={crate} />} />

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagramView="side"
        diagram={
          <SceneDiagram
            view="side"
            label="Camera Shake 측면도"
            bounds={{ z: [-4, 8], y: [-1, 5] }}
            otherPosition={null}
            cameras={[{ ...jitteredPose(SHAKE_CAMERA, shake, 3), range: 7 }]}
            footer={
              <>
                <Status>{landed ? '지면 충돌' : '낙하 전·중'}</Status>
                <span>카메라 흔들림 3배 과장</span>
              </>
            }
          >
            {({ point, scale }) => {
              const [h, v] = point([crate[0], crate[1] + CRATE_SIZE / 2, crate[2]])
              const [gh, gv] = point([crate[0], 0, crate[2]])
              return (
                <g data-object="crate">
                  <rect x={h - (CRATE_SIZE * scale) / 2} y={v} width={CRATE_SIZE * scale} height={CRATE_SIZE * scale} fill="#cbd5e1" />
                  <text x={h} y={v - 3} fontSize="9" textAnchor="middle" fill="#e2e8f0">
                    낙하 상자
                  </text>
                  {landed && (
                    <path
                      d={`M${gh - 18} ${gv}l6 -6M${gh + 18} ${gv}l-6 -6M${gh - 20} ${gv + 4}h40`}
                      stroke="#facc15"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  )}
                </g>
              )
            }}
          </SceneDiagram>
        }
        cameraView={
          <div className="space-y-1.5">
            <CompareViewport
              label="Camera Shake 3D 카메라 화면"
              left={jitteredPose(SHAKE_CAMERA, shakeHandheldAt(time))}
              right={jitteredPose(SHAKE_CAMERA, shake)}
              sceneLeft={scene}
              labels={['Handheld', 'Camera Shake']}
            />
            <Waveform
              label="Camera Shake 흔들림 그래프"
              duration={SHAKE_DURATION}
              time={time}
              series={[
                { label: 'Handheld · 내내 잔잔함', jitterAt: shakeHandheldAt },
                { label: 'Camera Shake · 충돌 순간만 강함', jitterAt: impactShakeAt },
              ]}
            />
          </div>
        }
      />
    </div>
  )
}

// ── Long Take ────────────────────────────────────────────────────

const LONG_TAKE_PATH = longTakePath()
const ZONE_MARKS: Vec3[] = [[SWING.position[0] + 1.2, 0, SWING.position[2]], [-3.4, 0, -0.4], [-1.9, 0, -8.6]]

function CutTimeline({ label, cuts, progress }: { label: string; cuts: readonly string[]; progress: number }) {
  return (
    <div className="space-y-0.5">
      <span>{label}</span>
      <div className="relative flex gap-1">
        {cuts.map((cut) => (
          <span key={cut} className="min-w-0 flex-1 truncate rounded bg-indigo-700 px-1 py-1 text-center">
            {cut}
          </span>
        ))}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}

export function LongTakeDemo() {
  const { scopeRef, progress, stageProps } = useCameraPlayback({ duration: LONG_TAKE_DURATION })
  const pose = longTakeAt(progress)
  const zones = LONG_TAKE_ZONES.map((zone, index) => `${'①②③'[index]} ${zone}`)

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagram={
          <SceneDiagram
            label="Long Take 카메라 경로 평면도"
            bounds={{ x: [-7, 7], z: [-10, 8] }}
            cameras={[{ ...pose, range: 5 }]}
            paths={[{ points: LONG_TAKE_PATH }]}
            footer={
              <>
                <Status>
                  지금 {zones[pose.zone]} · {(progress * LONG_TAKE_DURATION).toFixed(1)}s
                </Status>
                <span>컷 0회</span>
              </>
            }
          >
            {({ point }) =>
              ZONE_MARKS.map((mark, index) => {
                const [x, y] = point(mark)
                return (
                  <text key={zones[index]} x={x} y={y} fontSize="12" textAnchor="middle" fill="#ffffff">
                    {'①②③'[index]}
                  </text>
                )
              })
            }
          </SceneDiagram>
        }
        cameraView={
          <div className="space-y-1.5">
            <ViewportCanvas label="Long Take 3D 카메라 화면" camera={INITIAL_CAMERA}>
              <CameraRig pose={pose} />
              <SharedScene timeOfDay="day" />
            </ViewportCanvas>
            <div className="space-y-1.5 rounded-lg bg-slate-950 p-2 text-[11px] text-slate-200">
              <CutTimeline label="Long Take 1컷" cuts={['①→②→③ 이어 찍기']} progress={progress} />
              <CutTimeline label="일반 편집 3컷" cuts={zones} progress={progress} />
              <p className="text-center text-indigo-200">위: 이어진 한 칸 · 아래: 칸 사이마다 컷</p>
            </div>
          </div>
        }
      />
    </div>
  )
}

// ── Ken Burns Effect ─────────────────────────────────────────────

const KEN_BURNS_POSE: CameraPose = { position: [0.1, 1.65, 5.8], target: [0, 1, 0], fov: 42 }
const FULL_FRAME: Frame = { x: 0, y: 0, size: 1 }

function FrameOverlay({ frame, label, dashed }: { frame: Frame; label: string; dashed?: boolean }) {
  return (
    <div
      className={`absolute border-2 ${dashed ? 'border-dashed border-yellow-300' : 'border-white'}`}
      style={{
        left: `${frame.x * 100}%`,
        top: `${frame.y * 100}%`,
        width: `${frame.size * 100}%`,
        height: `${frame.size * 100}%`,
      }}
    >
      <span className={`absolute bg-slate-950/75 px-1 text-[10px] font-semibold text-white ${dashed ? 'bottom-0 left-0' : 'top-0 right-0'}`}>
        {label}
      </span>
    </div>
  )
}

export function KenBurnsEffectDemo() {
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({
    duration: KEN_BURNS_DURATION,
    ease: 'power1.inOut',
  })
  // 재생을 누르기 전에는 원본 전체와 두 프레임을, 누른 뒤에는 프레임 안쪽만 보여 준다.
  const started = stageProps.replayLabel !== '재생'
  const frame = started ? kenBurnsFrameAt(progress) : FULL_FRAME

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        controls={
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={!started}>
            원본과 프레임 보기
          </Button>
        }
        diagram={
          <SceneDiagram
            label="Ken Burns Effect 평면도"
            bounds={{ z: [-9, 8] }}
            cameras={[{ ...KEN_BURNS_POSE, range: 9 }]}
            footer={
              <>
                <Status>
                  {started ? `프레임 폭 ${Math.round(frame.size * 100)}%` : '원본 전체'}
                </Status>
                <span>카메라·피사체 정지</span>
              </>
            }
          />
        }
        cameraView={
          <div className="relative">
            <ViewportCanvas label="Ken Burns Effect 정지 화면" camera={INITIAL_CAMERA}>
              <CameraRig pose={KEN_BURNS_POSE} frame={frame} />
              <SharedScene timeOfDay="sunset" />
            </ViewportCanvas>
            {!started && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <FrameOverlay frame={KEN_BURNS_START} label="시작 (점선)" dashed />
                <FrameOverlay frame={KEN_BURNS_END} label="끝 (실선)" />
              </div>
            )}
          </div>
        }
      />
    </div>
  )
}
