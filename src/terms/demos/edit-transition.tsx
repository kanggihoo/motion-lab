import { useGSAP } from '@gsap/react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useRef, useState, type ReactNode } from 'react'
import { AudioWaveform } from '@terms/components/AudioWaveform'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import type { WipeShape } from '@terms/components/scene/look-post'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { EditStage } from '@terms/components/stages/EditStage'
import { TIME_PALETTES } from '@terms/components/scene/scene-colors'
import { DISSOLVE_TOTAL_DURATION, dissolveMixAt, type OverlapDuration } from '@terms/lib/demo-math'
import {
  FADE_DURATION,
  FADE_POINTS,
  IRIS_DURATION,
  IRIS_HOLD,
  IRIS_MAX_RADIUS,
  JUMP_EDITED_DURATION,
  JUMP_KEPT_SEGMENTS,
  JUMP_SOURCE_DURATION,
  MATCH_CUT_AT,
  MATCH_DURATION,
  SMASH_CUT_AT,
  SMASH_DURATION,
  SPLIT_EDIT_DURATION,
  SPLIT_EDIT_VIDEO_CUT,
  WHIP_DURATION,
  WHIP_WINDOW,
  WIPE_DURATION,
  WIPE_WINDOW,
  audioClipAt,
  fadeStateAt,
  hardCutAt,
  irisRadiusAt,
  jumpCutHeroX,
  jumpCutSourceAt,
  matchedDistance,
  sphereScreenRadius,
  splitEditAudioCut,
  whipPanAt,
  wipeProgressAt,
  type AudioClip,
  type FadeMode,
  type IrisDirection,
  type SplitEditMode,
} from '@terms/lib/edit-transition-math'

gsap.registerPlugin(useGSAP)

const OVERLAP_OPTIONS: OverlapDuration[] = [0.3, 1, 2]

export function DissolveDemo() {
  const rootRef = useRef<HTMLDivElement>(null)
  const mixRef = useRef(0)

  const [overlap, setOverlap] = useState<OverlapDuration>(1)
  const [time, setTime] = useState(0)
  const [playCount, setPlayCount] = useState(0)
  const [playing, setPlaying] = useState(false)

  useGSAP(
    () => {
      if (playCount === 0) return
      const proxy = { t: 0 }
      gsap.to(proxy, {
        t: DISSOLVE_TOTAL_DURATION,
        duration: DISSOLVE_TOTAL_DURATION,
        ease: 'none',
        onUpdate: () => {
          mixRef.current = dissolveMixAt(proxy.t, overlap)
          setTime(proxy.t)
        },
        onComplete: () => {
          mixRef.current = 1
          setTime(DISSOLVE_TOTAL_DURATION)
          setPlaying(false)
        },
      })
    },
    { scope: rootRef, dependencies: [playCount, overlap], revertOnUpdate: true },
  )

  function handleReplay() {
    mixRef.current = 0
    setTime(0)
    setPlaying(true)
    setPlayCount((c) => c + 1)
  }

  function selectOverlap(nextOverlap: OverlapDuration) {
    setPlaying(false)
    setPlayCount(0)
    setOverlap(nextOverlap)
    mixRef.current = 0
    setTime(0)
  }

  const mix = dissolveMixAt(time, overlap)
  const overlapStartPct = ((DISSOLVE_TOTAL_DURATION / 2 - overlap / 2) / DISSOLVE_TOTAL_DURATION) * 100
  const overlapEndPct = ((DISSOLVE_TOTAL_DURATION / 2 + overlap / 2) / DISSOLVE_TOTAL_DURATION) * 100
  const overlapWidthPct = overlapEndPct - overlapStartPct
  const playheadPct = (time / DISSOLVE_TOTAL_DURATION) * 100

  return (
    <div ref={rootRef}>
      <EditStage
        playing={playing}
        replayLabel={playCount > 0 ? '다시 재생' : '재생'}
        onReplay={handleReplay}
        controls={
          <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
            <legend className="sr-only">겹침 길이 선택</legend>
            <span className="mr-1 text-xs font-semibold text-slate-600">겹침 길이:</span>
            {OVERLAP_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={overlap === opt}
                onClick={() => selectOverlap(opt)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
              >
                {opt.toFixed(1)}s
              </button>
            ))}
          </fieldset>
        }
        viewport={
          <ViewportCanvas label="낮에서 노을로 넘어가는 Dissolve 3D 화면" placeholderTone="day">
            <DualSceneComposer
              mode="dissolve"
              progressRef={mixRef}
              cameraA={{ position: [0.35, 1.75, 6.2], lookAt: [0, 1.0, 0], fov: 42 }}
              cameraB={{ position: [-0.45, 1.65, 5.6], lookAt: [0, 1.05, 0], fov: 42 }}
              sceneA={<SharedScene timeOfDay="day" />}
              sceneB={<SharedScene timeOfDay="sunset" />}
            />
          </ViewportCanvas>
        }
        timeline={
          <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-slate-200">
            <div className="mb-2 flex items-center justify-between text-[11px] tabular-nums text-slate-300">
              <span>낮 {Math.round((1 - mix) * 100)}% · 노을 {Math.round(mix * 100)}%</span>
              <span>{time.toFixed(1)}s / {DISSOLVE_TOTAL_DURATION.toFixed(1)}s</span>
            </div>

            <div className="relative space-y-1.5 py-1">
              {/* Overlap highlight band */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 rounded border border-indigo-400/70 bg-indigo-500/20"
                style={{ left: `${overlapStartPct}%`, width: `${overlapWidthPct}%` }}
              />

              {/* Track A: Day */}
              <div className="relative h-6 w-full rounded bg-slate-900">
                <div
                  className="flex h-full items-center rounded bg-sky-600/85 px-2 text-[11px] font-semibold text-white"
                  style={{ width: `${overlapEndPct}%` }}
                >
                  클립 A · 낮
                </div>
              </div>

              {/* Track B: Sunset */}
              <div className="relative h-6 w-full rounded bg-slate-900">
                <div
                  className="flex h-full items-center justify-end rounded bg-amber-600/85 px-2 text-[11px] font-semibold text-white"
                  style={{ marginLeft: `${overlapStartPct}%`, width: `${100 - overlapStartPct}%` }}
                >
                  클립 B · 노을
                </div>
              </div>

              {/* Playhead */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white"
                style={{ left: `${playheadPct}%` }}
              />
            </div>

            <div className="mt-1.5 text-center text-[11px] text-indigo-200">
              보라 구간: 두 장면 겹침 ({overlap.toFixed(1)}s)
            </div>
          </div>
        }
      />
    </div>
  )
}

// ── Dissolve 외 Transition 카드 공용 ─────────────────────────────

type Vec3 = [number, number, number]

/** 조작해야 시작하고 한 번 재생하는 시계. reset은 정지 상태의 처음으로 돌린다. */
function usePlayback(duration: number, onTick?: (time: number) => void) {
  const scopeRef = useRef<HTMLDivElement>(null)
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
        onUpdate: () => {
          onTick?.(proxy.t)
          setTime(proxy.t)
        },
        onComplete: () => setPlaying(false),
      })
    },
    { scope: scopeRef, dependencies: [playCount], revertOnUpdate: true },
  )

  function replay() {
    onTick?.(0)
    setTime(0)
    setPlaying(true)
    setPlayCount((c) => c + 1)
  }

  function reset() {
    setPlaying(false)
    setPlayCount(0)
    setTime(0)
  }

  const stageProps = { playing, replayLabel: playCount > 0 ? '다시 재생' : '재생', onReplay: replay }

  return { scopeRef, time, reset, stageProps }
}

