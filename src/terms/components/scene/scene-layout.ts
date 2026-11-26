/**
 * 공유 3D 장면의 월드 좌표(단위 m, y 위, +z가 기본 카메라 쪽).
 * SharedScene(3D)과 SceneDiagram(평면도·측면도)이 같은 값을 쓴다(D-4).
 * DOM·three에 의존하지 않는 상수만 둔다.
 */
export type Vec3 = [number, number, number]

/** 공유 장면의 기본 카메라(DualSceneComposer 기본값). fov는 three와 같은 세로 화각(도). */
export const DEFAULT_CAMERA: { position: Vec3; lookAt: Vec3; fov: number } = {
  position: [0.1, 1.65, 5.8],
  lookAt: [0, 1.0, 0],
  fov: 42,
}

/** ViewportCanvas의 카메라 화면 비율(aspect-[16/10]) */
export const CAMERA_ASPECT = 16 / 10

export const GROUND: { position: Vec3; size: [number, number] } = {
  position: [0, 0, -4],
  size: [52, 46],
}

/** 주황 주인공. height는 발바닥부터 모자 위까지, radius는 몸통 아래 반지름. */
export const HERO = {
  position: [0, 0, 0] as Vec3,
  headY: 1.54,
  height: 1.95,
  radius: 0.32,
}

/** 파란 옷의 다른 인물 */
export const OTHER = {
  position: [-1.55, 0, -0.45] as Vec3,
  yaw: 0.35,
  headY: 1.48,
  height: 1.83,
  radius: 0.29,
}

export const FENCE = {
  position: [-1.85, 0, 2.3] as Vec3,
  /** 그룹 기준 기둥 x */
  postXs: [-0.6, 0, 0.6],
  width: 1.45,
  height: 0.76,
  depth: 0.1,
}

export const SWING = {
  position: [2.05, 0, 1.85] as Vec3,
  yaw: -0.35,
  /** 윗 가로대 길이 */
  width: 1.5,
  height: 1.9,
  /** 벌어진 다리의 바닥 앞뒤 폭 */
  depth: 0.94,
  seatY: 0.55,
}

/** scale 1인 나무의 크기. 실제 크기는 TREES의 scale을 곱한다. */
export const TREE_SIZE = { height: 3.15, radius: 0.95 }

export const TREES: { position: Vec3; scale: number }[] = [
  { position: [-4.2, 0, -5.2], scale: 1.15 },
  { position: [-1.9, 0, -7.2], scale: 1.35 },
  { position: [2.6, 0, -6.2], scale: 1.25 },
  { position: [5.2, 0, -8.5], scale: 1.4 },
]

/** 타원체 언덕. position은 중심(지면 아래), radii는 x·y·z 반지름. */
export const HILLS: { position: Vec3; radii: Vec3; tone: 'near' | 'far' }[] = [
  { position: [-5.2, -1.3, -12.5], radii: [7.2, 2.8, 3.2], tone: 'near' },
  { position: [5.6, -1.4, -13.5], radii: [7.8, 3.0, 3.4], tone: 'near' },
  { position: [0.3, -1.8, -16], radii: [12.5, 3.8, 4.0], tone: 'far' },
]

/** 구름 묶음 중심. cloudOffset은 x에 더한다. */
export const CLOUDS: [Vec3, Vec3] = [
  [-4.5, 6.4, -15],
  [3.2, 7.1, -16],
]

export const GRASS_TUFTS: Vec3[] = [
  [-2.4, 0, 1.65],
  [-1.0, 0, 2.55],
  [1.15, 0, 2.4],
  [2.65, 0, 2.3],
]

/** 밤에만 보이는 원경 가로등의 밑동. 전구 높이는 NIGHT_LIGHT_Y. */
export const NIGHT_LIGHTS: Vec3[] = [
  [-3.1, 0, -5.8],
  [0.8, 0, -7.8],
  [3.9, 0, -6.5],
]

export const NIGHT_LIGHT_Y = 2.35
