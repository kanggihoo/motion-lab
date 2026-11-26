import { useFrame } from '@react-three/fiber'
import { useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { SceneDiagram } from '@terms/components/diagram/SceneDiagram'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import type { LensPostEffect } from '@terms/components/scene/look-post'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { TIME_PALETTES, type TimeOfDay } from '@terms/components/scene/scene-colors'
import { CAMERA_ASPECT, HERO, NIGHT_LIGHTS, NIGHT_LIGHT_Y, type Vec3 } from '@terms/components/scene/scene-layout'
import { CameraStage } from '@terms/components/stages/CameraStage'
import { useCameraPlayback } from '@terms/hooks/use-camera-playback'
import {
  APERTURES,
  BOKEH_CAMERA,
  BOKEH_HERO_DEPTH,
  BOKEH_LIGHT_DEPTHS,
  DOF_CAMERA,
  DOF_LAYERS,
  FISHEYE_SOURCE_FOV,
  FLARE_CAMERA,
  FLARE_GHOSTS,
  FLOWER_HEAD_Y,
  FLOWER_POSITION,
  FOCAL_CAMERA_Y,
  FOCAL_OPTIONS,
  MOTION_CAMERA,
  MOTION_DURATION,
  MOTION_FPS,
  NORMAL_LENS_FOV,
  PAN_MAX,
  PAN_MIN,
  RACK_CAMERA,
  RACK_FLOWER_DEPTH,
  RACK_HERO_DEPTH,
  TILT_BAND_HALF,
  TILT_CAMERA,
  TILT_MAX_RADIUS,
  TRAIN_Z,
  blurRadius,
  bokehOptics,
  depthOfField,
  dofOptics,
  dofUniforms,
  fisheyeHorizontalFov,
  flareStrength,
  flareTarget,
  focalOptics,
  motionBlurLength,
  motionBlurUv,
  panYawAt,
  projectToUv,
  rackOptics,
  sharpnessLabel,
  tiltGroundZ,
  trainX,
  verticalFov,
  type BokehFocus,
  type FocalLength,
} from '@terms/lib/camera-lens-focus-math'
import { horizontalFov, svgPoints, type Projection } from '@terms/lib/diagram-math'

// ── 공통 조각 ────────────────────────────────────────────────

function ChoiceGroup<T extends string | number>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  )
}

function RangeControl({
  label,
  value,
  valueText,
  min,
  max,
  step = 1,
  disabled = false,
  onChange,
}: {
  label: string
  value: number
  valueText: string
  min: number
  max: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="font-semibold text-slate-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="w-28 accent-indigo-700 disabled:opacity-40"
      />
      <span className="tabular-nums text-slate-600">{valueText}</span>
    </label>
  )
}

/** 카메라 화면과 그 아래의 상태 글. 비교 상태를 색 없이도 알 수 있게 한다. */
function LensView({ status, overlay, children }: { status: ReactNode; overlay?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="relative">
        {children}
        {overlay}
      </div>
      <p data-testid="lens-status" className="text-xs font-medium tabular-nums text-slate-700">
        {status}
      </p>
    </div>
  )
}

function Badge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`pointer-events-none absolute rounded bg-slate-950/75 px-2 py-0.5 text-xs font-semibold text-white ${className}`}>
      {children}
    </span>
  )
}

/** 렌즈 후처리를 거치는 카메라 화면 */
function LensCanvas({
  label,
  tone = 'day',
  position,
  target,
  fov,
  lens,
  scene,
  moving = null,
}: {
  label: string
  tone?: TimeOfDay
  position: Vec3
  target: Vec3
  fov: number
  lens: LensPostEffect
  scene: ReactNode
  /** mode='motion'에서 흐릴 물체만 담은 장면 */
  moving?: ReactNode
}) {
  const progressRef = useRef(0)
  const camera = { position, lookAt: target, fov }

  return (
    <ViewportCanvas label={label} placeholderTone={tone}>
      <DualSceneComposer
        mode="dissolve"
        progressRef={progressRef}
        sceneA={scene}
        sceneB={moving}
        cameraA={camera}
        cameraB={camera}
        lens={lens}
      />
    </ViewportCanvas>
  )
}

