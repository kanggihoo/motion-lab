import { useFrame } from '@react-three/fiber'
import { useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { SceneDiagram } from '@terms/components/diagram/SceneDiagram'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import { TIME_PALETTES } from '@terms/components/scene/scene-colors'
import { HERO, OTHER, SWING, type Vec3 } from '@terms/components/scene/scene-layout'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { CameraStage } from '@terms/components/stages/CameraStage'
import {
  ANGLE_LEVELS,
  BIRD_SHOTS,
  CAFE,
  DUTCH_MAX_ROLL,
  DUTCH_SHOT,
  ESTABLISHING_SHOTS,
  FACE_PLANE_Z,
  OTS_HERO_YAW,
  POV_HERO_POSITION,
  POV_HERO_YAW,
  POV_SHOTS,
  SHOT_SIZES,
  innerFrames,
  otsCamera,
  pitchDegrees,
  shotSizeCamera,
  swingPoint,
  type BirdView,
  type OtsView,
  type Shot,
  type ShotSize,
} from '@terms/lib/camera-angle-framing-math'
import { footprintCorners, svgPoints } from '@terms/lib/diagram-math'
import { splitViewShift } from '@terms/lib/edit-structure-math'

// ── 공용 조각 ────────────────────────────────────────────────────

/** 정지 구도 카메라. roll(도)은 시선 축 회전이다. */
function ShotCamera({ position, target, fov, roll = 0 }: Shot & { roll?: number }) {
  useFrame(({ camera }) => {
    camera.position.set(...position)
    camera.lookAt(...target)
    camera.rotateZ((roll * Math.PI) / 180)
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })
  return null
}

function ToggleGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string
  value: T
  options: { value: T; label: string }[]
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

function Slider({
  label,
  value,
  max,
  valueText,
  onChange,
  children,
}: {
  label: string
  value: number
  max: number
  valueText: string
  onChange: (value: number) => void
  children?: ReactNode
}) {
  return (
    <label className="grid w-full min-w-56 grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="tabular-nums text-slate-600">{valueText}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="col-span-2 w-full accent-indigo-700"
      />
      {children}
    </label>
  )
}

function Screen({ children, overlay }: { children: ReactNode; overlay: ReactNode }) {
  return (
    <div className="relative">
      {children}
      {overlay}
    </div>
  )
}

function Badge({ children, className = 'top-2 left-2' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`pointer-events-none absolute rounded bg-slate-950/80 px-2 py-1 text-[11px] font-semibold text-white ${className}`}>
      {children}
    </span>
  )
}

function SplitDivider() {
  return <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white" />
}

const HALF_ASPECT = 0.8

