import { useGSAP } from '@gsap/react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { TIME_PALETTES } from '@terms/components/scene/scene-colors'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { EditStage } from '@terms/components/stages/EditStage'
import {
  BLOCK_COUNT,
  BULLET_CAMERAS,
  BULLET_ORBIT,
  BULLET_PLAY_DURATION,
  BULLET_RISE,
  FREEZE_HOLD,
  FREEZE_PLAY_DURATION,
  HYPERLAPSE_PLAY_DURATION,
  HYPERLAPSE_SHOTS,
  JUMP_APEX,
  JUMP_END,
  JUMP_START,
  RAMP_FAST,
  RAMP_PLAY_DURATION,
  RAMP_SLOW,
  SMOOTH_FPS,
  STOP_MOTION_DURATION,
  STOP_MOTION_FPS,
  TIMELAPSE_FRAMES,
  TIMELAPSE_INTERVAL_MIN,
  TIMELAPSE_PLAY_DURATION,
  blockHopAt,
  bulletTimeAt,
  freezeFrameAt,
  hyperlapseAt,
  mixPalette,
  quantizeTime,
  rampPlayTimeAt,
  rampSceneTimeAt,
  rampSpeedAt,
  runJumpPose,
  timelapseAt,
  type LapseMode,
  type HeroMotion,
} from '@terms/lib/edit-time-math'

gsap.registerPlugin(useGSAP)

type Vec3 = [number, number, number]

/** 조작 전에는 멈춰 있고, 「재생」을 누르면 0부터 duration초까지 진행하는 재생 시계 */
function usePlayback(duration: number) {
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const rateRef = useRef(1)
  const [rate, setRate] = useState(1)
  const [time, setTime] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [playing, setPlaying] = useState(false)

  useGSAP(
    () => {
      if (playCount === 0) return
      const proxy = { t: 0 }
      tweenRef.current = gsap.to(proxy, {
        t: duration,
        duration,
        ease: 'none',
        onUpdate: () => setTime(proxy.t),
        onComplete: () => {
          setTime(duration)
          setPlaying(false)
        },
      })
      tweenRef.current.timeScale(rateRef.current)
    },
    { dependencies: [playCount], revertOnUpdate: true },
  )

  return {
    time,
    rate,
    playing,
    replayLabel: playCount > 0 ? '다시 재생' : '재생',
    replay() {
      setTime(0)
      setPlaying(true)
      setPlayCount((c) => c + 1)
    },
    reset() {
      setPlaying(false)
      setPlayCount(0)
      setTime(0)
    },
    changeRate(next: number) {
      rateRef.current = next
      setRate(next)
      tweenRef.current?.timeScale(next)
    },
  }
}

function TimeStage({
  playback,
  viewport,
  timeline,
  controls,
}: {
  playback: ReturnType<typeof usePlayback>
  viewport: ReactNode
  timeline: ReactNode
  controls?: ReactNode
}) {
  return (
    <EditStage
      playing={playback.playing}
      replayLabel={playback.replayLabel}
      onReplay={playback.replay}
      viewport={viewport}
      timeline={<div className="rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-slate-200">{timeline}</div>}
      controls={
        <>
          {controls}
          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-600">속도</span>
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.25}
              value={playback.rate}
              aria-label="재생 속도"
              aria-valuetext={`${playback.rate}×`}
              onChange={(event) => playback.changeRate(event.currentTarget.valueAsNumber)}
              className="w-24 accent-indigo-700"
            />
            <span className="w-10 tabular-nums text-slate-600">{playback.rate}×</span>
          </label>
        </>
      }
    />
  )
}

function CameraRig({ position, lookAt, fov }: { position: Vec3; lookAt: Vec3; fov: number }) {
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

function TimelineHeader({ left, time, duration }: { left: string; time: number; duration: number }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 text-[11px] tabular-nums text-slate-300">
      <span>{left}</span>
      <span className="shrink-0">
        {time.toFixed(1)}s / {duration.toFixed(1)}s
      </span>
    </div>
  )
}

function TimelineSvg({ label, height, children }: { label: string; height: number; children: ReactNode }) {
  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴
    <svg viewBox={`0 0 300 ${height}`} role="img" aria-label={label} className="block w-full">
      {children}
    </svg>
  )
}