/** 측면도에서 카메라 시선 방향 거리 d가 놓이는 z */
function depthToZ(position: Vec3, target: Vec3, depth: number) {
  const length = Math.hypot(target[0] - position[0], target[1] - position[1], target[2] - position[2])
  return position[2] + ((target[2] - position[2]) / length) * depth
}

function FocusPlane({ projection, z, label }: { projection: Projection; z: number; label: string }) {
  const [x, top] = projection.point([0, 4, z])
  const [, bottom] = projection.point([0, 0, z])
  return (
    <g data-testid="focus-plane" data-z={z.toFixed(2)}>
      <line x1={x} y1={top} x2={x} y2={bottom} stroke="#facc15" strokeWidth="2" />
      <text x={x} y={top - 3} textAnchor="middle" fontSize="9" fill="#fde047">
        {label}
      </text>
    </g>
  )
}

// ── Rack Focus ───────────────────────────────────────────────

function Flower() {
  return (
    <group position={FLOWER_POSITION}>
      <mesh position={[0, FLOWER_HEAD_Y / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.035, FLOWER_HEAD_Y, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
      <group position={[0, FLOWER_HEAD_Y, 0]}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.15, Math.sin(angle) * 0.15, 0]} scale={[1, 1, 0.45]}>
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshStandardMaterial color={i % 2 ? '#fdf2f8' : '#ec4899'} roughness={0.7} />
            </mesh>
          )
        })}
        <mesh position={[0, 0, 0.03]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshStandardMaterial color="#facc15" roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}

export function RackFocusDemo() {
  /** 슬라이더로 정한 초점. null이면 재생 진행을 따른다. */
  const [manual, setManual] = useState<number | null>(0)
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({ duration: 2.5, ease: 'power2.inOut' })
  const t = manual ?? progress
  const optics = rackOptics(t)
  const focusZ = depthToZ(RACK_CAMERA.position, RACK_CAMERA.target, optics.focus)
  const fov = verticalFov(RACK_CAMERA.focalMm)

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        onReplay={() => {
          setManual(null)
          stageProps.onReplay()
        }}
        diagramView="side"
        diagram={
          <SceneDiagram
            view="side"
            label="Rack Focus 측면도: 카메라, 초점면, 앞 꽃과 뒤 주인공"
            bounds={{ z: [-3, 8], y: [-0.5, 5] }}
            hide={['trees', 'hills', 'swing', 'fence', 'other']}
            cameras={[{ position: RACK_CAMERA.position, target: RACK_CAMERA.target, fov, range: 8 }]}
            markers={[{ position: [0, FLOWER_HEAD_Y, FLOWER_POSITION[2]], label: '꽃', color: '#ec4899', radius: 0.2 }]}
            footer={<span>초점 거리 {optics.focus.toFixed(1)}m</span>}
          >
            {(projection) => <FocusPlane projection={projection} z={focusZ} label="초점면" />}
          </SceneDiagram>
        }
        cameraView={
          <LensView
            status={`앞 꽃 ${sharpnessLabel(optics, RACK_FLOWER_DEPTH)} · 뒤 주인공 ${sharpnessLabel(optics, RACK_HERO_DEPTH)}`}
          >
            <LensCanvas
              label="Rack Focus 3D 카메라 화면"
              position={RACK_CAMERA.position}
              target={RACK_CAMERA.target}
              fov={fov}
              lens={{ mode: 'dof', ...dofUniforms(optics) }}
              scene={<SharedScene timeOfDay="day" prop={<Flower />} />}
            />
          </LensView>
        }
        controls={
          <RangeControl
            label="초점면 위치"
            min={0}
            max={100}
            value={Math.round(t * 100)}
            valueText={`앞 꽃 → 주인공 ${Math.round(t * 100)}%`}
            onChange={(value) => {
              reset()
              setManual(value / 100)
            }}
          />
        }
      />
    </div>
  )
}

// ── Bokeh ────────────────────────────────────────────────────

const BOKEH_OPTIONS = [
  { value: 'hero', label: '캐릭터에 초점' },
  { value: 'lights', label: '배경 불빛에 초점' },
] as const