function distance(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

// ── High / Low Angle ─────────────────────────────────────────────

export function HighLowAngleDemo() {
  const [index, setIndex] = useState(1)
  const level = ANGLE_LEVELS[index]!
  const pitch = Math.round(pitchDegrees(level))
  const pitchText = pitch === 0 ? '수평' : pitch > 0 ? `${pitch}° 올려다봄` : `${-pitch}° 내려다봄`

  return (
    <CameraStage
      diagramView="side"
      controls={
        <Slider
          label="카메라 높이"
          value={index}
          max={ANGLE_LEVELS.length - 1}
          valueText={`${level.label} · ${level.position[1].toFixed(1)}m`}
          onChange={setIndex}
        >
          <span aria-hidden="true" className="col-span-2 flex justify-between text-[11px] text-slate-500">
            <span>Low</span>
            <span>Eye Level</span>
            <span>High</span>
          </span>
        </Slider>
      }
      diagram={
        <SceneDiagram
          view="side"
          label="카메라 높이와 시선 측면도"
          bounds={{ z: [-3, 6], y: [-0.5, 5.5] }}
          otherPosition={null}
          hide={['fence', 'swing']}
          cameras={[{ position: level.position, target: level.target, fov: level.fov, range: 6.5 }]}
          paths={[
            {
              points: [
                [0, HERO.headY, -1],
                [0, HERO.headY, 6],
              ],
            },
          ]}
          footer={
            <>
              <span>점선: 눈높이</span>
              <span>{pitchText}</span>
            </>
          }
        />
      }
      cameraView={
        <Screen
          overlay={
            <>
              <Badge>
                {level.label} · {pitchText}
              </Badge>
              <Badge className="right-2 bottom-2">
                배경: {level.background} · 인상: {level.impression}
              </Badge>
            </>
          }
        >
          <ViewportCanvas label={`${level.label}로 본 주황 주인공 3D 카메라 화면`}>
            <ShotCamera {...level} />
            <SharedScene timeOfDay="day" hideOther />
          </ViewportCanvas>
        </Screen>
      }
    />
  )
}

// ── Bird's-eye View ──────────────────────────────────────────────

const BIRD_LABELS: Record<BirdView, string> = { high: 'High Angle', bird: "Bird's-eye View" }

export function BirdsEyeViewDemo() {
  const [view, setView] = useState<BirdView>('high')
  const shot = BIRD_SHOTS[view]
  const down = Math.round(-pitchDegrees(shot))
  const caption = view === 'high' ? `대각선 ${down}° · 높낮이가 보임` : `수직 ${down}° · 지도 같은 배치`

  return (
    <CameraStage
      diagramView="side"
      controls={
        <ToggleGroup
          legend="내려다보는 각도"
          value={view}
          onChange={setView}
          options={[
            { value: 'high', label: 'High Angle (대각선)' },
            { value: 'bird', label: "Bird's-eye View (수직 90°)" },
          ]}
        />
      }
      diagram={
        <SceneDiagram
          view="side"
          label="대각선과 수직 하향 카메라 측면도"
          bounds={{ z: [-10, 10], y: [-1, 14] }}
          cameras={(['high', 'bird'] as const).map((id) => ({
            ...BIRD_SHOTS[id],
            range: distance(BIRD_SHOTS[id].position, BIRD_SHOTS[id].target),
            label: id === 'high' ? 'High' : 'Bird',
            dimmed: id !== view,
          }))}
          footer={
            <>
              <span>높이 {shot.position[1]}m</span>
              <span>{caption}</span>
            </>
          }
        />
      }
      cameraView={
        <Screen overlay={<Badge>{BIRD_LABELS[view]}</Badge>}>
          <ViewportCanvas label={`${BIRD_LABELS[view]}로 내려다본 3D 카메라 화면`}>
            <ShotCamera {...shot} />
            <SharedScene timeOfDay="day" />
          </ViewportCanvas>
        </Screen>
      }
    />
  )
}

// ── Dutch Angle ──────────────────────────────────────────────────

export function DutchAngleDemo() {
  const [roll, setRoll] = useState(0)

  return (
    <CameraStage
      controls={
        <Slider label="기울기" value={roll} max={DUTCH_MAX_ROLL} valueText={`${roll}°`} onChange={setRoll} />
      }
      diagram={
        <SceneDiagram
          label="그네를 정면에서 찍는 카메라 평면도"
          bounds={{ x: [-4, 6], z: [-1, 7] }}
          heroPosition={null}
          otherPosition={null}
          cameras={[{ ...DUTCH_SHOT, range: 5 }]}
          footer={
            <>
              <span>roll {roll}°</span>
              <span>평면도에는 안 보임</span>
            </>
          }
        />
      }
      cameraView={
        <Screen
          overlay={
            <>
              <span
                aria-hidden="true"
                data-testid="level-guide"
                className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-dashed border-white"
              />
              <span
                aria-hidden="true"
                data-testid="tilted-horizon"
                className="pointer-events-none absolute inset-x-[8%] top-1/2 h-0.5 -translate-y-1/2 bg-amber-300"
                style={{ rotate: `${roll}deg` }}
              />
              <Badge>{roll === 0 ? '수평 0°' : `Dutch Angle ${roll}°`}</Badge>
              <Badge className="right-2 bottom-2">흰 점선: 수평 기준선 · 노란 실선: 장면의 수평</Badge>
            </>
          }
        >
          <ViewportCanvas label={`그네를 ${roll}° 기울여 찍은 3D 카메라 화면`}>
            <ShotCamera {...DUTCH_SHOT} roll={roll} />
            <SharedScene timeOfDay="day" hideHero hideOther />
          </ViewportCanvas>
        </Screen>
      }
    />
  )
}

// ── Shot Size ────────────────────────────────────────────────────

export function ShotSizeDemo() {
  const [size, setSize] = useState<ShotSize>('full')
  const spec = SHOT_SIZES.find((item) => item.id === size)!
  const camera = shotSizeCamera(size)
  const frames = innerFrames(size)
  const top = spec.centerY + spec.height / 2
  const bottom = spec.centerY - spec.height / 2

  return (
    <CameraStage
      diagramView="side"
      controls={
        <ToggleGroup
          legend="Shot Size 선택"
          value={size}
          onChange={setSize}
          options={SHOT_SIZES.map((item) => ({
            value: item.id,
            label: item.id === 'extreme' ? 'Extreme Close-up' : item.label.replace(' Shot', ''),
          }))}
        />
      }
      diagram={
        <SceneDiagram
          view="side"
          label="프레임에 담기는 세로 범위 측면도"
          bounds={{ z: [-1.5, 5], y: [-0.3, 2.7] }}
          otherPosition={null}
          hide={['hills', 'trees', 'fence', 'swing']}
          cameras={[{ ...camera, range: camera.position[2] - FACE_PLANE_Z }]}
          footer={
            <>
              <span>담는 범위: {spec.range}</span>
              <span>세로 {spec.height.toFixed(2)}m</span>
            </>
          }
        >
          {({ point }) => {
            const [h, v0] = point([0, top, FACE_PLANE_Z])
            const [, v1] = point([0, bottom, FACE_PLANE_Z])
            return (
              <line data-testid="frame-height" x1={h} y1={v0} x2={h} y2={v1} stroke="#facc15" strokeWidth="2.5" />
            )
          }}
        </SceneDiagram>
      }
      cameraView={
        <Screen
          overlay={
            <>
              {frames.map((frame) => (
                <span
                  key={frame.id}
                  data-testid="frame-box"
                  className="pointer-events-none absolute flex items-end border border-dashed border-white outline outline-1 outline-slate-950/60"
                  style={{ top: `${frame.top}%`, left: `${frame.left}%`, width: `${frame.size}%`, height: `${frame.size}%` }}
                >
                  <span className="bg-slate-950/70 px-1 text-[10px] leading-tight whitespace-nowrap text-white">
                    {frame.id === 'extreme' ? 'ECU' : frame.label}
                  </span>
                </span>
              ))}
              <Badge className="bottom-2 left-2">
                현재 화면: {spec.label} · {spec.range}
              </Badge>
            </>
          }
        >
          <ViewportCanvas
            label={`${spec.label}으로 담은 주황 주인공 3D 카메라 화면`}
            camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 100 }}
          >
            <ShotCamera {...camera} />
            <SharedScene timeOfDay="day" hideOther />
          </ViewportCanvas>
        </Screen>
      }
    />
  )
}