function ChoiceGroup<T extends string>({
  legend,
  options,
  value,
  onSelect,
  disabled = false,
}: {
  legend: string
  options: readonly { value: T; label: string }[]
  value: T
  onSelect: (value: T) => void
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled} className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0 disabled:opacity-50">
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

function TimelinePanel({
  status,
  time,
  duration,
  note,
  children,
}: {
  status: string
  time: number
  duration: number
  note: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs text-slate-200">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] tabular-nums text-slate-300">
        <span data-testid="timeline-status">{status}</span>
        <span className="shrink-0">
          {time.toFixed(1)}s / {duration.toFixed(1)}s
        </span>
      </div>
      {children}
      <div className="mt-1.5 text-center text-[11px] text-indigo-200">{note}</div>
    </div>
  )
}

type ClipTone = 'a' | 'b' | 'c' | 'cut'

const CLIP_FILLS: Record<ClipTone, string> = { a: '#0369a1', b: '#b45309', c: '#4338ca', cut: '#1e293b' }

interface TimelineClip {
  start: number
  end: number
  label: string
  tone: ClipTone
}

const TRACK_WIDTH = 320
const TRACK_HEIGHT = 22
const TRACK_STEP = 27

/** 클립 배열 타임라인. 위 트랙부터 그리고, band는 전환 구간, marker는 컷 지점이다. */
function TrackTimeline({
  label,
  tracks,
  duration,
  playhead,
  band,
  marker,
}: {
  label: string
  tracks: TimelineClip[][]
  duration: number
  playhead: number
  band?: { start: number; end: number; label: string }
  marker?: { at: number; label: string }
}) {
  const x = (t: number) => (t / duration) * TRACK_WIDTH
  const tracksHeight = tracks.length * TRACK_STEP
  const height = tracksHeight + (band || marker ? 13 : 0)

  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴
    <svg viewBox={`0 0 ${TRACK_WIDTH} ${height}`} role="img" aria-label={label} className="block w-full">
      {tracks.map((clips, row) =>
        clips.map((clip) => (
          <rect
            key={`${row}-${clip.start}`}
            x={x(clip.start) + 0.5}
            y={row * TRACK_STEP}
            width={x(clip.end - clip.start) - 1}
            height={TRACK_HEIGHT}
            rx="3"
            fill={CLIP_FILLS[clip.tone]}
            stroke={clip.tone === 'cut' ? '#94a3b8' : 'none'}
            strokeDasharray={clip.tone === 'cut' ? '3 2' : undefined}
          />
        )),
      )}
      {band && (
        <g>
          <rect
            x={x(band.start)}
            y="0"
            width={x(band.end - band.start)}
            height={tracksHeight - 5}
            fill="#818cf8"
            fillOpacity="0.22"
            stroke="#c7d2fe"
            strokeDasharray="4 2"
          />
          {band.label && (
            <text x={x((band.start + band.end) / 2)} y={height - 3} textAnchor="middle" fontSize="9" fill="#c7d2fe">
              {band.label}
            </text>
          )}
        </g>
      )}
      {tracks.map((clips, row) =>
        clips.map((clip) => (
          <text
            key={`${row}-${clip.start}`}
            x={x((clip.start + clip.end) / 2)}
            y={row * TRACK_STEP + 15}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#ffffff"
          >
            {clip.label}
          </text>
        )),
      )}
      {marker && (
        <g>
          <line x1={x(marker.at)} y1="0" x2={x(marker.at)} y2={tracksHeight - 3} stroke="#fde047" strokeWidth="2" />
          <text x={x(marker.at)} y={height - 3} textAnchor="middle" fontSize="9" fill="#fde047">
            ▲ {marker.label}
          </text>
        </g>
      )}
      <line x1={x(playhead)} y1="0" x2={x(playhead)} y2={tracksHeight - 3} stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  )
}

