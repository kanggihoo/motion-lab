import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TIME_PALETTES, pickColor, toLuminanceHex } from '@terms/components/scene/scene-colors'
import { sections } from '@terms/data'
import { computeDollyOptics, dissolveMixAt } from '@terms/lib/demo-math'

describe('Terms Dashboard data integrity & Look section', () => {
  it('orders sections as ui, motion, style, camera, edit, look', () => {
    expect(sections.map((s) => s.id)).toEqual(['ui', 'motion', 'style', 'camera', 'edit', 'look'])
  })

  it('registers all 7 Look cards across Color & Light and Texture & Frame', () => {
    const look = sections.find((s) => s.id === 'look')
    expect(look).toBeDefined()
    expect(look!.categories.map((c) => c.id)).toEqual(['color-light', 'texture-frame'])

    const colorLight = look!.categories[0]!.terms
    const textureFrame = look!.categories[1]!.terms
    expect(colorLight.map((t) => t.id)).toEqual([
      'color-grading',
      'selective-color',
      'day-for-night',
      'volumetric-light',
    ])
    expect(textureFrame.map((t) => t.id)).toEqual(['film-grain', 'letterbox', 'vignette'])

    for (const term of [...colorLight, ...textureFrame]) {
      expect(term.filmmaking?.trim().length).toBeGreaterThan(0)
      expect(term.implementation.trim().length).toBeGreaterThan(0)
    }
  })

  it('keeps unimplemented cards out of registered sections', () => {
    const allIds = new Set(
      sections.flatMap((s) => s.categories.flatMap((c) => c.terms.map((t) => t.id))),
    )
    expect(allIds.has('arc-shot')).toBe(false)
    expect(allIds.has('jump-cut')).toBe(false)
    expect(allIds.has('stagger')).toBe(false)
  })

  it('has unique term IDs per section and matching loadDemos keys for every term', async () => {
    for (const section of sections) {
      const seen = new Set<string>()
      for (const category of section.categories) {
        const demos = await category.loadDemos()
        for (const term of category.terms) {
          expect(seen.has(term.id), `${section.id}/${term.id} duplicated`).toBe(false)
          seen.add(term.id)
          expect(typeof demos[term.id], `${section.id}/${category.id}/${term.id} missing demo`).toBe('function')
        }
      }
    }
  }, 15_000)
})

describe('Essay / Dashboard boundary', () => {
  it('never imports src/terms or 3D libraries inside src/connection-pool', () => {
    const dir = join(process.cwd(), 'src', 'connection-pool')
    const files = readdirSync(dir).filter((name) => /\.(ts|tsx)$/.test(name))
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const source = readFileSync(join(dir, file), 'utf8')
      expect(source).not.toMatch(/from\s+['"](?:@terms|\.\.\/terms|.*\/terms\/)/)
      expect(source).not.toMatch(/from\s+['"](?:three|@react-three\/fiber|@react-three\/drei)['"]/)
    }
  })
})

describe('Pure scene & demo math helpers', () => {
  it('converts colors to Rec.709 luminance grayscale', () => {
    expect(toLuminanceHex('#ffffff')).toBe('#ffffff')
    expect(toLuminanceHex('#000000')).toBe('#000000')
    expect(toLuminanceHex('#ff0000')).toBe('#363636')
    expect(pickColor('#2563eb', false)).toBe('#2563eb')
    expect(pickColor('#2563eb', true)).toBe(toLuminanceHex('#2563eb'))
  })

  it('defines night palette with dark sky and pale moon', () => {
    expect(TIME_PALETTES.night.sky).toBe('#0f1c38')
    expect(TIME_PALETTES.night.sun).toBe('#e2e8f0')
    expect(TIME_PALETTES.night.ambientIntensity).toBeLessThan(TIME_PALETTES.day.ambientIntensity)
  })

  it('keeps Dolly Zoom subject half-height constant across progress', () => {
    const heights = [0, 0.25, 0.5, 0.75, 1].map((p) => {
      const { dist, fov } = computeDollyOptics(p, 'out-in')
      return dist * Math.tan((fov * Math.PI) / 360)
    })
    for (const h of heights) {
      expect(h).toBeCloseTo(heights[0]!, 5)
    }
  })

  it('computes Dissolve mix factor around overlap window', () => {
    expect(dissolveMixAt(0, 1)).toBe(0)
    expect(dissolveMixAt(1.5, 1)).toBe(0)
    expect(dissolveMixAt(2.0, 1)).toBeCloseTo(0.5, 5)
    expect(dissolveMixAt(2.5, 1)).toBe(1)
    expect(dissolveMixAt(4, 1)).toBe(1)
  })
})
