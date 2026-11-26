import type { ReactNode } from 'react'
import {
  CAMERA_ASPECT,
  FENCE,
  HERO,
  HILLS,
  OTHER,
  SWING,
  TREES,
  TREE_SIZE,
  type Vec3,
} from '@terms/components/scene/scene-layout'
import {
  DEFAULT_BOUNDS,
  DIAGRAM_SIZE,
  createProjection,
  footprintCorners,
  fovFan,
  headingOf,
  svgPoints,
  type DiagramBounds,
  type DiagramView,
  type Projection,
} from '@terms/lib/diagram-math'

export type SceneObject = 'hills' | 'trees' | 'fence' | 'swing' | 'other' | 'hero'

export interface DiagramCamera {
  position: Vec3
  /** 바라보는 점 (three의 lookAt) */
  target: Vec3
  /** three PerspectiveCamera의 세로 화각(도). 없으면 부채꼴을 그리지 않는다. */
  fov?: number
  /** 카메라 화면 가로/세로 비율. 평면도의 가로 화각 계산에 쓴다. */
  aspect?: number
  /** 부채꼴 반지름(m) */
  range?: number
  label?: string
  color?: string
  /** 비교·비활성 카메라는 흐리게 */
  dimmed?: boolean
}

/** 장면에 없는 피사체나 지점(소품, 초점 대상 등) */
export interface DiagramMarker {
  position: Vec3
  label?: string
  color?: string
  /** 반지름(m) */
  radius?: number
}

export interface DiagramPath {
  points: Vec3[]
  color?: string
  dashed?: boolean
}

interface SceneDiagramProps {
  view?: DiagramView
  /** SVG의 접근 가능한 이름 */
  label: string
  cameras?: DiagramCamera[]
  /** 주인공 위치 덮어쓰기. null이면 그리지 않는다. */
  heroPosition?: Vec3 | null
  /** 다른 인물 위치 덮어쓰기. null이면 그리지 않는다. */
  otherPosition?: Vec3 | null
  /** 그리지 않을 장면 물체 */
  hide?: SceneObject[]
  markers?: DiagramMarker[]
  paths?: DiagramPath[]
  bounds?: Partial<DiagramBounds>
  /** 장면 위, 카메라 아래에 덧그리는 SVG (초점면, 크레인 암 등) */
  children?: (projection: Projection) => ReactNode
  /** 도면 아래 수치 표시 줄 */
  footer?: ReactNode
}

const COLORS = {
  ground: '#1f2937',
  hillNear: '#33504a',
  hillFar: '#243b3a',
  tree: '#3f6b4f',
  fence: '#a1887f',
  swing: '#8d6e63',
  other: '#2563eb',
  hero: '#f97316',
  camera: '#818cf8',
}

