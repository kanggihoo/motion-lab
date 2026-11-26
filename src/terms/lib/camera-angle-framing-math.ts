/** Camera · Angle & Framing 카드의 카메라 배치 계산. 좌표는 공유 장면(scene-layout) 기준. */
import { HERO, OTHER, SWING, type Vec3 } from '@terms/components/scene/scene-layout'

export interface Shot {
  position: Vec3
  target: Vec3
  /** three PerspectiveCamera의 세로 화각(도) */
  fov: number
}

// ── High / Low Angle ─────────────────────────────────────────────

const LEVEL_DISTANCE = 4.5

export const ANGLE_LEVELS: (Shot & { id: 'low' | 'eye' | 'high'; label: string; background: string; impression: string })[] = [
  {
    id: 'low',
    label: 'Low Angle',
    background: '하늘',
    impression: '크고 위압적',
    position: [0, 0.2, LEVEL_DISTANCE],
    target: [0, 1.3, 0],
    fov: 42,
  },
  {
    id: 'eye',
    label: 'Eye Level',
    background: '지평선',
    impression: '대등함',
    position: [0, HERO.headY, LEVEL_DISTANCE],
    target: [0, HERO.headY, 0],
    fov: 42,
  },
  {
    id: 'high',
    label: 'High Angle',
    background: '바닥',
    impression: '작고 고립됨',
    position: [0, 4.8, LEVEL_DISTANCE],
    target: [0, 0.8, 0],
    fov: 42,
  },
]

/** 수평선에서 올려다보면 +, 내려다보면 -(도) */
export function pitchDegrees({ position, target }: Pick<Shot, 'position' | 'target'>) {
  const horizontal = Math.hypot(target[0] - position[0], target[2] - position[2])
  return (Math.atan2(target[1] - position[1], horizontal) * 180) / Math.PI
}

// ── Bird's-eye View ──────────────────────────────────────────────

export type BirdView = 'high' | 'bird'

export const BIRD_SHOTS: Record<BirdView, Shot> = {
  high: { position: [0, 7, 7.5], target: [0, 0, -1.3], fov: 42 },
  // z를 아주 조금 어긋내 lookAt의 up 방향이 정해지게 한다(화면 위 = -z)
  bird: { position: [0, 12, -1.299], target: [0, 0, -1.3], fov: 42 },
}

// ── Dutch Angle ──────────────────────────────────────────────────

export const DUTCH_MAX_ROLL = 25

const DUTCH_DISTANCE = 4
const DUTCH_HEIGHT = 1.1

/** 그네 정면에서 수평으로 본다. 그래서 roll 0°면 지평선이 화면 중앙 가로선과 겹친다. */
export const DUTCH_SHOT: Shot = {
  position: [
    SWING.position[0] + Math.sin(SWING.yaw) * DUTCH_DISTANCE,
    DUTCH_HEIGHT,
    SWING.position[2] + Math.cos(SWING.yaw) * DUTCH_DISTANCE,
  ],
  target: [SWING.position[0], DUTCH_HEIGHT, SWING.position[2]],
  fov: 42,
}

// ── Shot Size ────────────────────────────────────────────────────

export type ShotSize = 'full' | 'medium' | 'close' | 'extreme'

/** height는 얼굴 면에서 화면 세로에 담기는 길이(m), centerY는 화면 중앙의 높이 */
export const SHOT_SIZES: { id: ShotSize; label: string; range: string; height: number; centerY: number }[] = [
  { id: 'full', label: 'Full Shot', range: '전신', height: 2.3, centerY: 1 },
  { id: 'medium', label: 'Medium Shot', range: '허리 위', height: 1.25, centerY: 1.42 },
  { id: 'close', label: 'Close-up', range: '얼굴', height: 0.75, centerY: 1.6 },
  { id: 'extreme', label: 'Extreme Close-up', range: '두 눈', height: 0.18, centerY: 1.56 },
]

const SHOT_DISTANCE = 4
/** 눈이 붙어 있는 z. 이 면을 기준으로 프레임 크기를 맞춘다. */
export const FACE_PLANE_Z = 0.21

function shotSizeSpec(size: ShotSize) {
  return SHOT_SIZES.find((spec) => spec.id === size)!
}

