import { useGSAP } from '@gsap/react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import { SharedScene, type HeroPose } from '@terms/components/scene/SharedScene'
import type { TimeOfDay } from '@terms/components/scene/scene-colors'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { EditStage } from '@terms/components/stages/EditStage'
import {
  clipAt,
  clipRanges,
  CROSS_CUT_CLIPS,
  insertShotClips,
  MONTAGE_CLIPS,
  splitViewShift,
  totalDuration,
  type SplitAxis,
} from '@terms/lib/edit-structure-math'

gsap.registerPlugin(useGSAP)

type Vec3 = [number, number, number]

/** 재생 버튼으로만 시작하는 0 → duration 초 시계 */
function usePlayback(duration: number) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [time, setTime] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [playing, setPlaying] = useState(false)

  useGSAP(
    () => {
      if (playCount === 0) return
      const proxy = { t: 0 }
      gsap.to(proxy, {
        t: duration,
        duration,
        ease: 'none',
        onUpdate: () => setTime(proxy.t),
        onComplete: () => setPlaying(false),
      })
    },
    { scope: rootRef, dependencies: [playCount, duration], revertOnUpdate: true },
  )

  return {
    rootRef,
    time,
    stage: {
      playing,
      replayLabel: playCount > 0 ? '다시 재생' : '재생',
      onReplay: () => {
        setTime(0)
        setPlaying(true)
        setPlayCount((count) => count + 1)
      },
    },
    reset: () => {
      setTime(0)
      setPlaying(false)
      setPlayCount(0)
    },
  }
}