function Playhead({ x, height }: { x: number; height: number }) {
  return <line x1={x} y1="0" x2={x} y2={height} stroke="#ffffff" strokeWidth="1.5" />
}

// ── Time-lapse ────────────────────────────────────────────────

const CLOCK_MARKS = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)

function ClockTower({ hourAngle, minuteAngle }: { hourAngle: number; minuteAngle: number }) {
  return (
    <group position={[1.9, 0, -1.8]}>
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[0.55, 2.7, 0.55]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.25, 0]}>
        <boxGeometry args={[1.15, 1.15, 0.6]} />
        <meshStandardMaterial color="#78716c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.85, 0.55, 4]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
      </mesh>
      <group position={[0, 3.25, 0.31]}>
        <mesh>
          <circleGeometry args={[0.5, 32]} />
          <meshBasicMaterial color="#fefce8" />
        </mesh>
        {CLOCK_MARKS.map((angle) => (
          <mesh key={angle} position={[Math.sin(angle) * 0.42, Math.cos(angle) * 0.42, 0.005]}>
            <circleGeometry args={[0.025, 8]} />
            <meshBasicMaterial color="#1c1917" />
          </mesh>
        ))}
        <group rotation={[0, 0, -hourAngle]}>
          <mesh position={[0, 0.13, 0.015]}>
            <boxGeometry args={[0.07, 0.28, 0.01]} />
            <meshBasicMaterial color="#1c1917" />
          </mesh>
        </group>
        <group rotation={[0, 0, -minuteAngle]}>
          <mesh position={[0, 0.19, 0.03]}>
            <boxGeometry args={[0.035, 0.4, 0.01]} />
            <meshBasicMaterial color="#b91c1c" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function timelapsePalette(progress: number) {
  return progress <= 0.5
    ? mixPalette(TIME_PALETTES.day, TIME_PALETTES.sunset, progress * 2)
    : mixPalette(TIME_PALETTES.sunset, TIME_PALETTES.night, (progress - 0.5) / 0.3)
}

export function TimeLapseDemo() {
  const playback = usePlayback(TIMELAPSE_PLAY_DURATION)
  const { frame, progress, clock, hourAngle, minuteAngle } = timelapseAt(playback.time)
  const x = 10 + progress * 280

  return (
    <TimeStage
      playback={playback}
      viewport={
        <ViewportCanvas label="낮에서 밤으로 흐르는 Time-lapse 3D 화면" placeholderTone="day">
          <CameraRig position={[0, 2, 7.2]} lookAt={[0, 2.3, 0]} fov={48} />
          <SharedScene
            timeOfDay={progress >= 0.7 ? 'night' : progress >= 0.35 ? 'sunset' : 'day'}
            palette={timelapsePalette(progress)}
            cloudOffset={progress * 9}
            prop={<ClockTower hourAngle={hourAngle} minuteAngle={minuteAngle} />}
          />
        </ViewportCanvas>
      }
      timeline={
        <>
          <TimelineHeader
            left={`촬영 시각 ${clock} · ${frame}/${TIMELAPSE_FRAMES}장`}
            time={playback.time}
            duration={TIMELAPSE_PLAY_DURATION}
          />
          <TimelineSvg label="촬영 간격 타임라인" height={44}>
            {Array.from({ length: TIMELAPSE_FRAMES / 3 + 1 }, (_, i) => {
              const tickX = 10 + (i / (TIMELAPSE_FRAMES / 3)) * 280
              return (
                <line key={i} x1={tickX} x2={tickX} y1="6" y2="22" stroke={tickX <= x ? '#a5b4fc' : '#475569'} strokeWidth="1.5" />
              )
            })}
            <Playhead x={x} height={28} />
            <g fill="#cbd5e1" fontSize="9">
              <text x="10" y="40">12:00 낮</text>
              <text x="150" y="40" textAnchor="middle">18:00 노을</text>
              <text x="290" y="40" textAnchor="end">24:00 밤</text>
            </g>
          </TimelineSvg>
          <p className="mt-1 text-center text-[11px] text-indigo-200">
            {TIMELAPSE_INTERVAL_MIN}분마다 1장 촬영 → 24fps 재생 (눈금 1칸 = 3장)
          </p>
        </>
      }
    />
  )
}

