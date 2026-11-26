/** Typewriter: 초당 글자 수로 전체 타이핑 시간을 정한다. */
export function typingDuration(text: string, charsPerSecond: number) {
  return Array.from(text).length / charsPerSecond
}

const countFormat = new Intl.NumberFormat('ko-KR')

/** Count-up 표시값. */
export function formatCount(value: number) {
  return countFormat.format(Math.round(value))
}

export type ScrambleCharset = 'letters' | 'numbers' | 'symbols'

export const SCRAMBLE_CHARSETS: Record<ScrambleCharset, { label: string; chars: string }> = {
  letters: { label: '영문', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  numbers: { label: '숫자', chars: '0123456789' },
  symbols: { label: '기호', chars: '!@#$%&*+=?/<>' },
}
