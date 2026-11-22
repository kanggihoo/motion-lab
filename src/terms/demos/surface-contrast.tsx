import { useId, useState } from 'react'
import { previewPicture } from '@terms/components/preview-picture'
import { ContrastResult, ElevationPreview, StyleSample } from '@terms/components/StylePreviews'
import { compositeColor, contrastRatio, parseHexColor } from '@terms/lib/contrast'

const ink = '#172033'
const darkBlue = '#294078'
const lightBlue = '#a5bffa'
const white = parseHexColor('#ffffff')!

export function GlassmorphismDemo() {
  const [blur, setBlur] = useState(12)
  const [opacity, setOpacity] = useState(24)
  const ratio = contrastRatio(parseHexColor(ink)!, compositeColor(parseHexColor(darkBlue)!, white, opacity / 100))

  return (
    <div className="space-y-3">
      <label className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
        <span>배경 흐림</span><span className="tabular-nums">{blur}px</span>
        <input type="range" aria-label="배경 흐림" aria-valuetext={`${blur} 픽셀`} min={0} max={24} value={blur}
          onChange={(event) => setBlur(event.currentTarget.valueAsNumber)} className="col-span-2 w-full accent-indigo-700" />
      </label>
      <label className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5">
        <span>흰색 불투명도</span><span className="tabular-nums">{opacity}%</span>
        <input type="range" aria-label="흰색 불투명도" aria-valuetext={`${opacity} 퍼센트`} min={0} max={100} value={opacity}
          onChange={(event) => setOpacity(event.currentTarget.valueAsNumber)} className="col-span-2 w-full accent-indigo-700" />
      </label>
      <div className="rounded-lg p-4 sm:p-5"
        style={{ background: `repeating-linear-gradient(130deg, ${darkBlue} 0 22px, ${lightBlue} 22px 44px)` }}>
        <StyleSample className="border border-white/60"
          style={{ color: ink, backgroundColor: `rgb(255 255 255 / ${opacity}%)`, backdropFilter: `blur(${blur}px)` }} />
      </div>
      <ContrastResult ratio={ratio} />
      <p className="text-xs leading-relaxed text-slate-700">가장 어두운 배경색에 흰색을 합성한 보수적인 최저 대비입니다. 흐림은 배경 무늬를 바꿉니다.</p>
    </div>
  )
}

export function ElevationDemo() {
  const [flattened, setFlattened] = useState(false)

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={flattened} onChange={(event) => setFlattened(event.target.checked)} />
        모두 같은 그림자
      </label>
      <ElevationPreview flattened={flattened} />
      <p className="text-xs text-slate-700">{flattened ? '그림자 강도가 모두 같습니다.' : '카드 → Popover → Modal Dialog 순으로 그림자가 깊어집니다.'}</p>
    </div>
  )
}

const presets = {
  gray: { label: '회색 위 회색', text: '#777777', background: '#aaaaaa' },
  photo: { label: '사진 위 흰 글씨', text: '#ffffff', background: '#fef3c7' },
  clear: { label: '흰 바탕에 진한 글씨', text: ink, background: '#ffffff' },
} as const
type ContrastPreset = keyof typeof presets

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId()
  const parsed = parseHexColor(value)

  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block font-medium">{label}</label>
      <div className="flex items-center gap-1.5">
        <input type="color" value={parsed ? value : '#000000'} aria-label={`${label} 선택기`}
          onChange={(event) => onChange(event.target.value)} className="h-8 w-8 shrink-0 rounded border bg-white p-0.5" />
        <input id={id} type="text" value={value} maxLength={7} spellCheck={false} autoCapitalize="none"
          aria-invalid={!parsed} onChange={(event) => onChange(event.target.value)}
          className="min-w-0 w-full rounded-md border bg-white px-1.5 py-1 font-mono" />
      </div>
    </div>
  )
}

export function TextContrastDemo() {
  const [preset, setPreset] = useState<ContrastPreset | ''>('gray')
  const [text, setText] = useState<string>(presets.gray.text)
  const [background, setBackground] = useState<string>(presets.gray.background)
  const foregroundRgb = parseHexColor(text)
  const backgroundRgb = parseHexColor(background)
  const photo = preset === 'photo'

  function selectPreset(next: ContrastPreset) {
    setPreset(next)
    setText(presets[next].text)
    setBackground(presets[next].background)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(presets).map(([key, entry]) => (
          <button key={key} type="button" aria-pressed={preset === key} onClick={() => selectPreset(key as ContrastPreset)}
            className="rounded-md border bg-white px-2 py-1 text-xs aria-pressed:border-indigo-700 aria-pressed:font-semibold">
            {preset === key ? '✓ ' : ''}{entry.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <ColorField label="글자색" value={text} onChange={(value) => { setPreset(''); setText(value) }} />
        <ColorField label="배경색" value={background} onChange={(value) => { setPreset(''); setBackground(value) }} />
      </div>
      <StyleSample className="border"
        style={{
          color: foregroundRgb ? text : ink,
          backgroundColor: backgroundRgb ? background : '#fff',
          backgroundImage: photo ? `url("${previewPicture}")` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      {foregroundRgb && backgroundRgb ? <ContrastResult ratio={contrastRatio(foregroundRgb, backgroundRgb)} showLarge /> :
        <p className="rounded-md border bg-white p-3">대비를 계산하려면 색상값을 #RRGGBB 형식으로 입력하세요.</p>}
      {photo && <p className="text-xs leading-relaxed text-slate-700">풍경 예시의 가장 밝은 색(#FEF3C7)을 배경값으로 사용합니다.</p>}
    </div>
  )
}