export function BokehDemo() {
  const [focus, setFocus] = useState<BokehFocus>('hero')
  const optics = bokehOptics(focus)
  const lightRadius = Math.max(...BOKEH_LIGHT_DEPTHS.map((depth) => blurRadius(optics, depth)))
  const focusZ = depthToZ(BOKEH_CAMERA.position, BOKEH_CAMERA.target, optics.focus)

  return (
    <CameraStage
      diagramView="side"
      diagram={
        <SceneDiagram
          view="side"
          label="Bokeh 측면도: 카메라, 초점면, 주인공과 배경 가로등"
          bounds={{ z: [-11, 8], y: [-0.5, 5] }}
          hide={['hills', 'trees', 'swing', 'fence']}
          cameras={[{ position: BOKEH_CAMERA.position, target: BOKEH_CAMERA.target, fov: BOKEH_CAMERA.fov, range: 17 }]}
          markers={NIGHT_LIGHTS.map(([x, , z], index) => ({
            position: [x, NIGHT_LIGHT_Y, z] as Vec3,
            label: index === 1 ? '불빛' : undefined,
            radius: 0.25,
          }))}
          footer={<span>초점 거리 {optics.focus.toFixed(1)}m · f/{optics.fNumber}</span>}
        >
          {(projection) => <FocusPlane projection={projection} z={focusZ} label="초점면" />}
        </SceneDiagram>
      }
      cameraView={
        <LensView
          status={
            focus === 'hero'
              ? `캐릭터 ${sharpnessLabel(optics, BOKEH_HERO_DEPTH)} · 배경 불빛은 큰 원형 보케`
              : `캐릭터 ${sharpnessLabel(optics, BOKEH_HERO_DEPTH)} · 배경 불빛은 작은 점`
          }
        >
          <LensCanvas
            label="Bokeh 3D 카메라 화면"
            tone="night"
            position={BOKEH_CAMERA.position}
            target={BOKEH_CAMERA.target}
            fov={BOKEH_CAMERA.fov}
            lens={{ mode: 'dof', ...dofUniforms(optics), highlight: lightRadius > 0.01 ? 9 : 0 }}
            scene={<SharedScene timeOfDay="night" />}
          />
        </LensView>
      }
      controls={<ChoiceGroup legend="Bokeh 초점 대상" options={BOKEH_OPTIONS} value={focus} onChange={setFocus} />}
    />
  )
}

// ── Tilt-shift ───────────────────────────────────────────────

const TILT_OPTIONS = [
  { value: 'normal', label: '일반 풍경' },
  { value: 'miniature', label: 'Tilt-shift' },
] as const

export function TiltShiftDemo() {
  const [mode, setMode] = useState<'normal' | 'miniature'>('miniature')
  const [strength, setStrength] = useState(80)
  const [band, setBand] = useState(55)
  const active = mode === 'miniature'
  const center = band / 100
  // 지평선 위로 가는 광선은 도식 범위 밖에서 끊는다
  const bandZ = [center - TILT_BAND_HALF, center + TILT_BAND_HALF].map((v) => Math.max(-30, tiltGroundZ(v)))

  return (
    <CameraStage
      diagramView="side"
      diagram={
        <SceneDiagram
          view="side"
          label="Tilt-shift 측면도: 옥상 높이의 카메라와 선명한 초점 띠"
          bounds={{ z: [-17, 12], y: [-1, 11] }}
          cameras={[{ position: TILT_CAMERA.position, target: TILT_CAMERA.target, fov: TILT_CAMERA.fov, range: 17 }]}
          footer={<span>{active ? `초점 띠 지면 z ${bandZ[1]!.toFixed(1)} ~ ${bandZ[0]!.toFixed(1)}m` : '초점 띠 없음(전체 선명)'}</span>}
        >
          {({ point }) =>
            active && (
              <polygon
                data-testid="focus-band"
                points={svgPoints([
                  point(TILT_CAMERA.position),
                  point([0, 0, bandZ[1]!]),
                  point([0, 0, bandZ[0]!]),
                ])}
                fill="#facc15"
                fillOpacity="0.35"
                stroke="#fde047"
              />
            )
          }
        </SceneDiagram>
      }
      cameraView={
        <LensView
          status={
            active
              ? `미니어처 효과 · 높이 ${band}% 띠만 선명, 위·아래 흐림 ${strength}%`
              : '일반 풍경 · 위부터 아래까지 선명'
          }
        >
          <LensCanvas
            label="Tilt-shift 3D 카메라 화면"
            position={TILT_CAMERA.position}
            target={TILT_CAMERA.target}
            fov={TILT_CAMERA.fov}
            lens={{
              mode: 'tilt',
              center,
              half: TILT_BAND_HALF,
              maxRadius: active ? (strength / 100) * TILT_MAX_RADIUS : 0,
            }}
            scene={<SharedScene timeOfDay="day" />}
          />
        </LensView>
      }
      controls={
        <>
          <ChoiceGroup legend="일반 풍경과 Tilt-shift 비교" options={TILT_OPTIONS} value={mode} onChange={setMode} />
          <RangeControl label="블러 강도" min={0} max={100} value={strength} valueText={`${strength}%`} disabled={!active} onChange={setStrength} />
          <RangeControl label="초점 띠 위치" min={20} max={80} value={band} valueText={`아래에서 ${band}%`} disabled={!active} onChange={setBand} />
        </>
      }
    />
  )
}