// ── Speed Ramp ────────────────────────────────────────────────

const rampX = (playTime: number) => 34 + (playTime / RAMP_PLAY_DURATION) * 256
const rampY = (speed: number) => 64 - ((speed - RAMP_SLOW) / (RAMP_FAST - RAMP_SLOW)) * 52
const RAMP_PATH = Array.from({ length: 129 }, (_, i) => {
  const playTime = (i / 128) * RAMP_PLAY_DURATION
  return `${rampX(playTime).toFixed(1)},${rampY(rampSpeedAt(rampSceneTimeAt(playTime))).toFixed(1)}`
}).join(' ')

/** HeroMotion을 SharedScene의 주인공 prop으로 바꾼다. */
function heroProps({ x, y, z, facing, stride }: HeroMotion) {
  return { heroPosition: [x, y, z] as Vec3, heroYaw: facing, heroStride: stride }
}

const RUN_CAMERA = { position: [0, 2, 9.6] as Vec3, lookAt: [0, 1.45, 2] as Vec3, fov: 40 }

function RunJumpViewport({ label, sceneTime }: { label: string; sceneTime: number }) {
  return (
    <ViewportCanvas label={label} placeholderTone="day">
      <CameraRig {...RUN_CAMERA} />
      <SharedScene timeOfDay="day" {...heroProps(runJumpPose(sceneTime))} />
    </ViewportCanvas>
  )
}

export function SpeedRampDemo() {
  const playback = usePlayback(RAMP_PLAY_DURATION)
  const sceneTime = rampSceneTimeAt(playback.time)
  const speed = rampSpeedAt(sceneTime)
  const action = sceneTime >= JUMP_START && sceneTime <= JUMP_END ? '점프' : '달리기'

  return (
    <TimeStage
      playback={playback}
      viewport={<RunJumpViewport label="달려와 점프하는 Speed Ramp 3D 화면" sceneTime={sceneTime} />}
      timeline={
        <>
          <TimelineHeader
            left={`${action} · 클립 속도 ${speed.toFixed(2)}×`}
            time={playback.time}
            duration={RAMP_PLAY_DURATION}
          />
          <TimelineSvg label="속도 그래프 2배속에서 0.25배속을 거쳐 2배속" height={84}>
            <rect
              x={rampX(rampPlayTimeAt(JUMP_START))}
              y="6"
              width={rampX(rampPlayTimeAt(JUMP_END)) - rampX(rampPlayTimeAt(JUMP_START))}
              height="64"
              fill="#6366f1"
              opacity="0.22"
            />
            <g stroke="#334155" strokeDasharray="3 3">
              <line x1="34" x2="290" y1={rampY(RAMP_FAST)} y2={rampY(RAMP_FAST)} />
              <line x1="34" x2="290" y1={rampY(RAMP_SLOW)} y2={rampY(RAMP_SLOW)} />
            </g>
            <g fill="#cbd5e1" fontSize="9">
              <text x="2" y={rampY(RAMP_FAST) + 3}>{RAMP_FAST}×</text>
              <text x="2" y={rampY(RAMP_SLOW) + 3}>{RAMP_SLOW}×</text>
              <text x={rampX(rampPlayTimeAt(JUMP_APEX))} y="80" textAnchor="middle">점프 구간</text>
            </g>
            <polyline points={RAMP_PATH} fill="none" stroke="#a5b4fc" strokeWidth="2" />
            <circle cx={rampX(playback.time)} cy={rampY(speed)} r="4.5" fill="#ffffff" />
          </TimelineSvg>
        </>
      }
    />
  )
}

// ── Freeze Frame ──────────────────────────────────────────────

const freezeX = (playTime: number) => 10 + (playTime / FREEZE_PLAY_DURATION) * 280

