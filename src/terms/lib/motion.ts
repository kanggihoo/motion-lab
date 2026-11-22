import { createContext, useContext, useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

function subscribe(listener: () => void) {
  const media = window.matchMedia(query)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

function getPreference() {
  return window.matchMedia(query).matches
}

export const ReducedMotionContext = createContext(false)

export function useReducedMotionPreference() {
  return useSyncExternalStore(subscribe, getPreference)
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext)
}