function CameraAim({ target }: { target: Vec3 }) {
  useFrame(({ camera }) => camera.lookAt(...target))
  return null
}

// ── Jump Cut ────────────────────────────────────────────────

const JUMP_SOURCE_CLIPS: TimelineClip[] = [
  { start: 0, end: 1, label: '조각 1', tone: 'a' },
  { start: 1, end: 3, label: '✕ 삭제', tone: 'cut' },
  { start: 3, end: 4, label: '조각 2', tone: 'b' },
  { start: 4, end: 6, label: '✕ 삭제', tone: 'cut' },
  { start: 6, end: 7, label: '조각 3', tone: 'c' },
]

const JUMP_EDITED_CLIPS: TimelineClip[] = [
  { start: 0, end: 1, label: '조각 1', tone: 'a' },
  { start: 1, end: 2, label: '조각 2', tone: 'b' },
  { start: 2, end: 3, label: '조각 3', tone: 'c' },
]

export function JumpCutDemo() {
  const { scopeRef, time, stageProps } = usePlayback(JUMP_EDITED_DURATION)
  const { index, sourceTime } = jumpCutSourceAt(time)

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        viewport={
          <ViewportCanvas label="고정 카메라 앞에서 인물이 순간이동하는 Jump Cut 3D 화면">
            <CameraAim target={[0, 1, 0]} />
            <SharedScene timeOfDay="day" heroPosition={[jumpCutHeroX(sourceTime), 0, 0.8]} />
          </ViewportCanvas>
        }
        timeline={
          <TimelinePanel
            status={`조각 ${index + 1} / ${JUMP_KEPT_SEGMENTS.length} · 원본 ${sourceTime.toFixed(1)}s`}
            time={time}
            duration={JUMP_EDITED_DURATION}
            note="카메라는 고정, 잘라낸 시간만큼 인물이 건너뜁니다"
          >
            <p className="mb-1 text-[11px] text-slate-300">원본 테이크 (점선 = 잘라낸 중간)</p>
            <TrackTimeline
              label="원본 테이크에서 중간 두 구간을 잘라낸 타임라인"
              tracks={[JUMP_SOURCE_CLIPS]}
              duration={JUMP_SOURCE_DURATION}
              playhead={sourceTime}
            />
            <p className="mt-2 mb-1 text-[11px] text-slate-300">편집본 (남은 조각을 이어 붙임)</p>
            <TrackTimeline
              label="남은 세 조각을 이어 붙인 편집본 타임라인"
              tracks={[JUMP_EDITED_CLIPS]}
              duration={JUMP_EDITED_DURATION}
              playhead={time}
            />
          </TimelinePanel>
        }
      />
    </div>
  )
}

// ── Wipe ────────────────────────────────────────────────────

const fraction = (value: number) => value - Math.floor(value)

// 무리수 배수의 소수부로 고르게 흩는다. 렌더마다 같은 자리다.
const SNOWFLAKES = Array.from({ length: 140 }, (_, i) => ({
  x: fraction(i * 0.8191725) * 10 - 5,
  y: fraction(i * 0.6710436) * 4.5,
  z: fraction(i * 0.5497005) * 4.5 - 1.5,
  size: 0.022 + (i % 3) * 0.01,
}))