export function FreezeFrameDemo() {
  const playback = usePlayback(FREEZE_PLAY_DURATION)
  const { sceneTime, frozen } = freezeFrameAt(playback.time)

  return (
    <TimeStage
      playback={playback}
      viewport={
        <div className="relative">
          <RunJumpViewport label="점프 정점에서 멈추는 Freeze Frame 3D 화면" sceneTime={sceneTime} />
          {frozen && (
            // 화살표 끝은 RUN_CAMERA에서 본 점프 정점의 캐릭터 위치(화면 중앙 위)를 가리킨다.
            <svg viewBox="0 0 160 100" className="pointer-events-none absolute inset-0 h-full w-full">
              <path d="M112 22 L90 33 M90 33 l8 -0.5 M90 33 l4.5 -6.5" stroke="#ffffff" strokeWidth="1.5" fill="none" />
              <rect x="108" y="10" width="44" height="17" rx="2" fill="#0f172a" stroke="#ffffff" strokeWidth="0.8" />
              <text x="130" y="21.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff">
                점퍼 하루
              </text>
            </svg>
          )}
        </div>
      }
      timeline={
        <>
          <TimelineHeader
            left={frozen ? '❚❚ 정지 프레임 유지 중' : '▶ 영상 재생 구간'}
            time={playback.time}
            duration={FREEZE_PLAY_DURATION}
          />
          <TimelineSvg label="재생, 정지 프레임, 재생으로 이어지는 타임라인" height={32}>
            <g fill="#0369a1">
              <rect x="10" y="6" width={freezeX(JUMP_APEX) - 11} height="20" rx="2" />
              <rect x={freezeX(JUMP_APEX + FREEZE_HOLD) + 1} y="6" width={289 - freezeX(JUMP_APEX + FREEZE_HOLD)} height="20" rx="2" />
            </g>
            <rect
              x={freezeX(JUMP_APEX)}
              y="6"
              width={freezeX(FREEZE_HOLD) - 10}
              height="20"
              rx="2"
              fill="#b45309"
              stroke="#fde68a"
              strokeDasharray="4 2"
            />
            <g fill="#ffffff" fontSize="9" textAnchor="middle">
              <text x={freezeX(JUMP_APEX / 2)} y="19">재생</text>
              <text x={freezeX(JUMP_APEX + FREEZE_HOLD / 2)} y="19">정지 {FREEZE_HOLD.toFixed(1)}s</text>
              <text x={(freezeX(JUMP_APEX + FREEZE_HOLD) + 290) / 2} y="19">재생</text>
            </g>
            <Playhead x={freezeX(playback.time)} height={32} />
          </TimelineSvg>
        </>
      }
    />
  )
}

// ── Hyperlapse ────────────────────────────────────────────────

const LAPSE_MODES: { key: LapseMode; label: string; plan: string; y: number }[] = [
  { key: 'timelapse', label: 'Time-lapse(고정)', plan: '고정 점', y: 20 },
  { key: 'hyperlapse', label: 'Hyperlapse(이동)', plan: '일정 간격 전진', y: 52 },
]

const planX = (shot: number) => 96 + (shot / HYPERLAPSE_SHOTS) * 180