/** 컷 전환: 카메라를 보간 없이 지정 위치로 옮긴다 */
function CutCamera({ position, lookAt, fov = 42 }: { position: Vec3; lookAt: Vec3; fov?: number }) {
  useFrame(({ camera }) => {
    camera.position.set(...position)
    camera.lookAt(...lookAt)
    if (camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
  })
  return null
}

function Screen({ children, badges }: { children: ReactNode; badges: ReactNode }) {
  return (
    <div className="relative">
      {children}
      {badges}
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

interface TimelineClip {
  key: string
  label: string
  start: number
  end: number
  color: string
  active?: boolean
}

const TRACK_HEIGHT = 26
const TRACK_GAP = 5
const TIMELINE_WIDTH = 320

function Timeline({
  label,
  tracks,
  duration,
  time,
  children,
}: {
  label: string
  tracks: TimelineClip[][]
  duration: number
  /** 없으면 playhead를 그리지 않는다 */
  time?: number
  children: ReactNode
}) {
  const height = tracks.length * (TRACK_HEIGHT + TRACK_GAP) - TRACK_GAP
  const x = (seconds: number) => (seconds / duration) * TIMELINE_WIDTH

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 text-[11px] text-slate-200">
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
      <svg viewBox={`0 0 ${TIMELINE_WIDTH} ${height}`} role="img" aria-label={label} className="block w-full">
        {tracks.map((clips, track) => (
          <g key={track} transform={`translate(0, ${track * (TRACK_HEIGHT + TRACK_GAP)})`}>
            <rect width={TIMELINE_WIDTH} height={TRACK_HEIGHT} rx="3" fill="#0f172a" />
            {clips.map((clip) => (
              <g key={clip.key} data-clip={clip.key} data-active={clip.active || undefined}>
                <rect
                  x={x(clip.start) + 1}
                  y="1"
                  width={x(clip.end - clip.start) - 2}
                  height={TRACK_HEIGHT - 2}
                  rx="3"
                  fill={clip.color}
                  stroke={clip.active ? '#ffffff' : 'none'}
                  strokeWidth="2"
                />
                <text
                  x={x((clip.start + clip.end) / 2)}
                  y={TRACK_HEIGHT / 2 + 3.5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#ffffff"
                >
                  {clip.label}
                </text>
              </g>
            ))}
          </g>
        ))}
        {time !== undefined && (
          <line x1={x(time)} x2={x(time)} y1="0" y2={height} stroke="#fde047" strokeWidth="2" />
        )}
      </svg>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 tabular-nums">{children}</div>
    </div>
  )
}

function ToggleGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string
  options: { value: T; label: string }[]
  value: T
  onChange: (next: T) => void
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

function Skateboard({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.3]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.34, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/** 달리는 주인공의 다리 벌림 각도(rad) */
const runStride = (time: number) => Math.sin(time * 14) * 0.7

type MontageId = (typeof MONTAGE_CLIPS)[number]['id']

const MONTAGE_SHOTS: Record<MontageId, {
  timeOfDay: TimeOfDay
  color: string
  pose: HeroPose
  shot: (progress: number) => { hero: Vec3; board: Vec3 }
}> = {
  ride: {
    timeOfDay: 'day',
    color: '#0369a1',
    pose: 'stand',
    shot: (p) => ({ hero: [-0.8 + p * 1.2, 0.13, 0.4], board: [-0.8 + p * 1.2, 0, 0.4] }),
  },
  miss: {
    timeOfDay: 'sunset',
    color: '#b45309',
    pose: 'jump',
    shot: (p) => ({ hero: [-0.5, Math.sin(p * Math.PI) * 0.3, 0.4], board: [-0.4 + p * 1.5, 0, 0.7] }),
  },
  retry: {
    timeOfDay: 'night',
    color: '#4338ca',
    pose: 'run',
    shot: (p) => ({ hero: [-1.3 + p * 1.5, 0, 0.4], board: [-0.6 + p * 1.5, 0, 0.4] }),
  },
  success: {
    timeOfDay: 'day',
    color: '#15803d',
    pose: 'jump',
    shot: (p) => {
      const x = -0.9 + p * 1.8
      const lift = Math.sin(p * Math.PI) * 0.8
      return { hero: [x, 0.13 + lift, 0.4], board: [x, lift, 0.4] }
    },
  },
}

export function MontageDemo() {
  const duration = totalDuration(MONTAGE_CLIPS)
  const { rootRef, time, stage } = usePlayback(duration)
  const { clip, index, progress } = clipAt(MONTAGE_CLIPS, time)
  const shot = MONTAGE_SHOTS[clip.id]
  const { hero, board } = shot.shot(progress)

  return (
    <div ref={rootRef}>
      <EditStage
        {...stage}
        viewport={
          <Screen badges={<Badge>{clip.day}요일 · {clip.label}</Badge>}>
            <ViewportCanvas label="일주일 스케이트보드 연습 Montage 3D 화면" placeholderTone={shot.timeOfDay}>
              <CutCamera position={[0, 1.55, 5.2]} lookAt={[0, 1, 0]} />
              <SharedScene
                timeOfDay={shot.timeOfDay}
                heroPose={shot.pose}
                heroPosition={hero}
                heroYaw={shot.pose === 'run' ? Math.PI / 2 : 0.35}
                heroStride={shot.pose === 'run' ? runStride(time) : 0}
                hideOther
                prop={<Skateboard position={board} />}
              />
            </ViewportCanvas>
          </Screen>
        }
        timeline={
          <Timeline
            label="1초 클립 4장을 이어 붙인 Montage 타임라인"
            duration={duration}
            time={time}
            tracks={[
              clipRanges(MONTAGE_CLIPS).map((range) => ({
                key: range.clip.id,
                label: `${range.clip.day} · ${range.clip.label}`,
                start: range.start,
                end: range.end,
                color: MONTAGE_SHOTS[range.clip.id].color,
                active: range.clip.id === clip.id,
              })),
            ]}
          >
            <span>클립 {index + 1}/{MONTAGE_CLIPS.length} · {clip.day}요일 {clip.label}</span>
            <span>{time.toFixed(1)}s / {duration.toFixed(1)}s (일주일을 압축)</span>
          </Timeline>
        }
      />
    </div>
  )
}

function Train({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.9, -1.4]}>
        <boxGeometry args={[1.35, 1.3, 3.2]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.62, -1.4]}>
        <boxGeometry args={[1.15, 0.16, 3.0]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 1.15, 0.21]}>
          <boxGeometry args={[0.46, 0.4, 0.04]} />
          <meshStandardMaterial color="#bae6fd" roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.58, 0.23]}>
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      {[-0.56, 0.56].flatMap((x) =>
        [-0.3, -2.5].map((wheelZ) => (
          <mesh key={`${x}/${wheelZ}`} position={[x, 0.24, wheelZ]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.18, 14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  )
}

const CROSS_CUT_COLORS = { A: '#c2410c', B: '#1d4ed8' }

export function CrossCuttingDemo() {
  const duration = totalDuration(CROSS_CUT_CLIPS)
  const { rootRef, time, stage } = usePlayback(duration)
  const { clip, index } = clipAt(CROSS_CUT_CLIPS, time)
  // 두 사건은 동시에 진행되므로 위치는 클립이 아니라 전체 시간이 정한다
  const progress = time / duration
  const isA = clip.side === 'A'
  const sideName = isA ? 'A · 달리는 캐릭터' : 'B · 다가오는 기차'

  return (
    <div ref={rootRef}>
      <EditStage
        {...stage}
        viewport={
          <Screen badges={<Badge>{sideName}</Badge>}>
            <ViewportCanvas label="달리는 캐릭터와 다가오는 기차의 Cross-cutting 3D 화면">
              {isA ? (
                <CutCamera position={[0, 1.5, 5.6]} lookAt={[0, 1, 0]} />
              ) : (
                <CutCamera position={[0.7, 1.5, 5.4]} lookAt={[0, 1, -3]} fov={38} />
              )}
              <SharedScene
                timeOfDay="day"
                heroPose="run"
                heroPosition={[-1.35 + progress * 2.7, 0, 0.8]}
                heroYaw={Math.PI / 2}
                heroStride={runStride(time)}
                hideHero={!isA}
                hideOther
                prop={isA ? undefined : <Train z={-9.5 + progress * 9.5} />}
              />
            </ViewportCanvas>
          </Screen>
        }
        timeline={
          <Timeline
            label="길이가 점점 짧아지는 A/B 교차 타임라인"
            duration={duration}
            time={time}
            tracks={(['A', 'B'] as const).map((side) =>
              clipRanges(CROSS_CUT_CLIPS)
                .filter((range) => range.clip.side === side)
                .map((range) => ({
                  key: range.clip.id,
                  label: side,
                  start: range.start,
                  end: range.end,
                  color: CROSS_CUT_COLORS[side],
                  active: range.clip.id === clip.id,
                })),
            )}
          >
            <span>컷 {index + 1}/{CROSS_CUT_CLIPS.length} · {sideName}</span>
            <span>이번 컷 {clip.duration.toFixed(2)}s (점점 짧아짐)</span>
          </Timeline>
        }
      />
    </div>
  )
}

function Phone({ position }: { position: Vec3 }) {
  return (
    <group position={position} rotation={[0, 0, -0.28]}>
      <mesh>
        <boxGeometry args={[0.11, 0.32, 0.07]} />
        <meshStandardMaterial color="#111827" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.02, 0.04]}>
        <boxGeometry args={[0.07, 0.2, 0.01]} />
        <meshBasicMaterial color="#67e8f9" />
      </mesh>
    </group>
  )
}

const SPLIT_CAMERAS = {
  // 좌우 분할은 전신, 상하 분할은 낮은 칸에 맞춰 상반신을 잡는다
  x: { height: 1.5, target: 1.05 },
  y: { height: 1.5, target: 1.3 },
}

export function SplitScreenDemo() {
  const [axis, setAxis] = useState<SplitAxis>('x')
  const splitRef = useRef(0.5)
  const shift = splitViewShift(axis)
  const { height, target } = SPLIT_CAMERAS[axis]
  const horizontal = axis === 'x'

  return (
    <EditStage
      controls={
        <ToggleGroup
          legend="분할 방향"
          value={axis}
          onChange={setAxis}
          options={[
            { value: 'x', label: '좌우' },
            { value: 'y', label: '상하' },
          ]}
        />
      }
      viewport={
        <Screen
          badges={
            <>
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bg-white ${horizontal ? 'inset-y-0 left-1/2 w-0.5 -translate-x-1/2' : 'inset-x-0 top-1/2 h-0.5 -translate-y-1/2'}`}
              />
              <Badge>A · 낮, 전화 거는 캐릭터</Badge>
              <Badge className="right-2 bottom-2">B · 노을, 전화 받는 친구</Badge>
            </>
          }
        >
          <ViewportCanvas label={`전화 통화하는 두 장면의 ${horizontal ? '좌우' : '상하'} Split Screen 3D 화면`}>
            <DualSceneComposer
              mode="split"
              splitAxis={axis}
              progressRef={splitRef}
              cameraA={{ position: [0.2, height, 4.4], lookAt: [0, target, 0], fov: 42, viewShift: shift.a }}
              cameraB={{ position: [-1.2, height, 3.95], lookAt: [-1.55, target - 0.05, -0.45], fov: 42, viewShift: shift.b }}
              sceneA={<SharedScene timeOfDay="day" hideOther prop={<Phone position={[0.28, 1.5, 0.1]} />} />}
              sceneB={<SharedScene timeOfDay="sunset" hideHero prop={<Phone position={[-1.28, 1.44, -0.35]} />} />}
            />
          </ViewportCanvas>
        </Screen>
      }
      timeline={
        <Timeline
          label="두 클립이 같은 시간을 함께 차지하는 Split Screen 타임라인"
          duration={4}
          tracks={[
            [{ key: 'a', label: 'A · 낮 캐릭터', start: 0, end: 4, color: '#0369a1' }],
            [{ key: 'b', label: 'B · 노을 친구', start: 0, end: 4, color: '#b45309' }],
          ]}
        >
          <span>{horizontal ? '좌우 분할: A 왼쪽 · B 오른쪽' : '상하 분할: A 위 · B 아래'}</span>
          <span>컷 없이 동시에 표시</span>
        </Timeline>
      }
    />
  )
}

const CLOCK_POSITION: Vec3 = [1.15, 2.15, -1]

function Clock() {
  const [x, y, z] = CLOCK_POSITION
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, y / 2, -0.08]}>
        <cylinderGeometry args={[0.05, 0.07, y, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <group position={[0, y, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.09, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <circleGeometry args={[0.38, 32]} />
          <meshBasicMaterial color="#f8fafc" />
        </mesh>
        {Array.from({ length: 12 }, (_, hour) => (
          <group key={hour} rotation={[0, 0, (-hour * Math.PI) / 6]}>
            <mesh position={[0, 0.32, 0.056]}>
              <planeGeometry args={[hour % 3 === 0 ? 0.035 : 0.018, 0.075]} />
              <meshBasicMaterial color="#0f172a" />
            </mesh>
          </group>
        ))}
        {/* 5시: 시침은 12시에서 시계 방향 150도, 분침은 12시 */}
        <group rotation={[0, 0, (-5 * Math.PI) / 6]}>
          <mesh position={[0, 0.09, 0.062]}>
            <planeGeometry args={[0.05, 0.2]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
        </group>
        <mesh position={[0, 0.14, 0.066]}>
          <planeGeometry args={[0.028, 0.3]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <circleGeometry args={[0.035, 12]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>
    </group>
  )
}

export function InsertShotDemo() {
  const [enabled, setEnabled] = useState(true)
  const clips = insertShotClips(enabled)
  const duration = totalDuration(clips)
  const { rootRef, time, stage, reset } = usePlayback(duration)
  const { clip } = clipAt(clips, time)
  const inserting = clip.id === 'insert'

  return (
    <div ref={rootRef}>
      <EditStage
        {...stage}
        controls={
          <ToggleGroup
            legend="Insert Shot 사용 여부"
            value={enabled ? 'on' : 'off'}
            onChange={(next) => {
              reset()
              setEnabled(next === 'on')
            }}
            options={[
              { value: 'on', label: 'Insert Shot 켬' },
              { value: 'off', label: 'Insert Shot 끔' },
            ]}
          />
        }
        viewport={
          <Screen badges={<Badge>{inserting ? 'INSERT · 시계 5시' : '본 장면 · 캐릭터'}</Badge>}>
            <ViewportCanvas label="캐릭터 장면에 시계 클로즈업을 끼우는 Insert Shot 3D 화면">
              {inserting ? (
                <CutCamera position={[CLOCK_POSITION[0], CLOCK_POSITION[1], 1]} lookAt={CLOCK_POSITION} fov={30} />
              ) : (
                <CutCamera position={[0.1, 1.65, 5.8]} lookAt={[0, 1.2, 0]} />
              )}
              <SharedScene timeOfDay="day" prop={<Clock />} />
            </ViewportCanvas>
          </Screen>
        }
        timeline={
          <Timeline
            label={enabled ? '캐릭터, 시계 1초 Insert, 캐릭터 타임라인' : 'Insert 없이 캐릭터만 이어지는 타임라인'}
            duration={duration}
            time={time}
            tracks={[
              clipRanges(clips).map((range) => ({
                key: range.clip.id,
                label: range.clip.id === 'insert' ? '시계 5시 · 1s' : range.clip.label,
                start: range.start,
                end: range.end,
                color: range.clip.id === 'insert' ? '#b45309' : '#0369a1',
                active: range.clip.id === clip.id,
              })),
            ]}
          >
            <span>
              {enabled ? '켬: 클로즈업으로 5시가 바로 읽힌다' : '끔: 뒤쪽 시계가 작아 시각을 놓치기 쉽다'}
            </span>
            <span>{time.toFixed(1)}s / {duration.toFixed(1)}s</span>
          </Timeline>
        }
      />
    </div>
  )
}

function Sapling() {
  return (
    <group position={[0.5, 0, 0.25]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.28, 0.38, 0.1, 14]} />
        <meshStandardMaterial color="#6d4c41" roughness={1} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.6, 8]} />
        <meshStandardMaterial color="#795548" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <coneGeometry args={[0.24, 0.42, 10]} />
        <meshStandardMaterial color="#43a047" roughness={0.85} />
      </mesh>
    </group>
  )
}

const FLASHBACK_CLIPS = [
  { id: 'now-before', label: '현재', duration: 1.5 },
  { id: 'past', label: 'Flashback · 과거', duration: 2 },
  { id: 'now-after', label: '현재', duration: 1.5 },
]

// 과거(오른쪽 절반)에만 얹는 표시 관습: 바랜 노란 톤, 흐린 가장자리, 비네팅
const PAST_TONE = { backdropFilter: 'sepia(0.5) contrast(0.9)' }
const PAST_EDGE_MASK = 'radial-gradient(ellipse at center, transparent 45%, black 88%)'
const PAST_EDGE = {
  backdropFilter: 'blur(3px)',
  maskImage: PAST_EDGE_MASK,
  WebkitMaskImage: PAST_EDGE_MASK,
}
const PAST_VIGNETTE = {
  background: 'radial-gradient(ellipse at center, transparent 48%, rgb(66 40 10 / 0.7) 100%)',
}

export function FlashbackDemo() {
  const splitRef = useRef(0.5)
  const shift = splitViewShift('x')

  return (
    <EditStage
      viewport={
        <Screen
          badges={
            <>
              {/* 감싸는 요소에 overflow·radius를 주면 Chromium이 가장자리 mask를 무시하고 전체를 흐린다 */}
              <div aria-hidden="true" data-past-overlay className="pointer-events-none absolute inset-y-0 right-0 w-1/2">
                <div className="absolute inset-0" style={PAST_TONE} />
                <div className="absolute inset-0" style={PAST_EDGE} />
                <div className="absolute inset-0 rounded-r-lg" style={PAST_VIGNETTE} />
              </div>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white" />
              <Badge>현재 · 선명한 색</Badge>
              <Badge className="right-2 bottom-2">과거 · 바랜 톤 + 흐린 가장자리</Badge>
            </>
          }
        >
          <ViewportCanvas label="큰 나무를 보는 현재와 나무를 심던 과거의 Flashback 비교 3D 화면">
            <DualSceneComposer
              mode="split"
              progressRef={splitRef}
              cameraA={{ position: [0.9, 2, 5.2], lookAt: [-0.6, 1.6, -2.5], fov: 42, viewShift: shift.a }}
              cameraB={{ position: [0.1, 1.6, 4.8], lookAt: [0.05, 0.9, 0], fov: 42, viewShift: shift.b }}
              sceneA={<SharedScene timeOfDay="day" heroPosition={[0.3, 0, 0]} heroYaw={-2.85} hideOther />}
              sceneB={<SharedScene timeOfDay="day" heroPosition={[-0.35, 0, 0]} heroYaw={0.8} hideOther prop={<Sapling />} />}
            />
          </ViewportCanvas>
        </Screen>
      }
      timeline={
        <Timeline
          label="현재 사이에 과거 Flashback이 끼어드는 타임라인"
          duration={totalDuration(FLASHBACK_CLIPS)}
          tracks={[
            clipRanges(FLASHBACK_CLIPS).map((range) => ({
              key: range.clip.id,
              label: range.clip.label,
              start: range.start,
              end: range.end,
              color: range.clip.id === 'past' ? '#92700c' : '#0369a1',
            })),
          ]}
        >
          <span>이야기 순서: 현재 → 과거 삽입 → 현재</span>
          <span>색감·가장자리는 과거를 알리는 관습</span>
        </Timeline>
      }
    />
  )
}
