import { useSyncExternalStore } from 'react'

export const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

function subscribe(listener: () => void) {
  const media = window.matchMedia(FINE_POINTER_QUERY)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

function matches() {
  return window.matchMedia(FINE_POINTER_QUERY).matches
}

/** 마우스처럼 hover가 되는 정밀 포인터가 주 입력이면 true. 터치 기기는 false. */
export function useFinePointer() {
  return useSyncExternalStore(subscribe, matches)
}