export function HyperlapseDemo() {
  const playback = usePlayback(HYPERLAPSE_PLAY_DURATION)
  const [mode, setMode] = useState<LapseMode>('hyperlapse')
  const { shot, progress, cameraZ } = hyperlapseAt(playback.time, mode)
  const selected = LAPSE_MODES.find((m) => m.key === mode)!

  return (
    <TimeStage
      playback={playback}
      viewport={
        <ViewportCanvas label="오후에서 노을로 바뀌는 Hyperlapse 비교 3D 화면" placeholderTone="day">
          <CameraRig position={[0.1, 1.9, cameraZ]} lookAt={[0.1, 1.5, cameraZ - 8]} fov={46} />
          <SharedScene
            timeOfDay={progress >= 0.5 ? 'sunset' : 'day'}
            palette={mixPalette(TIME_PALETTES.day, TIME_PALETTES.sunset, progress)}
            cloudOffset={progress * 5}
          />
        </ViewportCanvas>
      }
      timeline={
        <>
          <TimelineHeader
            left={`${selected.label} · ${shot}/${HYPERLAPSE_SHOTS}장 · 오후→노을`}
            time={playback.time}
            duration={HYPERLAPSE_PLAY_DURATION}
          />
          <TimelineSvg label="평면도: Time-lapse는 고정 점, Hyperlapse는 일정 간격 전진 점" height={66}>
            {LAPSE_MODES.map((m) => {
              const active = m.key === mode
              return (
                <g key={m.key} opacity={active ? 1 : 0.5}>
                  <text x="2" y={m.y - 2} fontSize="9" fontWeight={active ? 700 : 400} fill="#e2e8f0">
                    {active ? '▶ ' : ''}
                    {m.key === 'timelapse' ? 'Time-lapse' : 'Hyperlapse'}
                  </text>
                  <text x="2" y={m.y + 9} fontSize="8" fill="#94a3b8">
                    {m.plan}
                  </text>
                  {m.key === 'timelapse' ? (
                    <circle cx={planX(0)} cy={m.y} r="4.5" fill="#fde68a" />
                  ) : (
                    <>
                      {Array.from({ length: HYPERLAPSE_SHOTS + 1 }, (_, i) => (
                        <circle key={i} cx={planX(i)} cy={m.y} r="1.4" fill={active && i <= shot ? '#fde68a' : '#64748b'} />
                      ))}
                      <circle cx={planX(active ? shot : 0)} cy={m.y} r="4.5" fill="#fde68a" />
                    </>
                  )}
                </g>
              )
            })}
            <text x="290" y="36" textAnchor="end" fontSize="8" fill="#94a3b8">
              피사체 방향 →
            </text>
          </TimelineSvg>
        </>
      }
      controls={
        <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
          <legend className="sr-only">촬영 방식 비교</legend>
          {LAPSE_MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={mode === m.key}
              onClick={() => {
                playback.reset()
                setMode(m.key)
              }}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
            >
              {m.label}
            </button>
          ))}
        </fieldset>
      }
    />
  )
}

// ── Bullet Time ───────────────────────────────────────────────

const ORBIT_RADIUS = 5
const BULLET_PHASE_TEXT = {
  rise: '▶ 점프 (시간 흐름)',
  orbit: '❚❚ 시간 정지 · 카메라 공전',
  land: '▶ 착지 (시간 흐름)',
}

export function BulletTimeDemo() {
  const playback = usePlayback(BULLET_PLAY_DURATION)
  const { phase, angle, activeCamera, pose } = bulletTimeAt(playback.time)

  return (
    <TimeStage
      playback={playback}
      viewport={
        <ViewportCanvas label="점프 정점의 인물 주위를 도는 Bullet Time 3D 화면" placeholderTone="day">
          <CameraRig
            position={[Math.sin(angle) * ORBIT_RADIUS, 2.5, Math.cos(angle) * ORBIT_RADIUS]}
            lookAt={[0, 1.7, 0]}
            fov={46}
          />
          <SharedScene timeOfDay="day" {...heroProps(pose)} />
        </ViewportCanvas>
      }
      timeline={
        <>
          <TimelineHeader
            left={`${BULLET_PHASE_TEXT[phase]}${activeCamera === null ? '' : ` · 카메라 ${activeCamera + 1}/${BULLET_CAMERAS}`}`}
            time={playback.time}
            duration={BULLET_PLAY_DURATION}
          />
          <TimelineSvg label="인물 주위에 원형으로 배치한 카메라 평면도" height={132}>
            <circle cx="150" cy="66" r="48" fill="none" stroke="#334155" strokeDasharray="3 3" />
            <circle cx="150" cy="66" r="8" fill="#f97316" />
            <text x="150" y="87" textAnchor="middle" fontSize="9" fill="#fed7aa">인물</text>
            {Array.from({ length: BULLET_CAMERAS }, (_, i) => {
              const a = (i / BULLET_CAMERAS) * Math.PI * 2
              const active = i === activeCamera
              const cx = 150 + Math.sin(a) * 48
              const cy = 66 + Math.cos(a) * 48
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={active ? 10 : 7} fill={active ? '#fde68a' : '#475569'} stroke={active ? '#ffffff' : 'none'} strokeWidth="2" />
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" fontWeight={active ? 700 : 400} fill={active ? '#0f172a' : '#e2e8f0'}>
                    {i + 1}
                  </text>
                </g>
              )
            })}
          </TimelineSvg>
          <p className="mt-1 text-center text-[11px] text-indigo-200">
            점프 {BULLET_RISE.toFixed(1)}s → 정지 {BULLET_ORBIT.toFixed(1)}s → 착지 {BULLET_RISE.toFixed(1)}s
          </p>
        </>
      }
    />
  )
}