/** 눈 (Wipe 카드의 소품). 재생 시간만큼만 내린다. */
function SnowProp({ time }: { time: number }) {
  return (
    <group>
      {SNOWFLAKES.map((flake, index) => (
        <mesh key={index} position={[flake.x, (((flake.y - time * 0.7) % 4.5) + 4.5) % 4.5, flake.z]}>
          <sphereGeometry args={[flake.size, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  )
}

type WipeCompare = 'wipe' | 'dissolve'

const WIPE_COMPARE_OPTIONS = [
  { value: 'wipe', label: 'Wipe' },
  { value: 'dissolve', label: 'Dissolve' },
] as const

const WIPE_SHAPE_OPTIONS = [
  { value: 'horizontal', label: '수평' },
  { value: 'diagonal', label: '대각선' },
  { value: 'circle', label: '원형' },
] as const

export function WipeDemo() {
  const progressRef = useRef(0)
  const [compare, setCompare] = useState<WipeCompare>('wipe')
  const [shape, setShape] = useState<WipeShape>('horizontal')
  const { scopeRef, time, reset, stageProps } = usePlayback(WIPE_DURATION, (t) => {
    progressRef.current = wipeProgressAt(t)
  })
  const progress = wipeProgressAt(time)

  function restart() {
    progressRef.current = 0
    reset()
  }

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        controls={
          <div className="space-y-1.5">
            <ChoiceGroup
              legend="전환 방식"
              options={WIPE_COMPARE_OPTIONS}
              value={compare}
              onSelect={(next) => {
                restart()
                setCompare(next)
              }}
            />
            <ChoiceGroup
              legend="경계선 모양"
              options={WIPE_SHAPE_OPTIONS}
              value={shape}
              disabled={compare === 'dissolve'}
              onSelect={(next) => {
                restart()
                setShape(next)
              }}
            />
          </div>
        }
        viewport={
          <ViewportCanvas label="밤에서 눈 내리는 장면으로 넘어가는 Wipe 3D 화면" placeholderTone="night">
            <DualSceneComposer
              mode={compare}
              wipeShape={shape}
              progressRef={progressRef}
              sceneA={<SharedScene timeOfDay="night" />}
              sceneB={
                <>
                  <SharedScene timeOfDay="day" />
                  <SnowProp time={time} />
                </>
              }
            />
          </ViewportCanvas>
        }
        timeline={
          <TimelinePanel
            status={`${compare === 'wipe' ? 'Wipe' : 'Dissolve'} 진행 ${Math.round(progress * 100)}%`}
            time={time}
            duration={WIPE_DURATION}
            note={
              compare === 'wipe'
                ? '겹침 없음: 화면을 나눠 써서 한 지점에는 한 장면만 보입니다'
                : '겹침 있음: 화면 전체에서 두 장면이 섞입니다'
            }
          >
            <TrackTimeline
              label="밤 클립과 눈 클립의 전환 타임라인"
              tracks={[
                [{ start: 0, end: WIPE_WINDOW.end, label: '클립 A · 밤', tone: 'c' }],
                [{ start: WIPE_WINDOW.start, end: WIPE_DURATION, label: '클립 B · 눈', tone: 'a' }],
              ]}
              duration={WIPE_DURATION}
              playhead={time}
              band={{ ...WIPE_WINDOW, label: compare === 'wipe' ? '경계선 이동 구간' : '두 장면 겹침 구간' }}
            />
          </TimelinePanel>
        }
      />
    </div>
  )
}

// ── Match Cut ───────────────────────────────────────────────

const MATCH_FOV = 24
const MOON_RADIUS = 1.15 // SharedScene의 해·달 반지름
const MOON_POSITION = TIME_PALETTES.night.sunPos
const MOON_CAMERA_POSITION: Vec3 = [7, 2, 2]
const MOON_DISTANCE = Math.hypot(...MOON_POSITION.map((v, i) => v - MOON_CAMERA_POSITION[i]!))

const BUDDY_RADIUS = 0.5
const BUDDY_POSITION: Vec3 = [0, 0.5, 3.4]
const BUDDY_DISTANCE = matchedDistance(MOON_RADIUS, MOON_DISTANCE, BUDDY_RADIUS)
const BUDDY_VIEW_LENGTH = Math.hypot(0.2, 1)
const BUDDY_CAMERA_POSITION: Vec3 = [
  BUDDY_POSITION[0],
  BUDDY_POSITION[1] + (BUDDY_DISTANCE * 0.2) / BUDDY_VIEW_LENGTH,
  BUDDY_POSITION[2] + BUDDY_DISTANCE / BUDDY_VIEW_LENGTH,
]

/** 둥근 캐릭터 (Match Cut 카드의 소품) */
function RoundBuddyProp() {
  return (
    <group position={BUDDY_POSITION} rotation={[-Math.atan(0.2), 0, 0]}>
      <mesh>
        <sphereGeometry args={[BUDDY_RADIUS, 32, 32]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.6} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.08, BUDDY_RADIUS - 0.02]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      ))}
      <mesh position={[0, -0.12, BUDDY_RADIUS - 0.01]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.11, 0.022, 8, 20, Math.PI]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>
    </group>
  )
}

