import type { Vec3 } from '@terms/components/scene/scene-layout'

/** top = 평면도(x-z, +z가 아래), side = 측면도(+x 쪽에서 본 z-y, +z가 오른쪽·+y가 위) */
export type DiagramView = 'top' | 'side'

/** 도면 평면 좌표(m). h는 화면 오른쪽, v는 화면 아래로 커진다. */
export type PlanePoint = [h: number, v: number]

export interface DiagramBounds {
  x: [number, number]
  y: [number, number]
  z: [number, number]
}

export const DEFAULT_BOUNDS: Record<DiagramView, DiagramBounds> = {
  top: { x: [-9, 9], y: [-1, 7], z: [-17, 14] },
  side: { x: [-9, 9], y: [-1, 7], z: [-9, 8] },
}

export const DIAGRAM_SIZE: Record<DiagramView, { width: number; height: number }> = {
  top: { width: 200, height: 190 },
  side: { width: 200, height: 120 },
}

export function toPlane(view: DiagramView, [x, y, z]: Vec3): PlanePoint {
  return view === 'top' ? [x, z] : [z, -y]
}

/**
 * 월드 좌표를 SVG 좌표로 옮기는 투영. 각도가 틀어지지 않게 두 축의 배율을 같게 두고,
 * bounds 전체가 들어가도록 가운데에 맞춘다.
 */
export function createProjection(view: DiagramView, bounds: DiagramBounds, size: { width: number; height: number }) {
  const [h0, h1] = view === 'top' ? bounds.x : bounds.z
  const [v0, v1] = view === 'top' ? bounds.z : [-bounds.y[1], -bounds.y[0]]
  const scale = Math.min(size.width / (h1 - h0), size.height / (v1 - v0))
  const offsetH = size.width / 2 - ((h0 + h1) / 2) * scale
  const offsetV = size.height / 2 - ((v0 + v1) / 2) * scale
  const plane = ([h, v]: PlanePoint): PlanePoint => [offsetH + h * scale, offsetV + v * scale]
  return {
    view,
    scale,
    plane,
    point: (world: Vec3) => plane(toPlane(view, world)),
  }
}

export type Projection = ReturnType<typeof createProjection>

/** three의 세로 화각(도)과 화면 비율에서 가로 화각(도)을 구한다. */
export function horizontalFov(verticalFov: number, aspect: number) {
  return (2 * Math.atan(Math.tan((verticalFov * Math.PI) / 360) * aspect) * 180) / Math.PI
}

/** 도면에서 카메라가 향하는 각도(rad, h축 기준·v축 방향이 +). 시선이 도면에 수직이면 null. */
export function headingOf(view: DiagramView, position: Vec3, target: Vec3): number | null {
  const from = toPlane(view, position)
  const to = toPlane(view, target)
  const dh = to[0] - from[0]
  const dv = to[1] - from[1]
  return Math.hypot(dh, dv) < 1e-6 ? null : Math.atan2(dv, dh)
}

/**
 * 화각 부채꼴의 도면 좌표 [꼭짓점, 호의 점들...]. 평면도는 가로 화각, 측면도는 세로 화각을 쓴다.
 * range는 도면 위 반지름(m). 시선이 도면에 수직이면(예: 평면도의 수직 하향) 빈 배열.
 */
export function fovFan({
  view,
  position,
  target,
  fov,
  aspect,
  range,
  segments = 12,
}: {
  view: DiagramView
  position: Vec3
  target: Vec3
  fov: number
  aspect: number
  range: number
  segments?: number
}): PlanePoint[] {
  const heading = headingOf(view, position, target)
  if (heading === null) return []
  const spread = ((view === 'top' ? horizontalFov(fov, aspect) : fov) * Math.PI) / 180
  const apex = toPlane(view, position)
  const arc = Array.from({ length: segments + 1 }, (_, i): PlanePoint => {
    const angle = heading - spread / 2 + (spread * i) / segments
    return [apex[0] + Math.cos(angle) * range, apex[1] + Math.sin(angle) * range]
  })
  return [apex, ...arc]
}

/** y축으로 yaw(rad)만큼 돌린 바닥 직사각형의 네 모서리 (three의 rotation.y와 같은 방향) */
export function footprintCorners(center: Vec3, width: number, depth: number, yaw = 0): Vec3[] {
  const cos = Math.cos(yaw)
  const sin = Math.sin(yaw)
  return (
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const
  ).map(([sx, sz]): Vec3 => {
    const x = (sx * width) / 2
    const z = (sz * depth) / 2
    return [center[0] + x * cos + z * sin, center[1], center[2] - x * sin + z * cos]
  })
}

export function svgPoints(points: PlanePoint[]) {
  return points.map(([h, v]) => `${h},${v}`).join(' ')
}