// ── Stop Motion ───────────────────────────────────────────────

const BLOCK_COLORS = ['#ef4444', '#facc15', '#3b82f6']
const BLOCK_SIZE = 0.42

function ToyBlocks({ smoothTime, steppedTime }: { smoothTime: number; steppedTime: number }) {
  return (
    <>
      {[
        { time: smoothTime, startX: -1.75, from: -1 },
        { time: steppedTime, startX: 0.65, from: 1 },
      ].map((row) =>
        Array.from({ length: BLOCK_COUNT }, (_, i) => {
          // 양쪽 줄은 화면 바깥쪽에서 뛰어들고, 같은 순서로 도착한다.
          const order = row.from < 0 ? i : BLOCK_COUNT - 1 - i
          const hop = blockHopAt(row.time, order)
          return (
            <mesh
              key={`${row.startX}-${i}`}
              visible={hop.visible}
              position={[row.startX + i * 0.55 + row.from * hop.offsetX, BLOCK_SIZE / 2 + hop.y, 3.4]}
              rotation={[0, 0, -row.from * hop.spin]}
            >
              <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
              <meshStandardMaterial color={BLOCK_COLORS[i]} roughness={0.55} />
            </mesh>
          )
        }),
      )}
    </>
  )
}

const stopX = (time: number) => 74 + (time / STOP_MOTION_DURATION) * 216

export function StopMotionDemo() {
  const playback = usePlayback(STOP_MOTION_DURATION)
  const steppedTime = quantizeTime(playback.time, STOP_MOTION_FPS)
  const rows = [
    { label: `부드러운 ${SMOOTH_FPS}fps`, fps: SMOOTH_FPS, y: 6 },
    { label: `Stop Motion ${STOP_MOTION_FPS}fps`, fps: STOP_MOTION_FPS, y: 30 },
  ]

  return (
    <TimeStage
      playback={playback}
      viewport={
        <div className="relative">
          <ViewportCanvas label="60fps와 12fps 장난감 블록을 비교하는 Stop Motion 3D 화면" placeholderTone="day">
            <CameraRig position={[0, 2.3, 8]} lookAt={[0, 0.9, 2.5]} fov={40} />
            <SharedScene timeOfDay="day" prop={<ToyBlocks smoothTime={playback.time} steppedTime={steppedTime} />} />
          </ViewportCanvas>
          <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-between gap-2 text-[11px] font-semibold text-white">
            <span className="rounded bg-slate-950/75 px-2 py-0.5">왼쪽 · {rows[0]!.label}</span>
            <span className="rounded bg-slate-950/75 px-2 py-0.5">오른쪽 · {rows[1]!.label}</span>
          </div>
        </div>
      }
      timeline={
        <>
          <TimelineHeader
            left={`Stop Motion 프레임 ${Math.round(steppedTime * STOP_MOTION_FPS)}/${Math.round(STOP_MOTION_DURATION * STOP_MOTION_FPS)}`}
            time={playback.time}
            duration={STOP_MOTION_DURATION}
          />
          <TimelineSvg label="60fps는 촘촘한 프레임, 12fps는 성긴 프레임 타임라인" height={50}>
            {rows.map((row) => (
              <g key={row.fps}>
                <text x="0" y={row.y + 10} fontSize="8" fill="#e2e8f0">{row.label}</text>
                {Array.from({ length: Math.round(STOP_MOTION_DURATION * row.fps) + 1 }, (_, i) => (
                  <line key={i} x1={stopX(i / row.fps)} x2={stopX(i / row.fps)} y1={row.y} y2={row.y + 14} stroke="#818cf8" strokeWidth="0.7" />
                ))}
              </g>
            ))}
            <Playhead x={stopX(playback.time)} height={50} />
          </TimelineSvg>
        </>
      }
    />
  )
}