export function MatchCutDemo() {
  const progressRef = useRef(0)
  const [guide, setGuide] = useState(true)
  const { scopeRef, time, stageProps } = usePlayback(MATCH_DURATION, (t) => {
    progressRef.current = hardCutAt(t, MATCH_CUT_AT)
  })
  const cut = hardCutAt(time, MATCH_CUT_AT) === 1
  // 화면 비율 16:10 좌표계(160×100)에서의 반지름
  const guideRadius = sphereScreenRadius(MOON_RADIUS, MOON_DISTANCE, MATCH_FOV) * 100

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        controls={
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={guide}
              onChange={(event) => setGuide(event.target.checked)}
              className="accent-indigo-700"
            />
            정렬 가이드 원
          </label>
        }
        viewport={
          <div className="relative">
            <ViewportCanvas label="보름달에서 둥근 캐릭터로 이어지는 Match Cut 3D 화면" placeholderTone="night">
              <DualSceneComposer
                mode="dissolve"
                progressRef={progressRef}
                cameraA={{ position: MOON_CAMERA_POSITION, lookAt: MOON_POSITION, fov: MATCH_FOV }}
                cameraB={{ position: BUDDY_CAMERA_POSITION, lookAt: BUDDY_POSITION, fov: MATCH_FOV }}
                sceneA={<SharedScene timeOfDay="night" />}
                sceneB={
                  <>
                    <SharedScene timeOfDay="day" />
                    <RoundBuddyProp />
                  </>
                }
              />
            </ViewportCanvas>
            {guide && (
              <svg
                viewBox="0 0 160 100"
                aria-hidden="true"
                data-testid="match-guide"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <circle cx="80" cy="50" r={guideRadius} fill="none" stroke="#0f172a" strokeWidth="1.8" />
                <circle
                  cx="80"
                  cy="50"
                  r={guideRadius}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
                />
                <path d="M76 50H84M80 46V54" stroke="#ffffff" strokeWidth="0.6" />
              </svg>
            )}
          </div>
        }
        timeline={
          <TimelinePanel
            status={cut ? '클립 B · 둥근 캐릭터' : '클립 A · 보름달'}
            time={time}
            duration={MATCH_DURATION}
            note="Graphic Match: 같은 위치·크기의 원이 컷을 이어 줍니다"
          >
            <TrackTimeline
              label="보름달 클립에서 둥근 캐릭터 클립으로 컷하는 타임라인"
              tracks={[
                [
                  { start: 0, end: MATCH_CUT_AT, label: 'A · ○ 보름달', tone: 'c' },
                  { start: MATCH_CUT_AT, end: MATCH_DURATION, label: 'B · ○ 캐릭터', tone: 'b' },
                ],
              ]}
              duration={MATCH_DURATION}
              playhead={time}
              marker={{ at: MATCH_CUT_AT, label: 'Match Cut' }}
            />
          </TimelinePanel>
        }
      />
    </div>
  )
}

// ── Whip Pan ────────────────────────────────────────────────

const WHIP_SWING = 4

export function WhipPanDemo() {
  const progressRef = useRef(0)
  const blurRef = useRef(0)
  const { scopeRef, time, stageProps } = usePlayback(WHIP_DURATION, (t) => {
    const state = whipPanAt(t)
    progressRef.current = state.scene
    blurRef.current = state.blur
  })
  const { scene, pan, blur } = whipPanAt(time)
  const shift = pan * WHIP_SWING
  const status = blur > 0.01 ? '가로 블러 프레임' : scene === 0 ? '클립 A · 낮 정면' : '클립 B · 노을 측면'

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        viewport={
          <ViewportCanvas label="빠르게 옆으로 돌며 넘어가는 Whip Pan 3D 화면">
            <DualSceneComposer
              mode="dissolve"
              progressRef={progressRef}
              blurRef={blurRef}
              cameraA={{ position: [0, 1.65, 5.8], lookAt: [shift, 1, 0], fov: 42 }}
              cameraB={{ position: [3.4, 2.1, 5], lookAt: [shift, 1, 0], fov: 42 }}
              sceneA={<SharedScene timeOfDay="day" />}
              sceneB={<SharedScene timeOfDay="sunset" />}
            />
          </ViewportCanvas>
        }
        timeline={
          <TimelinePanel
            status={status}
            time={time}
            duration={WHIP_DURATION}
            note="번짐이 가장 큰 순간에 컷을 숨깁니다"
          >
            <TrackTimeline
              label="블러 구간 가운데에 컷 지점을 숨긴 Whip Pan 타임라인"
              tracks={[
                [
                  { start: 0, end: WHIP_WINDOW.cut, label: 'A · 낮', tone: 'a' },
                  { start: WHIP_WINDOW.cut, end: WHIP_DURATION, label: 'B · 노을', tone: 'b' },
                ],
              ]}
              duration={WHIP_DURATION}
              playhead={time}
              band={{ start: WHIP_WINDOW.start, end: WHIP_WINDOW.end, label: '' }}
              marker={{ at: WHIP_WINDOW.cut, label: '숨긴 컷 지점 (블러)' }}
            />
          </TimelinePanel>
        }
      />
    </div>
  )
}

