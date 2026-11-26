import type { ReactNode } from 'react'
import * as THREE from 'three'
import { TIME_PALETTES, pickColor, type TimeOfDay, type TimePalette } from './scene-colors'

/** 주인공의 자세. 'run'은 상체를 숙이고, 'jump'는 다리를 고정된 각도로 접어 벌린다. */
export type HeroPose = 'stand' | 'run' | 'jump'

export interface SharedSceneProps {
  timeOfDay: TimeOfDay
  selectiveHero?: boolean
  volumetricDensity?: number
  /** 시간대 사이를 보간할 때 timeOfDay의 팔레트를 대신한다. 밤 불빛은 timeOfDay가 정한다. */
  palette?: TimePalette
  cloudOffset?: number
  heroPose?: HeroPose
  heroPosition?: [number, number, number]
  /** y축 회전(rad). 0이면 카메라(+z)를 본다. */
  heroYaw?: number
  /** 두 다리를 앞뒤로 벌린 각도(rad). heroPose가 'jump'면 쓰지 않는다. */
  heroStride?: number
  hideHero?: boolean
  hideOther?: boolean
  /** 카드별 소품 슬롯(D-5: 최대 1개) */
  prop?: ReactNode
}

const NIGHT_LIGHTS: [number, number, number][] = [
  [-3.1, 0, -5.8],
  [0.8, 0, -7.8],
  [3.9, 0, -6.5],
]

const VOLUMETRIC_BEAMS: { pos: [number, number, number]; rotZ: number; width: number }[] = [
  { pos: [-2.6, 3.6, -4.6], rotZ: -0.45, width: 1.05 },
  { pos: [-0.3, 4.0, -5.4], rotZ: -0.42, width: 1.25 },
  { pos: [2.0, 3.8, -5.0], rotZ: -0.44, width: 1.1 },
  { pos: [4.2, 3.5, -6.0], rotZ: -0.46, width: 1.3 },
]

function Tree({
  position,
  scale = 1,
  trunk,
  dark,
  light,
}: {
  position: [number, number, number]
  scale?: number
  trunk: string
  dark: string
  light: string
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 1.5, 8]} />
        <meshStandardMaterial color={trunk} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.85, 0]}>
        <coneGeometry args={[0.95, 1.5, 10]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <coneGeometry args={[0.7, 1.2, 10]} />
        <meshStandardMaterial color={light} roughness={0.85} />
      </mesh>
    </group>
  )
}

function GrassTuft({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[-0.08, 0.16, 0]} rotation={[0, 0, 0.22]}>
        <coneGeometry args={[0.06, 0.34, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0.02]}>
        <coneGeometry args={[0.07, 0.42, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.15, -0.02]} rotation={[0, 0, -0.22]}>
        <coneGeometry args={[0.06, 0.32, 5]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  )
}

