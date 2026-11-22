import { useMessageScrollerScrollable } from '@shadcn/react/message-scroller'
import { CheckIcon, CircleAlertIcon, CircleDotIcon, FileTextIcon, Trash2Icon } from 'lucide-react'
import { previewPicture } from './preview-picture'
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from './ui/attachment'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import { Bubble, BubbleContent } from './ui/bubble'
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader } from './ui/message'
import { MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerProvider, MessageScrollerViewport, MessageScrollerItem } from './ui/message-scroller'
import { Progress } from './ui/progress'
import { Spinner } from './ui/spinner'
import { Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger, TraceIcon, TraceLine, TraceTitle } from './ui/trace'

export interface ChatRow {
  id: string
  own?: boolean
  text: string
  time: string
}

export function MessageRows({ rows }: { rows: ChatRow[] }) {
  return (
    <MessageGroup><ol className="space-y-2" aria-label="예시 대화">
      {rows.map((row, index) => {
        const newSpeaker = index === 0 || row.own !== rows[index - 1]?.own
        return (
          <li key={row.id}><Message align={row.own ? 'end' : 'start'}>
            {newSpeaker ? <MessageAvatar aria-hidden><Avatar><AvatarFallback>{row.own ? '나' : '민'}</AvatarFallback></Avatar></MessageAvatar> :
              <span className="w-8 shrink-0" aria-hidden />}
            <MessageContent>
              <MessageHeader>{row.own ? '나' : '민서'} · {row.time}</MessageHeader>
              <p className="max-w-full px-3">{row.text}</p>
              <MessageFooter>{row.own ? '✓ 보냄' : '수신'}</MessageFooter>
            </MessageContent>
          </Message></li>
        )
      })}
    </ol></MessageGroup>
  )
}

function ScrollerStatus() {
  const { end } = useMessageScrollerScrollable()
  return <output className="block border-t p-2 text-xs">{end ? 'Ⅱ 따라가기 멈춤' : '↓ 최신 메시지 따라가기'}</output>
}

export function StreamingMessages({ messages, reduced }: { messages: ChatRow[]; reduced: boolean }) {
  return (
    <MessageScrollerProvider autoScroll scrollEdgeThreshold={10}>
      <div className="min-w-0 rounded border bg-white">
        <MessageScroller className="h-52!">
          <MessageScrollerViewport aria-label="스트리밍 대화 스크롤">
            <MessageScrollerContent className="gap-2 px-2 pt-2 pb-10">
              {messages.map(({ id, text, own }) => (
                <MessageScrollerItem key={id} messageId={id}>
                  <div className="flex min-w-0 flex-col"><Bubble variant={own ? 'default' : 'outline'} align={own ? 'end' : 'start'}>
                    <BubbleContent>{text}</BubbleContent>
                  </Bubble></div>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton size="sm" behavior={reduced ? 'auto' : 'smooth'} onClick={(event) => {
            event.currentTarget.parentElement?.querySelector<HTMLElement>('[data-slot=message-scroller-viewport]')?.focus({ preventScroll: true })
          }}>최신으로 ↓</MessageScrollerButton>
        </MessageScroller>
        <ScrollerStatus />
      </div>
    </MessageScrollerProvider>
  )
}

export type UploadState = 'idle' | 'uploading' | 'processing' | 'error' | 'done'

const uploadLabels: Record<UploadState, string> = {
  idle: '○ 대기', uploading: '↑ 업로드 중', processing: '… 처리 중', error: '× 오류', done: '✓ 완료',
}

export function AttachmentPreview({ file, state, progress, remove, retry }: {
  file: { name: string; size: string; image?: boolean }
  state: UploadState
  progress: number
  remove: () => void
  retry: () => void
}) {
  return (
    <Attachment state={state} size="sm" className="w-full! min-w-0">
      <AttachmentMedia variant={file.image ? 'image' : 'icon'}>
        {file.image ? <img src={previewPicture} alt="" /> : <FileTextIcon aria-hidden />}
      </AttachmentMedia>
      <AttachmentContent className="min-w-0">
        <AttachmentTitle className="wrap-anywhere">{file.name}</AttachmentTitle>
        <AttachmentDescription>{file.size} · {uploadLabels[state]}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions className="flex-wrap">
        {state === 'error' && <Button variant="outline" size="xs" onClick={retry}>재시도</Button>}
        <AttachmentAction aria-label={`${file.name} 제거`} onClick={remove}><Trash2Icon aria-hidden /></AttachmentAction>
      </AttachmentActions>
      {state === 'uploading' && <Progress className="w-full" value={progress} aria-label={`${file.name} 업로드 진행률`} />}
    </Attachment>
  )
}

const traceSteps = [
  ['검색', '가짜 검색 결과에서 예시 문서 2개를 찾았습니다.'],
  ['파일 읽기', '로컬 예시 텍스트에서 제목과 날짜를 읽었습니다.'],
  ['답변 작성', '핵심 세 문장을 정리했습니다.'],
] as const

export function TracePreview({ step }: { step: number }) {
  return (
    <Trace className="space-y-2" aria-live="polite">
      {traceSteps.map(([title, details], index) => {
        const done = step > index
        const running = step === index
        const line = <TraceLine status={done ? undefined : running ? 'running' : 'pending'}>
          <TraceIcon>{done ? <CheckIcon aria-hidden /> : running ? <Spinner aria-hidden /> : <CircleDotIcon aria-hidden />}</TraceIcon>
          <TraceTitle>{title} · {done ? '완료' : running ? '진행 중' : '대기'}</TraceTitle>
        </TraceLine>
        return done ? (
          <TraceCollapsible key={title}>
            <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
            <TraceCollapsibleContent>{details}</TraceCollapsibleContent>
          </TraceCollapsible>
        ) : <div key={title}>{line}</div>
      })}
    </Trace>
  )
}

export function UploadFailure() {
  return <p className="flex items-center gap-2 text-red-800"><CircleAlertIcon className="size-4" aria-hidden /> 예시 파일 전송 실패</p>
}