// ── Smash Cut ───────────────────────────────────────────────

const SMASH_AUDIO: AudioClip[] = [
  { label: '정적', kind: 'quiet', start: 0, end: SMASH_CUT_AT },
  { label: '알람 (최대)', kind: 'alarm', start: SMASH_CUT_AT, end: SMASH_DURATION },
]

/** 울리는 알람시계 (Smash Cut 카드의 소품) */
function AlarmClockProp({ time }: { time: number }) {
  return (
    <group position={[0.95, 0.62, 2.2]} rotation={[0, 0, Math.sin(time * 55) * 0.16]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.22, 28]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <circleGeometry args={[0.35, 28]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0, 0.12, 0.13]}>
        <boxGeometry args={[0.05, 0.25, 0.01]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.09, 0, 0.13]}>
        <boxGeometry args={[0.2, 0.05, 0.01]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.46, 0]}>
          <sphereGeometry args={[0.17, 14, 10]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

export function SmashCutDemo() {
  const progressRef = useRef(0)
  const { scopeRef, time, stageProps } = usePlayback(SMASH_DURATION, (t) => {
    progressRef.current = hardCutAt(t, SMASH_CUT_AT)
  })
  const cut = hardCutAt(time, SMASH_CUT_AT) === 1

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        viewport={
          <ViewportCanvas label="조용한 밤에서 알람이 울리는 아침으로 끊어 넘기는 Smash Cut 3D 화면" placeholderTone="night">
            <DualSceneComposer
              mode="dissolve"
              progressRef={progressRef}
              sceneA={<SharedScene timeOfDay="night" />}
              sceneB={
                <>
                  <SharedScene timeOfDay="day" />
                  <AlarmClockProp time={time} />
                </>
              }
            />
          </ViewportCanvas>
        }
        timeline={
          <TimelinePanel
            status={cut ? '알람 아침 · 오디오 최대' : '조용한 밤 · 오디오 0 근처'}
            time={time}
            duration={SMASH_DURATION}
            note="완충 없이 화면과 소리가 같은 순간에 바뀝니다"
          >
            <TrackTimeline
              label="밤 클립에서 아침 클립으로 즉시 컷하는 타임라인"
              tracks={[
                [
                  { start: 0, end: SMASH_CUT_AT, label: 'A · 조용한 밤', tone: 'c' },
                  { start: SMASH_CUT_AT, end: SMASH_DURATION, label: 'B · 알람 아침', tone: 'b' },
                ],
              ]}
              duration={SMASH_DURATION}
              playhead={time}
              marker={{ at: SMASH_CUT_AT, label: '레벨 수직 상승' }}
            />
            <p className="mt-2 mb-1 text-[11px] text-slate-300">오디오 레벨 (무음 도식)</p>
            <AudioWaveform
              label="컷 지점에서 0 근처의 레벨이 최대치로 수직 상승하는 오디오 파형"
              clips={SMASH_AUDIO}
              duration={SMASH_DURATION}
              time={time}
            />
          </TimelinePanel>
        }
      />
    </div>
  )
}

// ── Iris (In / Out) ─────────────────────────────────────────

const IRIS_OPTIONS = [
  { value: 'out', label: 'Iris Out' },
  { value: 'in', label: 'Iris In' },
] as const

const IRIS_TARGET: Vec3 = [0, 1.15, 0]

