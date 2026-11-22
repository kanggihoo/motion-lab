import { CheckIcon, CircleAlertIcon, FolderOpenIcon } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@terms/components/ui/alert'
import { Button } from '@terms/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@terms/components/ui/empty'
import { Input } from '@terms/components/ui/input'
import { Progress, ProgressLabel, ProgressValue } from '@terms/components/ui/progress'
import { Skeleton } from '@terms/components/ui/skeleton'
import { Spinner } from '@terms/components/ui/spinner'

const loadingExamples = ['Skeleton', 'Progress Bar', 'Spinner'] as const
const documents = ['작업 계획', '팀 회고']

function LoadingDocuments() {
  return (
    <ul className="grid gap-1">
      {documents.map((name) => <li key={name} className="rounded border bg-white px-2 py-1">{name}</li>)}
    </ul>
  )
}

export function LoadingPreview({ busy, completed, progress, reduced }: {
  busy: boolean
  completed: boolean
  progress: number
  reduced: boolean
}) {
  return (
    <>
      <output className="block">{busy ? '불러오는 중' : completed ? '✓ 불러오기 완료' : '불러오기 전'}</output>
      <div className="grid gap-2 @md:grid-cols-3" aria-busy={busy}>
        {loadingExamples.map((example) => (
          <div key={example} className="space-y-2 rounded-lg border bg-white p-2">
            <p className="font-semibold">{example}</p>
            {!busy && (completed ? <LoadingDocuments /> : <p>불러올 문서 2건</p>)}
            {busy && example === 'Skeleton' && <>
              <Skeleton aria-hidden className="terms-skeleton h-6 w-full" />
              <Skeleton aria-hidden className="terms-skeleton h-6 w-full" />
              <p>문서 윤곽</p>
            </>}
            {example === 'Progress Bar' && (busy || completed) && (
              <Progress value={busy ? (reduced ? 0 : progress) : 100}>
                <ProgressLabel>{busy ? (reduced ? '대기 중' : '진행률') : '완료'}</ProgressLabel>
                {(!reduced || !busy) && <ProgressValue />}
              </Progress>
            )}
            {busy && example === 'Spinner' && <p className="flex items-center gap-2"><Spinner aria-hidden /> 진행률 미정</p>}
          </div>
        ))}
      </div>
    </>
  )
}

export function EmptyPreview({ title, description, actionLabel, onAction }: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <Empty className="gap-2 border border-dashed bg-white p-3 md:p-3">
      <EmptyHeader className="gap-1">
        <EmptyMedia variant="icon"><FolderOpenIcon aria-hidden /></EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent><Button size="sm" variant="outline" onClick={onAction}>{actionLabel}</Button></EmptyContent>
    </Empty>
  )
}

export function ErrorPreview({ fieldId, value, failed, saved, onInput, onSave }: {
  fieldId: string
  value: string
  failed: boolean
  saved: boolean
  onInput: (value: string) => void
  onSave: () => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave()
  }
  return (
    <form className="space-y-2" onSubmit={submit}>
      <label className="block space-y-1" htmlFor={fieldId}><span>문서 제목</span>
        <Input id={fieldId} value={value} onChange={(event) => onInput(event.target.value)} />
      </label>
      <Button type="submit">{failed ? '다시 시도' : '저장'}</Button>
      {failed && (
        <Alert variant="destructive" role="alert">
          <CircleAlertIcon aria-hidden />
          <AlertTitle>저장 실패</AlertTitle>
          <AlertDescription>네트워크가 끊겼습니다. 연결을 복구한 뒤 다시 시도하세요. 입력한 제목은 유지됩니다.</AlertDescription>
        </Alert>
      )}
      <output className="block">{saved ? '✓ 저장 완료' : ''}</output>
    </form>
  )
}

export type SaveStage = 'idle' | 'loading' | 'success'

export function SavePreview({ stage, label, onSave }: { stage: SaveStage; label: string; onSave: () => void }) {
  const icon: ReactNode = stage === 'loading' ? <Spinner aria-hidden /> : stage === 'success' ? <CheckIcon aria-hidden /> : null
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onSave} aria-disabled={stage !== 'idle'}>
        {icon}{stage === 'idle' ? '저장' : label}
      </Button>
      <output className="block">{stage} · {label}</output>
    </div>
  )
}