// ── POV Shot ─────────────────────────────────────────────────────

/** 카드 소품: 그네에 앉은 사람 눈에 보이는 자기 손·팔·다리 */
function FirstPersonBody() {
  const { skin, heroCoat, pants } = TIME_PALETTES.day
  return (
    <group position={[SWING.position[0], 0, SWING.position[2]]} rotation={[0, POV_HERO_YAW, 0]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.22, 1.12, 0]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          <mesh position={[side * 0.26, 1.01, -0.1]} rotation={[0.74, 0, side * 0.28]}>
            <cylinderGeometry args={[0.04, 0.055, 0.3, 8]} />
            <meshStandardMaterial color={heroCoat} roughness={0.65} />
          </mesh>
          {/* 허벅지(앞으로)와 종아리(아래로) */}
          <mesh position={[side * 0.12, 0.62, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.1, 0.56, 10]} />
            <meshStandardMaterial color={pants} roughness={0.85} />
          </mesh>
          <mesh position={[side * 0.12, 0.38, 0.6]} rotation={[-0.2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.07, 0.52, 10]} />
            <meshStandardMaterial color={pants} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const POV_SHIFT = splitViewShift('x')
const POV_CAMERA_A = { position: POV_SHOTS.third.position, lookAt: POV_SHOTS.third.target, fov: POV_SHOTS.third.fov, viewShift: POV_SHIFT.a }
const POV_CAMERA_B = { position: POV_SHOTS.pov.position, lookAt: POV_SHOTS.pov.target, fov: POV_SHOTS.pov.fov, viewShift: POV_SHIFT.b }

export function PovShotDemo() {
  const splitRef = useRef(0.5)

  return (
    <CameraStage
      diagramView="side"
      diagram={
        <SceneDiagram
          view="side"
          label="3인칭 카메라와 눈높이 POV 카메라 측면도"
          bounds={{ z: [-1.5, 6], y: [-0.3, 3] }}
          heroPosition={POV_HERO_POSITION}
          otherPosition={null}
          hide={['hills', 'trees', 'fence']}
          cameras={[
            { ...POV_SHOTS.third, aspect: HALF_ASPECT, range: 3, label: '3인칭' },
            { ...POV_SHOTS.pov, aspect: HALF_ASPECT, range: 1.8, label: 'POV', color: '#facc15' },
          ]}
          markers={[{ position: swingPoint([0, SWING.seatY, 0]), radius: 0.08, color: '#e2e8f0' }]}
          footer={
            <>
              <span>파랑: 3인칭</span>
              <span>노랑: POV 눈높이</span>
            </>
          }
        />
      }
      cameraView={
        <Screen
          overlay={
            <>
              <SplitDivider />
              <Badge>3인칭 · 뒤에서</Badge>
              <Badge className="top-2 right-2">POV Shot · 앉은 눈</Badge>
            </>
          }
        >
          <ViewportCanvas label="3인칭 시점과 POV Shot을 좌우로 비교하는 3D 카메라 화면">
            <DualSceneComposer
              mode="split"
              progressRef={splitRef}
              cameraA={POV_CAMERA_A}
              cameraB={POV_CAMERA_B}
              sceneA={
                <SharedScene
                  timeOfDay="day"
                  hideOther
                  heroPose="swing"
                  heroPosition={POV_HERO_POSITION}
                  heroYaw={POV_HERO_YAW}
                />
              }
              sceneB={<SharedScene timeOfDay="day" hideOther hideHero prop={<FirstPersonBody />} />}
            />
          </ViewportCanvas>
        </Screen>
      }
    />
  )
}

// ── Over-the-Shoulder ────────────────────────────────────────────

const OTS_CAPTIONS: Record<OtsView, string> = {
  a: 'A 시점 · 앞 어깨 A(주황) → 상대 B(파랑)',
  b: 'B 시점 · 앞 어깨 B(파랑) → 상대 A(주황)',
}

export function OverTheShoulderDemo() {
  const [view, setView] = useState<OtsView>('a')
  const camera = otsCamera(view)

  return (
    <CameraStage
      controls={
        <ToggleGroup
          legend="어깨 너머 시점"
          value={view}
          onChange={setView}
          options={[
            { value: 'a', label: 'A 시점' },
            { value: 'b', label: 'B 시점' },
          ]}
        />
      }
      diagram={
        <SceneDiagram
          label="마주 선 두 인물 뒤의 카메라 두 대 평면도"
          bounds={{ x: [-4.2, 2.4], z: [-2, 3] }}
          cameras={(['a', 'b'] as const).map((id) => ({
            ...otsCamera(id),
            range: 3.2,
            label: id === 'a' ? 'A 시점' : 'B 시점',
            dimmed: id !== view,
          }))}
          paths={[{ points: [HERO.position, OTHER.position] }]}
          footer={
            <>
              <span>점선: 시선 축</span>
              <span>카메라는 같은 쪽</span>
            </>
          }
        >
          {({ point }) => (
            <>
              {[
                { name: 'A', position: HERO.position },
                { name: 'B', position: OTHER.position },
              ].map(({ name, position }) => {
                const [h, v] = point(position)
                return (
                  <text key={name} x={h} y={v - 12} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffffff">
                    {name}
                  </text>
                )
              })}
            </>
          )}
        </SceneDiagram>
      }
      cameraView={
        <Screen overlay={<Badge>{OTS_CAPTIONS[view]}</Badge>}>
          <ViewportCanvas label={`${view.toUpperCase()} 어깨 너머로 상대를 담은 3D 카메라 화면`}>
            <ShotCamera {...camera} />
            <SharedScene timeOfDay="sunset" heroYaw={OTS_HERO_YAW} />
          </ViewportCanvas>
        </Screen>
      }
    />
  )
}

// ── Establishing Shot ────────────────────────────────────────────

const CAFE_WINDOWS = [-1.15, 1.15]
const { position: MEDIUM_FROM } = ESTABLISHING_SHOTS.medium
/** 2컷 카메라를 보도록 돌린다. 두 컷의 인물 방향은 같다. */
const ESTABLISHING_HERO_YAW = Math.atan2(MEDIUM_FROM[0], MEDIUM_FROM[2])

/** 카드 소품: 밤의 카페 건물 */
function Cafe() {
  const { position, width, height, depth, awning } = CAFE
  const front = depth / 2
  return (
    <group position={position}>
      {/* 밤 장면에서 외관과 앞의 인물이 읽히도록 가게 앞을 밝힌다 */}
      <pointLight position={[0, 2.2, front + 2]} color="#fde68a" intensity={14} distance={9} />
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#9a5b45" emissive="#3b1f16" roughness={0.9} />
      </mesh>
      <mesh position={[0, height + 0.1, 0]}>
        <boxGeometry args={[width + 0.3, 0.2, depth + 0.2]} />
        <meshStandardMaterial color="#3f2a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.75, front + awning / 2]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[width, 0.08, awning]} />
        <meshStandardMaterial color="#dc2626" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.75, front + 0.01]}>
        <planeGeometry args={[0.65, 1.5]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {CAFE_WINDOWS.map((x) => (
        <mesh key={x} position={[x, 1.05, front + 0.01]}>
          <planeGeometry args={[0.85, 0.75]} />
          <meshBasicMaterial color="#fde68a" />
        </mesh>
      ))}
    </group>
  )
}

export function EstablishingShotDemo() {
  const [included, setIncluded] = useState(true)
  const splitRef = useRef(0.5)
  const shift = splitViewShift('x')
  const { wide, medium } = ESTABLISHING_SHOTS
  const aspect = included ? HALF_ASPECT : undefined

  function select(next: 'on' | 'off') {
    // 0이면 화면 전체가 B(Medium Shot)다
    splitRef.current = next === 'on' ? 0.5 : 0
    setIncluded(next === 'on')
  }

  return (
    <CameraStage
      controls={
        <ToggleGroup
          legend="Establishing Shot 포함 여부"
          value={included ? 'on' : 'off'}
          onChange={select}
          options={[
            { value: 'on', label: 'Establishing Shot 있음' },
            { value: 'off', label: 'Establishing Shot 없음' },
          ]}
        />
      }
      diagram={
        <SceneDiagram
          label="카페 앞 두 컷의 카메라 위치 평면도"
          bounds={{ x: [-6, 6], z: [-6, 11] }}
          cameras={[
            { ...wide, aspect: HALF_ASPECT, range: 13, label: included ? '1컷' : '1컷(빠짐)', dimmed: !included },
            { ...medium, aspect, range: 2.8, label: included ? '2컷' : '첫 컷', color: '#facc15' },
          ]}
          footer={
            <>
              <span>보라: 1컷</span>
              <span>노랑: 2컷</span>
            </>
          }
        >
          {({ point }) => {
            const [h, v] = point(CAFE.position)
            return (
              <g data-testid="cafe">
                <polygon points={svgPoints(footprintCorners(CAFE.position, CAFE.width, CAFE.depth).map(point))} fill="#9a5b45" />
                <text x={h} y={v + 3} textAnchor="middle" fontSize="9" fill="#fef3c7">
                  카페
                </text>
              </g>
            )
          }}
        </SceneDiagram>
      }
      cameraView={
        <div className="space-y-1.5">
          <Screen
            overlay={
              included ? (
                <>
                  <SplitDivider />
                  <Badge className="bottom-2 left-2">1컷 · 카페 외관</Badge>
                  <Badge className="right-2 bottom-2">2컷 · Medium</Badge>
                </>
              ) : (
                <Badge className="bottom-2 left-2">첫 컷부터 Medium Shot · 어디인지 알 수 없음</Badge>
              )
            }
          >
            <ViewportCanvas label="카페 외관 컷과 Medium Shot 컷을 비교하는 3D 카메라 화면" placeholderTone="night">
              <DualSceneComposer
                mode="split"
                progressRef={splitRef}
                cameraA={{ position: wide.position, lookAt: wide.target, fov: wide.fov, viewShift: shift.a }}
                cameraB={{
                  position: medium.position,
                  lookAt: medium.target,
                  fov: medium.fov,
                  viewShift: included ? shift.b : undefined,
                }}
                sceneA={<SharedScene timeOfDay="night" heroYaw={ESTABLISHING_HERO_YAW} prop={<Cafe />} />}
                sceneB={<SharedScene timeOfDay="night" heroYaw={ESTABLISHING_HERO_YAW} hideOther prop={<Cafe />} />}
              />
            </ViewportCanvas>
          </Screen>
          <ol aria-label="컷 순서" className="grid grid-cols-2 gap-1 text-center text-[11px] font-semibold">
            <li
              className={`rounded border px-1 py-1 ${included ? 'border-slate-700 bg-slate-800 text-white' : 'border-dashed border-slate-400 text-slate-500 line-through'}`}
            >
              1컷 Establishing Shot{!included && ' (빠짐)'}
            </li>
            <li className="rounded border border-slate-700 bg-slate-800 px-1 py-1 text-white">2컷 Medium Shot</li>
          </ol>
        </div>
      }
    />
  )
}