export function IrisDemo() {
  const [direction, setDirection] = useState<IrisDirection>('out')
  const { scopeRef, time, reset, stageProps } = usePlayback(IRIS_DURATION)
  const radius = irisRadiusAt(time, direction)
  const openPercent = Math.round((radius / IRIS_MAX_RADIUS) * 100)

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        controls={
          <ChoiceGroup
            legend="방향"
            options={IRIS_OPTIONS}
            value={direction}
            onSelect={(next) => {
              reset()
              setDirection(next)
            }}
          />
        }
        viewport={
          <ViewportCanvas
            label="주인공을 중심으로 원형 마스크가 여닫히는 Iris 3D 화면"
            className="bg-black!"
            camera={{ position: [0, 1.5, 5.8], fov: 42 }}
            canvasStyle={{ clipPath: `circle(${radius.toFixed(2)}% at 50% 50%)` }}
          >
            <CameraAim target={IRIS_TARGET} />
            <SharedScene timeOfDay="sunset" />
          </ViewportCanvas>
        }
        timeline={
          <TimelinePanel
            status={`원형 구멍 ${openPercent}% 열림`}
            time={time}
            duration={IRIS_DURATION}
            note={direction === 'out' ? 'Iris Out: 구멍이 좁아지며 장면을 닫습니다' : 'Iris In: 구멍이 넓어지며 장면을 엽니다'}
          >
            <TrackTimeline
              label="Iris 전환 타임라인"
              tracks={[
                direction === 'out'
                  ? [
                      { start: 0, end: IRIS_DURATION - IRIS_HOLD, label: '장면 → 닫힘', tone: 'b' },
                      { start: IRIS_DURATION - IRIS_HOLD, end: IRIS_DURATION, label: '검정', tone: 'cut' },
                    ]
                  : [
                      { start: 0, end: IRIS_HOLD, label: '검정', tone: 'cut' },
                      { start: IRIS_HOLD, end: IRIS_DURATION, label: '열림 → 장면', tone: 'b' },
                    ],
              ]}
              duration={IRIS_DURATION}
              playhead={time}
              band={{ start: IRIS_HOLD, end: IRIS_DURATION - IRIS_HOLD, label: direction === 'out' ? '구멍 좁아짐' : '구멍 넓어짐' }}
            />
          </TimelinePanel>
        }
      />
    </div>
  )
}

// ── Fade to Black ───────────────────────────────────────────

const FADE_OPTIONS = [
  { value: 'fade', label: 'Fade to Black' },
  { value: 'dissolve', label: 'Dissolve' },
] as const

const FADE_SAMPLES = Array.from({ length: 81 }, (_, i) => (i / 80) * FADE_DURATION)

function BrightnessGraph({ mode, time }: { mode: FadeMode; time: number }) {
  const x = (t: number) => 28 + (t / FADE_DURATION) * 288
  const y = (brightness: number) => 48 - brightness * 38
  const points = FADE_SAMPLES.map((t) => `${x(t)},${y(fadeStateAt(t, mode).brightness)}`).join(' ')

  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴
    <svg viewBox="0 0 320 56" role="img" aria-label="화면 밝기 그래프" className="block w-full">
      <rect width="320" height="56" rx="4" fill="#0f172a" />
      <text x="4" y="13" fontSize="9" fill="#cbd5e1">100</text>
      <text x="16" y="51" fontSize="9" fill="#cbd5e1">0</text>
      <line x1="28" y1={y(0)} x2="316" y2={y(0)} stroke="#475569" />
      <polyline points={points} fill="none" stroke="#fde047" strokeWidth="2" />
      <circle cx={x(time)} cy={y(fadeStateAt(time, mode).brightness)} r="3.5" fill="#ffffff" />
    </svg>
  )
}

export function FadeToBlackDemo() {
  const progressRef = useRef(0)
  const [mode, setMode] = useState<FadeMode>('fade')
  const { scopeRef, time, reset, stageProps } = usePlayback(FADE_DURATION, (t) => {
    progressRef.current = fadeStateAt(t, mode).mix
  })
  const { brightness } = fadeStateAt(time, mode)
  const { outStart, black, inStart, end } = FADE_POINTS

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        controls={
          <ChoiceGroup
            legend="비교"
            options={FADE_OPTIONS}
            value={mode}
            onSelect={(next) => {
              progressRef.current = 0
              reset()
              setMode(next)
            }}
          />
        }
        viewport={
          <ViewportCanvas
            label="밤에서 완전한 검정을 거쳐 아침으로 넘어가는 Fade to Black 3D 화면"
            placeholderTone="night"
            className="bg-black!"
            canvasStyle={{ filter: `brightness(${brightness.toFixed(3)})` }}
          >
            <DualSceneComposer
              mode="dissolve"
              progressRef={progressRef}
              sceneA={<SharedScene timeOfDay="night" />}
              sceneB={<SharedScene timeOfDay="day" />}
            />
          </ViewportCanvas>
        }
        timeline={
          <TimelinePanel
            status={`밝기 ${Math.round(brightness * 100)}%`}
            time={time}
            duration={FADE_DURATION}
            note={
              mode === 'fade'
                ? '밝기 100 → 0 → 100: 완전한 검정을 거칩니다'
                : '밝기 100 유지: 검정 없이 두 장면이 겹칩니다'
            }
          >
            <TrackTimeline
              label="밤 클립에서 아침 클립으로 넘어가는 타임라인"
              tracks={
                mode === 'fade'
                  ? [
                      [
                        { start: 0, end: black, label: 'A · 밤 (Fade Out)', tone: 'c' },
                        { start: black, end: inStart, label: '검정', tone: 'cut' },
                        { start: inStart, end: FADE_DURATION, label: 'B · 아침 (Fade In)', tone: 'a' },
                      ],
                    ]
                  : [
                      [{ start: 0, end, label: 'A · 밤', tone: 'c' }],
                      [{ start: outStart, end: FADE_DURATION, label: 'B · 아침', tone: 'a' }],
                    ]
              }
              duration={FADE_DURATION}
              playhead={time}
              band={mode === 'dissolve' ? { start: outStart, end, label: '두 장면 겹침' } : undefined}
            />
            <p className="mt-2 mb-1 text-[11px] text-slate-300">밝기</p>
            <BrightnessGraph mode={mode} time={time} />
          </TimelinePanel>
        }
      />
    </div>
  )
}

