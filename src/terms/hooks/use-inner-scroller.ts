import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Motion · Scroll 데모의 카드 안 스크롤러(D-8). `scrollerProps`는 `<section>`에 펼치고,
 * ScrollTrigger에는 `scroller: scrollerRef.current`를 준다.
 * `tabIndex=0`이라 키보드로 스크롤할 수 있고 Tab으로 바로 빠져나간다(D-12).
 */
export function useInnerScroller({ label, onScroll }: {
  /** 스크롤 영역의 접근 가능한 이름 */
  label: string
  /** mount 직후와 스크롤할 때 불린다. ratio는 0~1. */
  onScroll?: (ratio: number) => void
}) {
  const scrollerRef = useRef<HTMLElement>(null)
  const onScrollRef = useRef(onScroll)

  useLayoutEffect(() => {
    onScrollRef.current = onScroll
  })

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return

    const sync = () => {
      const max = scroller.scrollHeight - scroller.clientHeight
      onScrollRef.current?.(max > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / max)) : 0)
    }

    sync()
    scroller.addEventListener('scroll', sync, { passive: true })
    return () => scroller.removeEventListener('scroll', sync)
  }, [])

  return {
    scrollerRef,
    scrollerProps: {
      ref: scrollerRef,
      tabIndex: 0,
      'aria-label': label,
      /** 높이는 카드가 `h-*`로 덧붙인다. */
      className:
        'overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-indigo-700',
    },
  }
}