/** 위치(거리)는 두고 높이와 화각만 바꾼다. */
export function shotSizeCamera(size: ShotSize): Shot {
  const { height, centerY } = shotSizeSpec(size)
  return {
    position: [0, centerY, SHOT_DISTANCE],
    target: [0, centerY, 0],
    fov: (2 * Math.atan(height / 2 / (SHOT_DISTANCE - FACE_PLANE_Z)) * 180) / Math.PI,
  }
}

/** 현재 화면 안에서 더 좁은 샷들이 차지하는 사각형(%). 두 화면의 비율이 같아 폭 %와 높이 %가 같다. */
export function innerFrames(current: ShotSize) {
  const outer = shotSizeSpec(current)
  return SHOT_SIZES.slice(SHOT_SIZES.indexOf(outer) + 1).map((inner) => {
    const size = (inner.height / outer.height) * 100
    const top = ((outer.centerY + outer.height / 2 - (inner.centerY + inner.height / 2)) / outer.height) * 100
    return { id: inner.id, label: inner.label, top, left: (100 - size) / 2, size }
  })
}

// ── POV Shot ─────────────────────────────────────────────────────

/** 그네에 앉아 나무 쪽(-z)을 보는 방향 */
export const POV_HERO_YAW = SWING.yaw + Math.PI

/** 앉은 사람 기준 좌표(오른쪽·왼쪽 x, 높이, 앞 z)를 월드 좌표로 옮긴다. */
export function swingPoint([x, y, z]: Vec3): Vec3 {
  const cos = Math.cos(POV_HERO_YAW)
  const sin = Math.sin(POV_HERO_YAW)
  return [SWING.position[0] + x * cos + z * sin, y, SWING.position[2] - x * sin + z * cos]
}

/** 서 있는 모델의 엉덩이를 그네 판 높이로 내린다. */
export const POV_HERO_POSITION: Vec3 = swingPoint([0, -0.15, 0])

export const POV_SHOTS: { third: Shot; pov: Shot } = {
  third: { position: swingPoint([0, 2.2, -3.4]), target: swingPoint([0, 1, 0.6]), fov: 42 },
  // 눈을 줄보다 살짝 뒤에 둬야 줄과 손이 화면에 들어온다
  pov: { position: swingPoint([0, 1.45, -0.42]), target: swingPoint([0, 0.85, 2]), fov: 70 },
}

// ── Over-the-Shoulder ────────────────────────────────────────────

export type OtsView = 'a' | 'b'

const OTS_BACK = 1.6
const OTS_SIDE = 1.05
const OTS_HEIGHT = 1.75

/** A(주황)가 B를 마주 보는 y축 회전 */
export const OTS_HERO_YAW = Math.atan2(OTHER.position[0] - HERO.position[0], OTHER.position[2] - HERO.position[2])

/** view 쪽 인물의 어깨 뒤에서 상대를 본다. 두 카메라는 A–B 선의 같은 쪽(+z)에 있다(180° 규칙). */
export function otsCamera(view: OtsView): Shot {
  const [near, far] = view === 'a' ? [HERO, OTHER] : [OTHER, HERO]
  const dx = far.position[0] - near.position[0]
  const dz = far.position[2] - near.position[2]
  const length = Math.hypot(dx, dz)
  const [ux, uz] = [dx / length, dz / length]
  // A–B 선에 수직이고 +z를 향하는 방향
  const [nx, nz] = ux > 0 ? [-uz, ux] : [uz, -ux]
  return {
    position: [
      near.position[0] - ux * OTS_BACK + nx * OTS_SIDE,
      OTS_HEIGHT,
      near.position[2] - uz * OTS_BACK + nz * OTS_SIDE,
    ],
    target: [far.position[0], far.headY, far.position[2]],
    fov: 28,
  }
}

// ── Establishing Shot ────────────────────────────────────────────

/** 카드 소품인 카페 건물의 바닥 중심과 크기. awning은 앞면에서 튀어나온 차양 길이 */
export const CAFE = { position: [1.3, 0, -3.2] as Vec3, width: 3.6, height: 2.6, depth: 1.4, awning: 0.5 }

export const ESTABLISHING_SHOTS: { wide: Shot; medium: Shot } = {
  // medium은 카페가 화면에 들어오지 않는 옆 방향이다
  wide: { position: [-0.4, 3.2, 9.5], target: [0.3, 1.2, -2], fov: 42 },
  medium: { position: [2, 1.5, 0.5], target: [0, 1.45, 0], fov: 36 },
}
