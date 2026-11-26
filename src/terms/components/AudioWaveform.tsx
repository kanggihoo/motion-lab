import { audioClipAt, audioLevelAt, type AudioClip, type AudioKind } from '@terms/lib/edit-transition-math'

const WIDTH = 320
const HEIGHT = 70
const MID = 42
const MAX_HALF = 25
const BAR_COUNT = 64

const KIND_COLORS: Record<AudioKind, string> = {
  quiet: '#94a3b8',
  alarm: '#fb7185',
  talk: '#38bdf8',
  train: '#fbbf24',
}

interface AudioWaveformProps {
  clips: AudioClip[]
  duration: number
  time: number
  label: string
}

/** 소리를 내지 않는 오디오 레벨 도식. 클립은 색과 함께 이름·점선 경계로 구분한다. */
export function AudioWaveform({ clips, duration, time, label }: AudioWaveformProps) {
  const x = (t: number) => (t / duration) * WIDTH
  const slot = WIDTH / BAR_COUNT

  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- inline SVG + role="img" 표준 패턴
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label} className="block w-full">
      <rect width={WIDTH} height={HEIGHT} rx="4" fill="#0f172a" />
      {Array.from({ length: BAR_COUNT }, (_, index) => {
        const t = ((index + 0.5) / BAR_COUNT) * duration
        const clip = audioClipAt(clips, t)
        const half = Math.max(0.8, audioLevelAt(clip.kind, t) * MAX_HALF)
        return (
          <rect
            key={index}
            x={index * slot + 1}
            y={MID - half}
            width={slot - 2}
            height={half * 2}
            fill={KIND_COLORS[clip.kind]}
            opacity={t <= time ? 1 : 0.5}
          />
        )
      })}
      {clips.map((clip, index) => (
        <g key={clip.label}>
          {index > 0 && (
            <line x1={x(clip.start)} y1="0" x2={x(clip.start)} y2={HEIGHT} stroke="#ffffff" strokeDasharray="3 2" />
          )}
          <text x={x(clip.start) + 5} y="11" fontSize="9" fontWeight="600" fill="#f8fafc">
            {clip.label}
          </text>
        </g>
      ))}
      <line x1={x(time)} y1="0" x2={x(time)} y2={HEIGHT} stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  )
}
