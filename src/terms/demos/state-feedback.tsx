import { CircleXIcon, SaveIcon, InfoIcon, TriangleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@terms/components/ui/alert"

import { useEffect, useId, useState } from 'react'
import { EmptyPreview, ErrorPreview, LoadingPreview, SavePreview, type SaveStage } from '@terms/components/StatePreviews'
import { Button } from '@terms/components/ui/button'
import { useReducedMotion } from '@terms/lib/motion'

export function LoadingDemo() {
  const [seconds, setSeconds] = useState(3)
  const [progress, setProgress] = useState(0)
  const [run, setRun] = useState<{ start: number; duration: number } | null>(null)
  const reduced = useReducedMotion()
  const rangeId = useId()

  useEffect(() => {
    if (!run) return
    const finish = window.setTimeout(() => {
      setProgress(100)
      setRun(null)
    }, Math.max(0, run.duration - (performance.now() - run.start)))
    const timer = reduced ? undefined : window.setInterval(() => {
      setProgress(Math.min(99, Math.floor((performance.now() - run.start) * 100 / run.duration)))
    }, 80)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(finish)
    }
  }, [run, reduced])

  return (
    <div className="@container space-y-3">
      <label htmlFor={rangeId} className="flex items-center justify-between gap-2">로딩 시간 <output htmlFor={rangeId}>{seconds}초</output></label>
      <input id={rangeId} type="range" min={1} max={8} value={seconds} className="block w-full accent-indigo-700" onChange={(event) => setSeconds(event.target.valueAsNumber)} />
      <Button aria-disabled={run !== null} onClick={() => {
        if (run) return
        setProgress(0)
        setRun({ start: performance.now(), duration: seconds * 1000 })
      }}>불러오기</Button>
      <LoadingPreview busy={run !== null} completed={progress === 100} progress={progress} reduced={reduced} />
    </div>
  )
}

export function EmptyDemo() {
  const [filter, setFilter] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [created, setCreated] = useState(false)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <label><input type="checkbox" checked={filter} disabled={showNew} onChange={(event) => setFilter(event.target.checked)} /> 지난 1분에 만든 프로젝트만</label>
        <label><input type="checkbox" checked={showNew} onChange={(event) => setShowNew(event.target.checked)} /> 처음 사용 보기</label>
      </div>
      {showNew && !created && <EmptyPreview title="아직 프로젝트가 없습니다" description="프로젝트를 만들면 이 목록에 표시됩니다." actionLabel="첫 프로젝트 만들기" onAction={() => setCreated(true)} />}
      {!showNew && filter && <EmptyPreview title="결과 없음" description="지난 1분에 만든 프로젝트가 0건입니다." actionLabel="필터 초기화" onAction={() => setFilter(false)} />}
      {((showNew && created) || (!showNew && !filter)) && (
        <output className="block rounded border bg-white p-3">{showNew ? '프로젝트 1건 · 내 첫 프로젝트' : '프로젝트 2건 · 디자인 시스템, 팀 협업'}</output>
      )}
      {showNew && created && <Button variant="outline" size="sm" onClick={() => setCreated(false)}>처음 상태로</Button>}
    </div>
  )
}

export function ErrorDemo() {
  const [value, setValue] = useState('팀 회고')
  const [offline, setOffline] = useState(false)
  const [result, setResult] = useState<'idle' | 'failed' | 'saved'>('idle')
  const fieldId = useId()
  return (
    <div className="space-y-3">
      <label><input type="checkbox" checked={offline} onChange={(event) => setOffline(event.target.checked)} /> 네트워크 끊기</label>
      <ErrorPreview fieldId={fieldId} value={value} failed={result === 'failed'} saved={result === 'saved'}
        onInput={(next) => { setValue(next); if (result === 'saved') setResult('idle') }}
        onSave={() => setResult(offline ? 'failed' : 'saved')} />
    </div>
  )
}

const saveLabels: Record<SaveStage, string> = {
  idle: '대기',
  loading: '저장 중',
  success: '저장 완료',
}

const stages: SaveStage[] = ['idle', 'loading', 'success']

export function MicroInteractionDemo() {
  const [stage, setStage] = useState<SaveStage>('idle')
  const [manual, setManual] = useState(false)
  useEffect(() => {
    if (manual || stage === 'idle') return
    const timer = setTimeout(() => setStage(stage === 'loading' ? 'success' : 'idle'), stage === 'loading' ? 900 : 2000)
    return () => clearTimeout(timer)
  }, [stage, manual])

  return (
    <div className="space-y-3">
      <SavePreview stage={stage} label={saveLabels[stage]} onSave={() => {
        if (stage !== 'idle') return
        setManual(false)
        setStage('loading')
      }} />
      <fieldset className="flex flex-wrap gap-2"><legend className="sr-only">저장 단계 멈춰 보기</legend>
        {stages.map((item) => (
          <Button key={item} size="sm" variant="outline" aria-pressed={manual && stage === item} onClick={() => {
            setManual(true)
            setStage(item)
          }}>{manual && stage === item ? '✓ ' : ''}{saveLabels[item]}</Button>
        ))}
      </fieldset>
    </div>
  )
}

export function AlertDemo() {
  return (
    <div className="space-y-2">
      <Alert role="note"><InfoIcon aria-hidden /><AlertTitle>정보 · 청구서 발행</AlertTitle><AlertDescription>이번 달 청구서를 확인할 수 있습니다.</AlertDescription></Alert>
      <Alert role="note"><TriangleAlertIcon aria-hidden /><AlertTitle>경고 · 결제 수단 만료 예정</AlertTitle><AlertDescription>다음 결제 전에 카드를 갱신하세요.</AlertDescription></Alert>
      <Alert role="note" variant="destructive"><CircleXIcon aria-hidden /><AlertTitle>오류 · 결제 실패</AlertTitle><AlertDescription>카드의 결제 한도를 확인하세요.</AlertDescription></Alert>
      <p>Alert는 화면에 남습니다. Toast는 잠깐 표시된 뒤 사라집니다.</p>
    </div>
  )
}

const statuses = [
  ['온라인','✓','bg-emerald-700'], ['오프라인','×','bg-slate-600'], ['점검','!','bg-amber-700'],
] as const

export function StatusDotDemo() {
  const [index, setIndex] = useState(0)
  const [name, symbol, color] = statuses[index] ?? statuses[0]
  return <div className="space-y-2">
    <label>상태 <select value={index} onChange={(event) => setIndex(Number(event.target.value))}>
      {statuses.map(([item], i) => <option key={item} value={i}>{item}</option>)}
    </select></label>
    <output className="flex items-center gap-2"><span aria-hidden className={`size-2.5 rounded-full ${color}`} /> {symbol} 민서 · {name}</output>
  </div>
}

export function VisuallyHiddenDemo() {
  const [hidden, setHidden] = useState(true)
  const [saved, setSaved] = useState(false)
  return <div className="space-y-2">
    <label className="block"><input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} /> 화면에서 버튼 이름 숨기기</label>
    <Button variant="outline" onClick={() => setSaved(!saved)}><SaveIcon aria-hidden /><span className={hidden ? 'sr-only' : ''}>메모 저장</span></Button>
    {saved && <output className="block">✓ 저장됨</output>}
  </div>
}
