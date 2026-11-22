type Rgb = readonly [number, number, number]

export function parseHexColor(value: string): Rgb | undefined {
  if (!/^#[\da-f]{6}$/i.test(value)) return undefined
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}

export function compositeColor(background: Rgb, foreground: Rgb, opacity: number): Rgb {
  const mix = (index: 0 | 1 | 2) => background[index] * (1 - opacity) + foreground[index] * opacity
  return [mix(0), mix(1), mix(2)]
}

function relativeLuminance([red, green, blue]: Rgb) {
  const linear = (channel: number) => {
    const srgb = channel / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
}

export function contrastRatio(foreground: Rgb, background: Rgb) {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}