/** 공유 3D 장면과 같은 좌표로 그리는 평면도/측면도 (D-4) */
export function SceneDiagram({
  view = 'top',
  label,
  cameras = [],
  heroPosition = HERO.position,
  otherPosition = OTHER.position,
  hide = [],
  markers = [],
  paths = [],
  bounds,
  children,
  footer,
}: SceneDiagramProps) {
  const size = DIAGRAM_SIZE[view]
  const projection = createProjection(view, { ...DEFAULT_BOUNDS[view], ...bounds }, size)
  const { scale, point, plane } = projection
  const shows = (object: SceneObject) => !hide.includes(object)

  const polygon = (corners: Vec3[], fill: string, object: SceneObject) => (
    <polygon data-object={object} points={svgPoints(corners.map(point))} fill={fill} />
  )

  /** 측면도의 상자: z 폭 × 높이 */
  const upright = (position: Vec3, depth: number, height: number, fill: string, object: SceneObject, opacity = 1) => {
    const [h, v] = point([position[0], position[1] + height, position[2]])
    const width = Math.max(1.5, depth * scale)
    return (
      <rect
        data-object={object}
        x={h - width / 2}
        y={v}
        width={width}
        height={height * scale}
        rx="1"
        fill={fill}
        opacity={opacity}
      />
    )
  }

  const person = (position: Vec3, radius: number, height: number, fill: string, object: 'hero' | 'other') => {
    if (view === 'top') {
      const [h, v] = point(position)
      return (
        <circle
          data-object={object}
          cx={h}
          cy={v}
          r={Math.max(4.5, radius * scale)}
          fill={fill}
          stroke={object === 'hero' ? '#ffffff' : 'none'}
          strokeWidth="1.2"
        />
      )
    }
    const headRadius = 0.24
    const [h, v] = point([position[0], position[1] + height - headRadius, position[2]])
    return (
      <g data-object={object}>
        {upright(position, radius * 2, height - headRadius * 2, fill, object)}
        <circle cx={h} cy={v} r={headRadius * scale} fill={fill} />
      </g>
    )
  }

  const heroLabel = heroPosition && shows('hero') ? point(
    view === 'top' ? heroPosition : [heroPosition[0], heroPosition[1] + HERO.height + 0.2, heroPosition[2]],
  ) : null

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 p-2 text-white">
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴 */}
      <svg role="img"
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-label={label}
        data-view={view}
        className={`w-full ${view === 'top' ? 'aspect-[20/19]' : 'aspect-[5/3]'}`}
      >
        {shows('hills') &&
          HILLS.map((hill, index) => {
            const [h, v] = point(hill.position)
            return (
              <ellipse
                key={index}
                data-object="hills"
                cx={h}
                cy={v}
                rx={hill.radii[view === 'top' ? 0 : 2] * scale}
                ry={hill.radii[view === 'top' ? 2 : 1] * scale}
                fill={hill.tone === 'far' ? COLORS.hillFar : COLORS.hillNear}
              />
            )
          })}

        {/* 측면도: 지면 아래의 언덕을 가린다 */}
        {view === 'side' && (
          <>
            <rect x="0" y={plane([0, 0])[1]} width={size.width} height={size.height} fill={COLORS.ground} />
            <line x1="0" y1={plane([0, 0])[1]} x2={size.width} y2={plane([0, 0])[1]} stroke="#64748b" />
          </>
        )}

        {shows('trees') &&
          TREES.map((tree, index) => {
            const radius = TREE_SIZE.radius * tree.scale
            if (view === 'top') {
              const [h, v] = point(tree.position)
              return <circle key={index} data-object="trees" cx={h} cy={v} r={radius * scale} fill={COLORS.tree} />
            }
            const [x, y, z] = tree.position
            return (
              <polygon
                key={index}
                data-object="trees"
                points={svgPoints([
                  point([x, y, z - radius]),
                  point([x, y + TREE_SIZE.height * tree.scale, z]),
                  point([x, y, z + radius]),
                ])}
                fill={COLORS.tree}
              />
            )
          })}

        {otherPosition && shows('other') && person(otherPosition, OTHER.radius, OTHER.height, COLORS.other, 'other')}

        {shows('swing') &&
          (view === 'top'
            ? polygon(footprintCorners(SWING.position, SWING.width, SWING.depth, SWING.yaw), COLORS.swing, 'swing')
            : upright(SWING.position, SWING.depth, SWING.height, COLORS.swing, 'swing', 0.75))}

        {shows('fence') &&
          (view === 'top'
            ? // 실제 두께(0.1m)는 도면에서 보이지 않아 키워 그린다
              polygon(footprintCorners(FENCE.position, FENCE.width, 0.35), COLORS.fence, 'fence')
            : upright(FENCE.position, FENCE.depth, FENCE.height, COLORS.fence, 'fence'))}

        {heroPosition && shows('hero') && person(heroPosition, HERO.radius, HERO.height, COLORS.hero, 'hero')}
        {heroLabel && (
          <text x={heroLabel[0] + (view === 'top' ? 9 : 0)} y={heroLabel[1] + (view === 'top' ? 3 : 0)} textAnchor={view === 'top' ? 'start' : 'middle'} fontSize="9" fill="#fed7aa">
            주인공
          </text>
        )}

        {markers.map((marker, index) => {
          const [h, v] = point(marker.position)
          const radius = Math.max(3, (marker.radius ?? 0.3) * scale)
          return (
            <g key={index} data-object="marker">
              <circle cx={h} cy={v} r={radius} fill={marker.color ?? '#facc15'} />
              {marker.label && (
                <text x={h + radius + 2} y={v + 3} fontSize="9" fill="#e2e8f0">
                  {marker.label}
                </text>
              )}
            </g>
          )
        })}

        {paths.map((path, index) => (
          <polyline
            key={index}
            data-object="path"
            points={svgPoints(path.points.map(point))}
            fill="none"
            stroke={path.color ?? '#94a3b8'}
            strokeWidth="1.5"
            strokeDasharray={path.dashed === false ? undefined : '3 3'}
          />
        ))}

        {children?.(projection)}

        {cameras.map((camera, index) => {
          const color = camera.color ?? COLORS.camera
          const [h, v] = point(camera.position)
          const heading = headingOf(view, camera.position, camera.target)
          const fan =
            camera.fov === undefined
              ? []
              : fovFan({
                  view,
                  position: camera.position,
                  target: camera.target,
                  fov: camera.fov,
                  aspect: camera.aspect ?? CAMERA_ASPECT,
                  range: camera.range ?? 20,
                }).map(plane)
          return (
            <g key={index} data-object="camera" opacity={camera.dimmed ? 0.35 : 1}>
              {fan.length > 0 && (
                <polygon
                  data-testid="fov-fan"
                  points={svgPoints(fan)}
                  fill={color}
                  fillOpacity="0.24"
                  stroke={color}
                  strokeWidth="1.2"
                />
              )}
              {/* 몸통 + 렌즈. 렌즈가 +h를 향하게 그리고 시선 각도로 돌린다. */}
              <g transform={`translate(${h} ${v}) rotate(${((heading ?? 0) * 180) / Math.PI})`}>
                <rect x="-6" y="-7" width="12" height="14" rx="2.5" fill="#e2e8f0" />
                {heading !== null && <polygon points="6,-3 11,-5 11,5 6,3" fill="#94a3b8" />}
              </g>
              {camera.label && (
                <text x={h + 12} y={v - 8} fontSize="9" fill="#e2e8f0">
                  {camera.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {footer && (
        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] tabular-nums text-slate-300">{footer}</div>
      )}
    </div>
  )
}
