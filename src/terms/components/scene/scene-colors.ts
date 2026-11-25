export type TimeOfDay = 'day' | 'sunset' | 'night'

export function toLuminanceHex(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
  const part = lum.toString(16).padStart(2, '0')
  return `#${part}${part}${part}`
}

export function pickColor(hex: string, monochrome: boolean): string {
  return monochrome ? toLuminanceHex(hex) : hex
}

export interface TimePalette {
  sky: string
  sun: string
  sunPos: [number, number, number]
  ambientIntensity: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  dirColor: string
  dirIntensity: number
  ground: string
  hillNear: string
  hillFar: string
  cloud: string
  grass: string
  treeDark: string
  treeLight: string
  trunk: string
  fence: string
  swingFrame: string
  swingSeat: string
  otherCoat: string
  skin: string
  pants: string
  hair: string
  heroCoat: string
  heroHat: string
}

export const TIME_PALETTES: Record<TimeOfDay, TimePalette> = {
  day: {
    sky: '#8ec8f6',
    sun: '#fde047',
    sunPos: [7, 9, -17],
    ambientIntensity: 0.6,
    hemiSky: '#dbeafe',
    hemiGround: '#4d7c0f',
    hemiIntensity: 0.55,
    dirColor: '#fffbeb',
    dirIntensity: 1.15,
    ground: '#7cb342',
    hillNear: '#558b2f',
    hillFar: '#33691e',
    cloud: '#f8fafc',
    grass: '#4d7c0f',
    treeDark: '#2e7d32',
    treeLight: '#43a047',
    trunk: '#795548',
    fence: '#a1887f',
    swingFrame: '#8d6e63',
    swingSeat: '#5d4037',
    otherCoat: '#2563eb',
    skin: '#fdba74',
    pants: '#334155',
    hair: '#1e293b',
    heroCoat: '#f97316',
    heroHat: '#ea580c',
  },
  sunset: {
    sky: '#e58856',
    sun: '#fb923c',
    sunPos: [5.5, 2.1, -17],
    ambientIntensity: 0.45,
    hemiSky: '#fdba74',
    hemiGround: '#431407',
    hemiIntensity: 0.5,
    dirColor: '#ffedd5',
    dirIntensity: 1.25,
    ground: '#8d7b3a',
    hillNear: '#6b5e2e',
    hillFar: '#4c3f2a',
    cloud: '#fed7aa',
    grass: '#6b6324',
    treeDark: '#4a5d23',
    treeLight: '#6b7028',
    trunk: '#5d4037',
    fence: '#8d6e63',
    swingFrame: '#6d4c41',
    swingSeat: '#3e2723',
    otherCoat: '#3b5bdb',
    skin: '#f6ad7b',
    pants: '#312e4a',
    hair: '#1e1b2e',
    heroCoat: '#f97316',
    heroHat: '#ea580c',
  },
  night: {
    sky: '#0f1c38',
    sun: '#e2e8f0',
    sunPos: [6, 8.5, -17],
    ambientIntensity: 0.22,
    hemiSky: '#93c5fd',
    hemiGround: '#0f172a',
    hemiIntensity: 0.45,
    dirColor: '#cbd5e1',
    dirIntensity: 0.65,
    ground: '#1f2937',
    hillNear: '#1e293b',
    hillFar: '#0f172a',
    cloud: '#334155',
    grass: '#1e3a2f',
    treeDark: '#132a1f',
    treeLight: '#1b3a2b',
    trunk: '#3e2723',
    fence: '#475569',
    swingFrame: '#475569',
    swingSeat: '#1e293b',
    otherCoat: '#1d4ed8',
    skin: '#cbd5e1',
    pants: '#1e293b',
    hair: '#0f172a',
    heroCoat: '#f97316',
    heroHat: '#ea580c',
  },
}