// ── J-Cut / L-Cut ───────────────────────────────────────────

const SPLIT_EDIT_OPTIONS = [
  { value: 'straight', label: '직선 컷' },
  { value: 'j', label: 'J-Cut' },
  { value: 'l', label: 'L-Cut' },
] as const

const SPLIT_EDIT_NOTES: Record<SplitEditMode, string> = {
  straight: '직선 컷: 화면과 소리가 함께 바뀝니다',
  j: 'J-Cut: 소리 B가 화면보다 1초 먼저 들어옵니다',
  l: 'L-Cut: 소리 A가 다음 화면 위로 1초 더 이어집니다',
}

/** 플랫폼에 들어오는 기차 (J-Cut / L-Cut 카드의 소품) */
function TrainProp() {
  return (
    <group position={[1.9, 0, -2.2]}>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[3.2, 1.2, 0.9]} />
        <meshStandardMaterial color="#0f766e" roughness={0.6} />
      </mesh>
      {[-1.05, -0.35, 0.35, 1.05].map((x) => (
        <mesh key={x} position={[x, 1.05, 0.46]}>
          <planeGeometry args={[0.45, 0.4]} />
          <meshBasicMaterial color="#fef9c3" />
        </mesh>
      ))}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.24, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.25, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}
    </group>
  )
}

export function JCutLCutDemo() {
  const progressRef = useRef(0)
  const [mode, setMode] = useState<SplitEditMode>('straight')
  const { scopeRef, time, reset, stageProps } = usePlayback(SPLIT_EDIT_DURATION, (t) => {
    progressRef.current = hardCutAt(t, SPLIT_EDIT_VIDEO_CUT)
  })
  const audioCut = splitEditAudioCut(mode)
  const audio: AudioClip[] = [
    { label: '소리 A · 대화', kind: 'talk', start: 0, end: audioCut },
    { label: '소리 B · 기차', kind: 'train', start: audioCut, end: SPLIT_EDIT_DURATION },
  ]
  const video = hardCutAt(time, SPLIT_EDIT_VIDEO_CUT) === 0 ? 'A' : 'B'
  const sound = audioClipAt(audio, time) === audio[0] ? 'A' : 'B'

  return (
    <div ref={scopeRef}>
      <EditStage
        {...stageProps}
        controls={
          <ChoiceGroup
            legend="편집 방식"
            options={SPLIT_EDIT_OPTIONS}
            value={mode}
            onSelect={(next) => {
              progressRef.current = 0
              reset()
              setMode(next)
            }}
          />
        }
        viewport={
          <ViewportCanvas label="대화 장면에서 기차 장면으로 컷하는 J-Cut / L-Cut 3D 화면">
            <DualSceneComposer
              mode="dissolve"
              progressRef={progressRef}
              cameraA={{ position: [-0.8, 1.5, 3.9], lookAt: [-0.7, 1.15, 0], fov: 42 }}
              sceneA={<SharedScene timeOfDay="day" />}
              sceneB={
                <>
                  <SharedScene timeOfDay="sunset" />
                  <TrainProp />
                </>
              }
            />
          </ViewportCanvas>
        }
        timeline={
          <TimelinePanel
            status={`지금 화면 ${video} · 소리 ${sound}`}
            time={time}
            duration={SPLIT_EDIT_DURATION}
            note={SPLIT_EDIT_NOTES[mode]}
          >
            <p className="mb-1 text-[11px] text-slate-300">비디오 트랙</p>
            <TrackTimeline
              label="장면 A에서 B로 컷하는 비디오 트랙"
              tracks={[
                [
                  { start: 0, end: SPLIT_EDIT_VIDEO_CUT, label: '장면 A · 대화', tone: 'a' },
                  { start: SPLIT_EDIT_VIDEO_CUT, end: SPLIT_EDIT_DURATION, label: '장면 B · 기차', tone: 'b' },
                ],
              ]}
              duration={SPLIT_EDIT_DURATION}
              playhead={time}
              marker={{ at: SPLIT_EDIT_VIDEO_CUT, label: '화면 컷' }}
            />
            <p className="mt-2 mb-1 text-[11px] text-slate-300">
              오디오 트랙 (무음 도식) · 소리 컷 {audioCut.toFixed(1)}s
            </p>
            <AudioWaveform
              label={`${audioCut.toFixed(1)}초에 소리 A에서 B로 넘어가는 오디오 파형`}
              clips={audio}
              duration={SPLIT_EDIT_DURATION}
              time={time}
            />
          </TimelinePanel>
        }
      />
    </div>
  )
}