export function SharedScene({
  timeOfDay,
  selectiveHero = false,
  volumetricDensity = 0,
  palette,
  cloudOffset = 0,
  heroPose = 'stand',
  heroPosition = [0, 0, 0],
  heroYaw = 0,
  heroStride = 0,
  hideHero = false,
  hideOther = false,
  prop,
}: SharedSceneProps) {
  const p = palette ?? TIME_PALETTES[timeOfDay]
  const c = (hex: string) => pickColor(hex, selectiveHero)
  // 왼쪽(side -1)·오른쪽(side 1) 다리의 엉덩이 관절 회전
  const legRotation = (side: -1 | 1): [number, number, number] =>
    heroPose === 'jump' ? [-0.35, 0, side * 0.45] : [side * heroStride, 0, 0]

  return (
    <>
      <color attach="background" args={[c(p.sky)]} />
      <ambientLight intensity={p.ambientIntensity} color={selectiveHero ? '#ffffff' : undefined} />
      <hemisphereLight
        args={[selectiveHero ? '#e5e7eb' : p.hemiSky, selectiveHero ? '#52525b' : p.hemiGround, p.hemiIntensity]}
      />
      <directionalLight
        position={p.sunPos}
        intensity={p.dirIntensity}
        color={selectiveHero ? '#ffffff' : p.dirColor}
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}>
        <planeGeometry args={[52, 46]} />
        <meshStandardMaterial color={c(p.ground)} roughness={0.95} />
      </mesh>

      {/* Background: Sky sun/moon, clouds, hills, trees */}
      <mesh position={p.sunPos}>
        <sphereGeometry args={[1.15, 20, 20]} />
        <meshBasicMaterial color={c(p.sun)} />
      </mesh>

      <group position={[-4.5 + cloudOffset, 6.4, -15]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.85, 12, 12]} />
          <meshStandardMaterial color={c(p.cloud)} roughness={1} />
        </mesh>
        <mesh position={[0.9, 0.15, 0]}>
          <sphereGeometry args={[0.7, 12, 12]} />
          <meshStandardMaterial color={c(p.cloud)} roughness={1} />
        </mesh>
        <mesh position={[-0.8, -0.1, 0]}>
          <sphereGeometry args={[0.6, 12, 12]} />
          <meshStandardMaterial color={c(p.cloud)} roughness={1} />
        </mesh>
      </group>

      <group position={[3.2 + cloudOffset, 7.1, -16]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.75, 12, 12]} />
          <meshStandardMaterial color={c(p.cloud)} roughness={1} />
        </mesh>
        <mesh position={[0.75, -0.05, 0]}>
          <sphereGeometry args={[0.58, 12, 12]} />
          <meshStandardMaterial color={c(p.cloud)} roughness={1} />
        </mesh>
      </group>

      <mesh position={[-5.2, -1.3, -12.5]} scale={[7.2, 2.8, 3.2]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={c(p.hillNear)} roughness={0.95} />
      </mesh>
      <mesh position={[5.6, -1.4, -13.5]} scale={[7.8, 3.0, 3.4]}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color={c(p.hillNear)} roughness={0.95} />
      </mesh>
      <mesh position={[0.3, -1.8, -16]} scale={[12.5, 3.8, 4.0]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshStandardMaterial color={c(p.hillFar)} roughness={0.95} />
      </mesh>

      <Tree position={[-4.2, 0, -5.2]} scale={1.15} trunk={c(p.trunk)} dark={c(p.treeDark)} light={c(p.treeLight)} />
      <Tree position={[-1.9, 0, -7.2]} scale={1.35} trunk={c(p.trunk)} dark={c(p.treeDark)} light={c(p.treeLight)} />
      <Tree position={[2.6, 0, -6.2]} scale={1.25} trunk={c(p.trunk)} dark={c(p.treeDark)} light={c(p.treeLight)} />
      <Tree position={[5.2, 0, -8.5]} scale={1.4} trunk={c(p.trunk)} dark={c(p.treeDark)} light={c(p.treeLight)} />

      {/* Night distant lights */}
      {timeOfDay === 'night' &&
        NIGHT_LIGHTS.map((pos, index) => (
          <group key={index} position={pos}>
            <mesh position={[0, 1.15, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 2.3, 6]} />
              <meshStandardMaterial color={c('#334155')} roughness={0.8} />
            </mesh>
            <mesh position={[0, 2.35, 0]}>
              <sphereGeometry args={[0.16, 12, 12]} />
              <meshBasicMaterial color={c('#fde68a')} />
            </mesh>
            <mesh position={[0, 2.35, 0]}>
              <sphereGeometry args={[0.42, 12, 12]} />
              <meshBasicMaterial color={c('#fef3c7')} transparent opacity={0.28} depthWrite={false} />
            </mesh>
          </group>
        ))}

      {/* Volumetric light shafts */}
      {volumetricDensity > 0 &&
        VOLUMETRIC_BEAMS.map((beam, index) => (
          <mesh key={index} position={beam.pos} rotation={[0, 0, beam.rotZ]}>
            <planeGeometry args={[beam.width, 9.5]} />
            <meshBasicMaterial
              color={c('#fef3c7')}
              transparent
              opacity={0.07 + volumetricDensity * 0.25}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {/* Midground: Orange Hero (center) & Other Character (left) */}
      <group position={heroPosition} rotation={[0, heroYaw, 0]} visible={!hideHero}>
        <group rotation={[heroPose === 'run' ? 0.16 : 0, 0, 0]}>
          {([-1, 1] as const).map((side) => (
            <group key={side} position={[side * 0.14, 0.68, 0]} rotation={legRotation(side)}>
              <mesh position={[0, -0.34, 0]}>
                <cylinderGeometry args={[0.09, 0.08, 0.68, 8]} />
                <meshStandardMaterial color={c(p.pants)} roughness={0.85} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.98, 0]}>
            <cylinderGeometry args={[0.24, 0.32, 0.72, 12]} />
            <meshStandardMaterial color={p.heroCoat} roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.54, 0]}>
            <sphereGeometry args={[0.24, 16, 16]} />
            <meshStandardMaterial color={c(p.skin)} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.74, -0.02]}>
            <sphereGeometry args={[0.21, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={p.heroHat} roughness={0.7} />
          </mesh>
          <mesh position={[-0.08, 1.56, 0.21]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={c(p.hair)} />
          </mesh>
          <mesh position={[0.08, 1.56, 0.21]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color={c(p.hair)} />
          </mesh>
        </group>
      </group>

      {/* Second Character */}
      <group position={[-1.55, 0, -0.45]} rotation={[0, 0.35, 0]} visible={!hideOther}>
        <mesh position={[-0.13, 0.32, 0]}>
          <cylinderGeometry args={[0.085, 0.075, 0.64, 8]} />
          <meshStandardMaterial color={c(p.pants)} roughness={0.85} />
        </mesh>
        <mesh position={[0.13, 0.32, 0]}>
          <cylinderGeometry args={[0.085, 0.075, 0.64, 8]} />
          <meshStandardMaterial color={c(p.pants)} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.94, 0]}>
          <cylinderGeometry args={[0.22, 0.29, 0.68, 12]} />
          <meshStandardMaterial color={c(p.otherCoat)} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.48, 0]}>
          <sphereGeometry args={[0.22, 14, 14]} />
          <meshStandardMaterial color={c(p.skin)} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.62, -0.04]}>
          <sphereGeometry args={[0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={c(p.hair)} roughness={0.85} />
        </mesh>
      </group>

      {/* Foreground: Fence (left), Swing (right), Grass tufts */}
      <group position={[-1.85, 0, 2.3]}>
        {[-0.6, 0, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.38, 0]}>
            <boxGeometry args={[0.1, 0.76, 0.1]} />
            <meshStandardMaterial color={c(p.fence)} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 0.54, 0]}>
          <boxGeometry args={[1.45, 0.08, 0.06]} />
          <meshStandardMaterial color={c(p.fence)} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[1.45, 0.08, 0.06]} />
          <meshStandardMaterial color={c(p.fence)} roughness={0.9} />
        </mesh>
      </group>

      {/* Swing set */}
      <group position={[2.05, 0, 1.85]} rotation={[0, -0.35, 0]}>
        <mesh position={[-0.65, 0.95, 0.25]} rotation={[0.22, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 2.0, 8]} />
          <meshStandardMaterial color={c(p.swingFrame)} roughness={0.85} />
        </mesh>
        <mesh position={[-0.65, 0.95, -0.25]} rotation={[-0.22, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 2.0, 8]} />
          <meshStandardMaterial color={c(p.swingFrame)} roughness={0.85} />
        </mesh>
        <mesh position={[0.65, 0.95, 0.25]} rotation={[0.22, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 2.0, 8]} />
          <meshStandardMaterial color={c(p.swingFrame)} roughness={0.85} />
        </mesh>
        <mesh position={[0.65, 0.95, -0.25]} rotation={[-0.22, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.055, 2.0, 8]} />
          <meshStandardMaterial color={c(p.swingFrame)} roughness={0.85} />
        </mesh>
        <mesh position={[0, 1.9, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 1.5, 8]} />
          <meshStandardMaterial color={c(p.swingFrame)} roughness={0.85} />
        </mesh>
        <mesh position={[-0.22, 1.22, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 1.32, 6]} />
          <meshStandardMaterial color={c(p.fence)} roughness={0.9} />
        </mesh>
        <mesh position={[0.22, 1.22, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 1.32, 6]} />
          <meshStandardMaterial color={c(p.fence)} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.56, 0.05, 0.24]} />
          <meshStandardMaterial color={c(p.swingSeat)} roughness={0.85} />
        </mesh>
      </group>

      <GrassTuft position={[-2.4, 0, 1.65]} color={c(p.grass)} />
      <GrassTuft position={[-1.0, 0, 2.55]} color={c(p.grass)} />
      <GrassTuft position={[1.15, 0, 2.4]} color={c(p.grass)} />
      <GrassTuft position={[2.65, 0, 2.3]} color={c(p.grass)} />

      {prop}
    </>
  )
}
