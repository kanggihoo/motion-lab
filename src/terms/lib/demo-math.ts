export type DollyDirection = 'out-in' | 'in-out'

export const DOLLY_D_NEAR = 3.2
export const DOLLY_D_FAR = 12.2
export const DOLLY_FOV_NEAR = 66
const HALF_HEIGHT = DOLLY_D_NEAR * Math.tan((DOLLY_FOV_NEAR * Math.PI) / 360)

export function computeDollyOptics(progress: number, direction: DollyDirection) {
  const dist = direction === 'out-in'
    ? DOLLY_D_NEAR + (DOLLY_D_FAR - DOLLY_D_NEAR) * progress
    : DOLLY_D_FAR + (DOLLY_D_NEAR - DOLLY_D_FAR) * progress
  const fov = (2 * Math.atan(HALF_HEIGHT / dist) * 180) / Math.PI
  return { dist, fov }
}

export type OverlapDuration = 0.3 | 1 | 2
export const DISSOLVE_TOTAL_DURATION = 4

export function dissolveMixAt(time: number, overlap: OverlapDuration) {
  const start = DISSOLVE_TOTAL_DURATION / 2 - overlap / 2
  const end = DISSOLVE_TOTAL_DURATION / 2 + overlap / 2
  if (time <= start) return 0
  if (time >= end) return 1
  return (time - start) / overlap
}
