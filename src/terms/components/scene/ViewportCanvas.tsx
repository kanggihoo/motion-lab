import { Canvas } from '@react-three/fiber'
import { useEffect, useInsertionEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@terms/components/ui/button'
import type { TimeOfDay } from './scene-colors'

interface ViewportCanvasProps {
  children: ReactNode
  label: string
  placeholderTone?: TimeOfDay
  className?: string
  camera?: { position: [number, number, number]; fov: number; near?: number; far?: number }
}

const PLACEHOLDER_COLORS: Record<TimeOfDay, { sky: string; hill: string; ground: string }> = {
  day: { sky: '#8ec8f6', hill: '#558b2f', ground: '#7cb342' },
  sunset: { sky: '#e58856', hill: '#6b5e2e', ground: '#8d7b3a' },
  night: { sky: '#0f1c38', hill: '#1e293b', ground: '#1f2937' },
}

function ScenePlaceholder({
  tone,
  message,
  onReload,
}: {
  tone: TimeOfDay
  message: string
  onReload?: () => void
}) {
  const { sky, hill, ground } = PLACEHOLDER_COLORS[tone]

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${sky} 58%, ${ground} 58%)` }}
    >
      <svg viewBox="0 0 320 200" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full">
        {tone === 'night' && <circle cx="245" cy="40" r="10" fill="#e2e8f0" opacity="0.9" />}
        <ellipse cx="90" cy="120" rx="120" ry="34" fill={hill} opacity="0.8" />
        <ellipse cx="240" cy="122" rx="125" ry="36" fill={hill} opacity="0.9" />
        {tone === 'night' && (
          <>
            <circle cx="95" cy="108" r="3" fill="#fde68a" />
            <circle cx="176" cy="106" r="3" fill="#fde68a" />
            <circle cx="235" cy="108" r="3" fill="#fde68a" />
          </>
        )}
        <rect x="0" y="116" width="320" height="84" fill={ground} />
        <circle cx="160" cy="108" r="10" fill="#f97316" />
        <circle cx="128" cy="110" r="8" fill="#2563eb" />
      </svg>
      <div className="relative z-10 flex flex-col items-center gap-2 rounded-md bg-slate-950/70 px-3 py-2 text-xs text-white backdrop-blur-xs">
        <span>{message}</span>
        {onReload && (
          <Button type="button" size="xs" variant="secondary" onClick={onReload}>
            다시 불러오기
          </Button>
        )}
      </div>
    </div>
  )
}

export function ViewportCanvas({
  children,
  label,
  placeholderTone = 'day',
  className = '',
  camera = { position: [0, 1.6, 5.8], fov: 42, near: 0.1, far: 100 },
}: ViewportCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(true)
  const inViewRef = useRef(false)
  const [inView, setInView] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [mountKey, setMountKey] = useState(0)

  useInsertionEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
    }
  }, [inView, mountKey])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        inViewRef.current = entry.isIntersecting
        setInView(entry.isIntersecting)
        if (!entry.isIntersecting) setContextLost(false)
      },
      { rootMargin: '250px 0px' },
    )
    observer.observe(el)

    const onLost = (event: Event) => {
      const target = event.target
      if (!activeRef.current || !inViewRef.current || !(target instanceof HTMLCanvasElement) || !target.isConnected) {
        return
      }
      event.preventDefault()
      setContextLost(true)
    }
    const onRestored = () => {
      setContextLost(false)
    }

    el.addEventListener('webglcontextlost', onLost, true)
    el.addEventListener('webglcontextrestored', onRestored, true)
    return () => {
      observer.disconnect()
      el.removeEventListener('webglcontextlost', onLost, true)
      el.removeEventListener('webglcontextrestored', onRestored, true)
    }
  }, [])

  return (
    <figure
      ref={containerRef}
      aria-label={label}
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900 ${className}`}
    >
      {!inView && <ScenePlaceholder tone={placeholderTone} message="화면에 들어오면 3D 장면 표시" />}
      {inView && contextLost && (
        <ScenePlaceholder
          tone={placeholderTone}
          message="3D 화면이 일시 중단되었습니다"
          onReload={() => {
            setContextLost(false)
            setMountKey((k) => k + 1)
          }}
        />
      )}
      {inView && !contextLost && (
        <Canvas
          key={mountKey}
          dpr={[1, 1.5]}
          gl={{ antialias: true, powerPreference: 'default' }}
          camera={camera}
        >
          {children}
        </Canvas>
      )}
    </figure>
  )
}