// ── Fisheye Lens ─────────────────────────────────────────────

const FISHEYE_CAMERA: { position: Vec3; target: Vec3 } = { position: [0, 1.2, 3.1], target: [0, 1.05, 0] }
const SKATER_POSITION: Vec3 = [0, 0.17, 0]
const SKATER_YAW = 0.5

const FISHEYE_OPTIONS = [
  { value: 'normal', label: '일반 렌즈' },
  { value: 'fisheye', label: 'Fisheye Lens' },
] as const

function Skateboard() {
  return (
    <group rotation={[0, SKATER_YAW, 0]}>
      <mesh position={[0, 0.145, 0]}>
        <boxGeometry args={[1.05, 0.04, 0.34]} />
        <meshStandardMaterial color="#7c3aed" roughness={0.6} />
      </mesh>
      {[-0.36, 0.36].flatMap((x) =>
        [-0.14, 0.14].map((z) => (
          <mesh key={`${x}:${z}`} position={[x, 0.065, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.07, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
        )),
      )}
    </group>
  )
}

export function FisheyeLensDemo() {
  const [lensType, setLensType] = useState<'normal' | 'fisheye'>('normal')
  const [grid, setGrid] = useState(true)
  const fisheye = lensType === 'fisheye'
  const normalHorizontal = horizontalFov(NORMAL_LENS_FOV, CAMERA_ASPECT)
  const fisheyeHorizontal = fisheyeHorizontalFov(CAMERA_ASPECT)
  const hfov = fisheye ? fisheyeHorizontal : normalHorizontal
  // 도식의 부채꼴은 가로 화각을 그대로 보이도록 aspect 1로 그린다
  const fan = (angle: number, label: string, active: boolean) => ({
    position: FISHEYE_CAMERA.position,
    target: FISHEYE_CAMERA.target,
    fov: angle,
    aspect: 1,
    range: 6,
    label: active ? label : undefined,
    dimmed: !active,
  })

  return (
    <CameraStage
      diagram={
        <SceneDiagram
          view="top"
          label="Fisheye Lens 평면도: 일반 렌즈와 어안 렌즈의 가로 화각"
          bounds={{ x: [-7, 7], z: [-5, 6] }}
          heroPosition={SKATER_POSITION}
          cameras={[
            fan(normalHorizontal, '일반', !fisheye),
            fan(fisheyeHorizontal, '어안', fisheye),
          ]}
          footer={
            <>
              <span>가로 화각 {Math.round(hfov)}°</span>
              <span>실제 어안 180° 전후</span>
            </>
          }
        />
      }
      cameraView={
        <LensView
          status={fisheye ? '어안 · 가장자리 직선이 둥글게 휨' : '일반 렌즈 · 직선 유지'}
          overlay={<Badge className="top-2 left-2">{fisheye ? 'Fisheye Lens' : '일반 렌즈'}</Badge>}
        >
          <LensCanvas
            label="Fisheye Lens 3D 카메라 화면"
            position={FISHEYE_CAMERA.position}
            target={FISHEYE_CAMERA.target}
            fov={fisheye ? FISHEYE_SOURCE_FOV : NORMAL_LENS_FOV}
            lens={{
              mode: 'fisheye',
              amount: fisheye ? 1 : 0,
              sourceFov: fisheye ? FISHEYE_SOURCE_FOV : NORMAL_LENS_FOV,
              grid: grid ? (fisheye ? 0.45 : 0.2) : 0,
              renderScale: fisheye ? 2 : 1,
            }}
            scene={
              <SharedScene
                timeOfDay="day"
                heroPosition={SKATER_POSITION}
                heroYaw={SKATER_YAW}
                heroStride={0.35}
                prop={<Skateboard />}
              />
            }
          />
        </LensView>
      }
      controls={
        <>
          <ChoiceGroup legend="렌즈 비교" options={FISHEYE_OPTIONS} value={lensType} onChange={setLensType} />
          <label className="flex items-center gap-1.5 text-xs text-slate-700">
            <input type="checkbox" checked={grid} onChange={(event) => setGrid(event.currentTarget.checked)} className="accent-indigo-700" />
            직선 격자
          </label>
        </>
      }
    />
  )
}

// ── Lens Flare ───────────────────────────────────────────────

const FLARE_OPTIONS = [
  { value: 'on', label: 'Flare 켬' },
  { value: 'off', label: 'Flare 끔' },
] as const

const SUN_POSITION = TIME_PALETTES.sunset.sunPos

function sideOf(u: number) {
  return u < 0.45 ? '왼쪽' : u > 0.55 ? '오른쪽' : '가운데'
}

export function LensFlareDemo() {
  /** 슬라이더로 정한 Pan 각도. null이면 재생 진행을 따른다. */
  const [manual, setManual] = useState<number | null>(0)
  const [flare, setFlare] = useState<'on' | 'off'>('on')
  const { scopeRef, progress, reset, stageProps } = useCameraPlayback({ duration: 4, ease: 'sine.inOut' })
  const yaw = manual ?? panYawAt(progress)
  const target = flareTarget(yaw)
  const sun = projectToUv(FLARE_CAMERA.position, target, FLARE_CAMERA.fov, CAMERA_ASPECT, SUN_POSITION)
  const strength = flare === 'on' ? flareStrength(sun) : 0
  const status =
    flare === 'off'
      ? 'Flare 끔 · 해만 보임'
      : strength === 0 || !sun
        ? '해가 화면 밖 · Flare 사라짐'
        : sideOf(sun[0]) === '가운데'
          ? '해 가운데 · 고리가 해 근처에 겹침'
          : `해 ${sideOf(sun[0])} · 고리는 ${sideOf(1 - sun[0])}으로 뻗음`

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        onReplay={() => {
          setManual(null)
          stageProps.onReplay()
        }}
        diagram={
          <SceneDiagram
            view="top"
            label="Lens Flare 평면도: 지는 해를 스치는 카메라 Pan"
            bounds={{ x: [-10, 10], z: [-19, 9] }}
            cameras={[{ position: FLARE_CAMERA.position, target, fov: FLARE_CAMERA.fov, range: 25 }]}
            markers={[{ position: SUN_POSITION, label: '해', color: '#fb923c', radius: 1.15 }]}
            footer={<span>Pan {Math.round(yaw)}°</span>}
          />
        }
        cameraView={
          <LensView status={status}>
            <LensCanvas
              label="Lens Flare 3D 카메라 화면"
              tone="sunset"
              position={FLARE_CAMERA.position}
              target={target}
              fov={FLARE_CAMERA.fov}
              lens={{ mode: 'flare', sun: sun ?? [-2, -2], strength, ghosts: FLARE_GHOSTS }}
              scene={<SharedScene timeOfDay="sunset" />}
            />
          </LensView>
        }
        controls={
          <>
            <RangeControl
              label="카메라 Pan 각도"
              min={PAN_MIN}
              max={PAN_MAX}
              value={Math.round(yaw)}
              valueText={`${Math.round(yaw)}°`}
              onChange={(value) => {
                reset()
                setManual(value)
              }}
            />
            <ChoiceGroup legend="Lens Flare 비교" options={FLARE_OPTIONS} value={flare} onChange={setFlare} />
          </>
        }
      />
    </div>
  )
}

// ── Motion Blur ──────────────────────────────────────────────

function Train({ x }: { x: number }) {
  return (
    <group position={[x, 0, TRAIN_Z]}>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[2.3, 0.8, 0.7]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.13, 0]}>
        <boxGeometry args={[2.1, 0.1, 0.6]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      {[-0.84, -0.42, 0, 0.42, 0.84].map((offset) => (
        <mesh key={offset} position={[offset, 0.82, 0.36]}>
          <boxGeometry args={[0.24, 0.3, 0.02]} />
          <meshStandardMaterial color="#fef9c3" roughness={0.3} />
        </mesh>
      ))}
      {[-0.8, -0.35, 0.35, 0.8].map((offset) => (
        <mesh key={offset} position={[offset, 0.18, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.14, 16]} />
          <meshStandardMaterial color="#111827" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

/** 기차만 담은 장면. 낮 장면과 같은 조명을 쓴다. */
function TrainLayer({ x }: { x: number }) {
  const palette = TIME_PALETTES.day
  return (
    <>
      <ambientLight intensity={palette.ambientIntensity} />
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemiIntensity]} />
      <directionalLight position={palette.sunPos} intensity={palette.dirIntensity} color={palette.dirColor} />
      <Train x={x} />
    </>
  )
}

export function MotionBlurDemo() {
  const [shutter, setShutter] = useState(180)
  const { scopeRef, progress, stageProps } = useCameraPlayback({ duration: MOTION_DURATION })
  const time = progress * MOTION_DURATION
  const x = trainX(time)
  const frame = Math.floor(time * MOTION_FPS + 1e-6)
  const length = motionBlurLength(shutter)

  return (
    <div ref={scopeRef}>
      <CameraStage
        {...stageProps}
        diagram={
          <SceneDiagram
            view="top"
            label="Motion Blur 평면도: 카메라 앞을 가로로 달리는 기차"
            bounds={{ x: [-7, 7], z: [-5, 10] }}
            cameras={[{ position: MOTION_CAMERA.position, target: MOTION_CAMERA.target, fov: MOTION_CAMERA.fov, range: 11 }]}
            paths={[{ points: [[-5.5, 0, TRAIN_Z], [5.5, 0, TRAIN_Z]] }]}
            footer={<span>한 프레임 셔터 동안 {length.toFixed(2)}m 이동</span>}
          >
            {({ point, scale }) => {
              const [left, middle] = point([x - 1.15, 0, TRAIN_Z])
              return (
                <g data-testid="train" data-x={x.toFixed(2)}>
                  <rect x={left} y={middle - 0.35 * scale} width={2.3 * scale} height={0.7 * scale} fill="#dc2626" />
                  <text x={left} y={middle - 0.35 * scale - 3} fontSize="9" fill="#fecaca">
                    기차 →
                  </text>
                </g>
              )
            }}
          </SceneDiagram>
        }
        cameraView={
          <LensView
            status={`프레임 ${frame} / ${MOTION_DURATION * MOTION_FPS} · ${MOTION_FPS}fps · 셔터 각도 ${shutter}°`}
            overlay={
              <>
                <Badge className="top-2 left-2">위 · 블러 없음 (끊김)</Badge>
                <Badge className="bottom-2 left-2">
                  {shutter === 0 ? '아래 · 셔터 0° (블러 없음)' : `아래 · Motion Blur ${shutter}°`}
                </Badge>
              </>
            }
          >
            <LensCanvas
              label="Motion Blur 3D 카메라 화면: 위는 블러 없음, 아래는 Motion Blur"
              position={MOTION_CAMERA.position}
              target={MOTION_CAMERA.target}
              fov={MOTION_CAMERA.fov}
              lens={{ mode: 'motion', length: motionBlurUv(shutter, CAMERA_ASPECT) }}
              scene={<SharedScene timeOfDay="day" />}
              moving={<TrainLayer x={x} />}
            />
          </LensView>
        }
        controls={
          <RangeControl label="셔터 각도" min={0} max={360} step={15} value={shutter} valueText={`${shutter}°`} onChange={setShutter} />
        }
      />
    </div>
  )
}

// ── Depth of Field ───────────────────────────────────────────

export function DepthOfFieldDemo() {
  const [stop, setStop] = useState(0)
  const fNumber = APERTURES[stop]!
  const optics = dofOptics(fNumber)
  const fov = verticalFov(DOF_CAMERA.focalMm)
  const { near, far } = depthOfField(DOF_CAMERA.focalMm, fNumber, optics.focus)
  const nearZ = depthToZ(DOF_CAMERA.position, DOF_CAMERA.target, near)
  const farZ = Number.isFinite(far) ? depthToZ(DOF_CAMERA.position, DOF_CAMERA.target, far) : -40
  const depthKind = fNumber <= 2.8 ? 'Shallow DoF' : fNumber >= 8 ? 'Deep DoF' : '중간 심도'

  return (
    <CameraStage
      diagramView="side"
      diagram={
        <SceneDiagram
          view="side"
          label="Depth of Field 측면도: 조리개에 따른 초점 띠의 폭"
          bounds={{ z: [-11, 11], y: [-0.5, 5] }}
          cameras={[{ position: DOF_CAMERA.position, target: DOF_CAMERA.target, fov, range: 19 }]}
          footer={
            <span>
              초점 범위 {near.toFixed(1)}m ~ {Number.isFinite(far) ? `${far.toFixed(1)}m` : '∞'}
            </span>
          }
        >
          {({ point }) => {
            const [left, top] = point([0, 3.6, Math.max(-11, farZ)])
            const [right, bottom] = point([0, 0, nearZ])
            return (
              <rect
                data-testid="focus-band"
                x={left}
                y={top}
                width={Math.max(1, right - left)}
                height={bottom - top}
                fill="#facc15"
                fillOpacity="0.35"
                stroke="#fde047"
              />
            )
          }}
        </SceneDiagram>
      }
      cameraView={
        <LensView
          status={`${depthKind} · ${DOF_LAYERS.map((layer) => `${layer.name} ${sharpnessLabel(optics, layer.depth)}`).join(' · ')}`}
          overlay={<Badge className="top-2 left-2">f/{fNumber}</Badge>}
        >
          <LensCanvas
            label="Depth of Field 3D 카메라 화면"
            position={DOF_CAMERA.position}
            target={DOF_CAMERA.target}
            fov={fov}
            lens={{ mode: 'dof', ...dofUniforms(optics) }}
            scene={<SharedScene timeOfDay="day" />}
          />
        </LensView>
      }
      controls={
        <RangeControl label="조리개" min={0} max={APERTURES.length - 1} value={stop} valueText={`f/${fNumber}`} onChange={setStop} />
      }
    />
  )
}

// ── Focal Length ─────────────────────────────────────────────

const FOCAL_NAMES: Record<FocalLength, string> = { 24: '광각', 50: '표준', 135: '망원' }
const FOCAL_CHOICES = FOCAL_OPTIONS.map((value) => ({ value, label: `${value}mm(${FOCAL_NAMES[value]})` }))
const FOCAL_TARGET: Vec3 = [0, FOCAL_CAMERA_Y, HERO.position[2]]

function FocalRig({ dist, fov }: { dist: number; fov: number }) {
  useFrame(({ camera }) => {
    camera.position.set(0, FOCAL_CAMERA_Y, dist)
    camera.lookAt(...FOCAL_TARGET)
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })
  return <SharedScene timeOfDay="day" />
}

export function FocalLengthDemo() {
  const [focal, setFocal] = useState<FocalLength>(50)
  const { dist, fov, backgroundScale } = focalOptics(focal)

  return (
    <CameraStage
      diagramView="side"
      diagram={
        <SceneDiagram
          view="side"
          label="Focal Length 측면도: 초점거리에 따른 카메라 거리와 화각"
          bounds={{ z: [-9, 18], y: [-1, 6] }}
          cameras={[{ position: [0, FOCAL_CAMERA_Y, dist], target: FOCAL_TARGET, fov, range: dist + 9 }]}
          footer={
            <>
              <span>카메라 거리 {dist.toFixed(1)}m</span>
              <span>세로 화각 {Math.round(fov)}°</span>
            </>
          }
        />
      }
      cameraView={
        <LensView
          status={`${focal}mm ${FOCAL_NAMES[focal]} · 인물 크기 동일 · 원경 나무 크기 ${Math.round(backgroundScale * 100)}%(인물 거리 대비)`}
          overlay={<Badge className="top-2 left-2">{focal}mm {FOCAL_NAMES[focal]}</Badge>}
        >
          <ViewportCanvas
            label="Focal Length 3D 카메라 화면"
            camera={{ position: [0, FOCAL_CAMERA_Y, dist], fov, near: 0.1, far: 100 }}
          >
            <FocalRig dist={dist} fov={fov} />
          </ViewportCanvas>
        </LensView>
      }
      controls={<ChoiceGroup legend="초점거리" options={FOCAL_CHOICES} value={focal} onChange={setFocal} />}
    />
  )
}
