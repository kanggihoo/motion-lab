import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@terms/components/ui/popover"
import { Textarea } from "@terms/components/ui/textarea"

import { useEffect, useState } from 'react'
import { InfoIcon } from 'lucide-react'
import { AttachmentPreview, MessageRows, StreamingMessages, TracePreview, UploadFailure, type ChatRow, type UploadState } from '@terms/components/ChatPreviews'
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@terms/components/ui/bubble'
import { Button } from '@terms/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@terms/components/ui/collapsible'
import { Marker, MarkerContent, MarkerIcon } from '@terms/components/ui/marker'
import { Questionnaire, QuestionnaireActions, QuestionnaireChoice, QuestionnaireChoices, QuestionnaireDescription, QuestionnaireError, QuestionnaireInput, QuestionnaireItem, QuestionnaireNext, QuestionnairePrevious, QuestionnaireProgress, QuestionnaireSkip, QuestionnaireSubmit, QuestionnaireTitle } from '@terms/components/ui/questionnaire'
import { Spinner } from '@terms/components/ui/spinner'
import { useReducedMotion } from '@terms/lib/motion'

const conversation: ChatRow[] = [
  { id: 'one', text: '회의 안건을 먼저 공유할게요.', time: '09:30' },
  { id: 'two', text: '일정과 담당자도 함께 확인해요.', time: '09:31' },
  { id: 'three', own: true, text: '담당자에게 알려 둘게요.', time: '09:32' },
  { id: 'four', own: true, text: '자료 정리도 시작했습니다.', time: '09:33' },
]

export function MessageDemo() {
  return <MessageRows rows={conversation} />
}

export function BubbleDemo() {
  const [reacted, setReacted] = useState(false)
  const [variant, setVariant] = useState<'outline' | 'tinted' | 'muted'>('outline')
  return (
    <div className="space-y-3">
      <label>상대 말풍선 <select value={variant} onChange={(event) => setVariant(event.target.value as typeof variant)}>
        <option value="outline">외곽선</option><option value="tinted">강조</option><option value="muted">흐림</option>
      </select></label>
      <BubbleGroup className="pb-5">
        <Bubble align="end"><BubbleContent>오늘 회의 기록 보내 주세요.</BubbleContent></Bubble>
        <Bubble variant={variant}>
          <BubbleContent>
            요약을 준비했습니다.
            <Collapsible>
              <CollapsibleTrigger className="block py-1 underline underline-offset-2">더 보기</CollapsibleTrigger>
              <CollapsibleContent>다음 회의 전에 일정과 담당자를 확인합니다.</CollapsibleContent>
            </Collapsible>
          </BubbleContent>
          <BubbleReactions><Button size="xs" variant="outline" aria-pressed={reacted} aria-label="좋아요 리액션" onClick={() => setReacted(!reacted)}>👍 {reacted ? '1 · 선택' : '0'}</Button></BubbleReactions>
        </Bubble>
      </BubbleGroup>
    </div>
  )
}

const reply = [
  '요약을 시작합니다.', '첫 번째 안건은 신규 프로젝트입니다.', '작업 범위를 두 단계로 나눴습니다.',
  '초안을 작성한 뒤 함께 검토합니다.', '일정은 금요일에 다시 확인합니다.', '기록은 팀 문서에 보관합니다.',
  '담당자는 회의 후 공유합니다.', '질문은 댓글로 남길 수 있습니다.', '마지막으로 변경 사항을 알립니다.',
  '요약이 끝났습니다.',
].map((text, index) => ({ id: `reply-${index}`, text, time: '09:34' }))

export function MessageScrollerDemo() {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(0)
  const [running, setRunning] = useState(false)
  const [older, setOlder] = useState(0)

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      const next = reduced ? reply.length : shown + 1
      setShown(next)
      if (next >= reply.length) setRunning(false)
    }, reduced ? 0 : 420)
    return () => window.clearTimeout(timer)
  }, [reduced, running, shown])

  const oldMessages = Array.from({ length: older }, (_, index) => ({
    id: `previous-${older - index}`, text: `이전 회의 기록 · ${older - index}`, time: '09:00',
  }))
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button aria-disabled={running} onClick={() => {
          if (running) return
          setShown(reduced ? reply.length : 0)
          setRunning(!reduced)
        }}>응답 생성</Button>
        <Button variant="outline" onClick={() => setOlder((count) => count + 3)}>이전 대화 불러오기</Button>
      </div>
      <StreamingMessages messages={[...oldMessages, ...conversation, ...reply.slice(0, shown)]} reduced={reduced} />
      <output className="block">{running ? `응답 작성 중 · ${shown}줄` : shown ? '✓ 응답 완료' : '응답 생성 전'}</output>
    </div>
  )
}

const files = [
  { name: '회의록.txt', size: '18 KB' },
  { name: '현장.png', size: '420 KB', image: true },
  { name: '비용.csv', size: '32 KB' },
]

export function AttachmentDemo() {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState(0)
  const [removed, setRemoved] = useState<number[]>([])
  const [retried, setRetried] = useState(false)

  useEffect(() => {
    if (phase !== 1 && phase !== 2) return
    const timer = window.setTimeout(() => setPhase(reduced ? 3 : phase + 1), reduced ? 0 : 760)
    return () => window.clearTimeout(timer)
  }, [phase, reduced])

  return (
    <div className="space-y-2">
      <Button onClick={() => { setRemoved([]); setRetried(false); setPhase(reduced ? 3 : 1) }}>업로드 재현</Button>
      <div className="grid gap-2" aria-live="polite">
        {files.map((file, index) => {
          if (removed.includes(index)) return null
          const state: UploadState = phase === 0 ? 'idle' : phase === 1 ? 'uploading' : phase === 2 ?
            (index === 0 ? 'done' : 'processing') : index === 2 && !retried ? 'error' : 'done'
          return (
            <AttachmentPreview key={file.name} file={file} state={state} progress={30 + index * 20}
              remove={() => setRemoved((items) => [...items, index])} retry={() => setRetried(true)} />
          )
        })}
      </div>
      {phase === 3 && !retried && !removed.includes(2) && <UploadFailure />}
    </div>
  )
}

export function MarkerDemo() {
  const [thinking, setThinking] = useState(false)
  return (
    <div className="space-y-3">
      <p className="rounded border bg-white p-2">민서 · 안녕하세요.</p>
      <div><hr aria-label="11월 22일" className="sr-only" /><Marker variant="separator" aria-hidden><MarkerContent>11월 22일</MarkerContent></Marker></div>
      <Marker variant="border"><MarkerIcon><InfoIcon /></MarkerIcon><MarkerContent>대화가 요약되었습니다.</MarkerContent></Marker>
      <Button variant="outline" size="sm" aria-pressed={thinking} onClick={() => setThinking(!thinking)}>{thinking ? '진행 표시 끄기' : '진행 표시 보기'}</Button>
      <Marker>
        {thinking && <MarkerIcon><Spinner /></MarkerIcon>}
        <MarkerContent className={thinking ? 'animate-pulse' : undefined}>{thinking ? '생각 중…' : '응답 대기'}</MarkerContent>
      </Marker>
    </div>
  )
}

export function TraceDemo() {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (step < 0 || step >= 3) return
    const timer = window.setTimeout(() => setStep(reduced ? 3 : step + 1), reduced ? 0 : 690)
    return () => window.clearTimeout(timer)
  }, [reduced, step])

  return (
    <div className="space-y-3">
      <Button onClick={() => setStep(reduced ? 3 : 0)}>예시 작업 실행</Button>
      <TracePreview step={step} />
    </div>
  )
}

const questions = [
  { name: 'work', required: true, choices: [{ value: '문서' }, { value: '프로젝트' }] },
  { name: 'updates', required: true, choices: [{ value: '출시' }, { value: '팁' }, { value: '이벤트' }] },
  { name: 'notes' },
]

export function QuestionnaireDemo() {
  const [current, setCurrent] = useState('work')
  const [result, setResult] = useState<string | null>(null)
  const step = questions.findIndex(({ name }) => name === current) + 1
  if (result !== null) {
    return (
      <div className="space-y-2">
        <output className="block wrap-anywhere">✓ 제출됨 · {result}</output>
        <Button variant="outline" onClick={() => { setCurrent('work'); setResult(null) }}>다시 시작</Button>
      </div>
    )
  }

  return (
    <Questionnaire items={questions} defaultItem="work" onItemChange={setCurrent} onSubmit={(event) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      setResult(Array.from(data.values()).join(', '))
    }}>
      <QuestionnaireProgress aria-label="설문 진행률" aria-valuetext={`${step} / 3문항`}>{step} / 3문항</QuestionnaireProgress>
      <QuestionnaireItem name="work" required>
        <QuestionnaireTitle>주로 어떤 작업을 하나요?</QuestionnaireTitle>
        <QuestionnaireDescription>한 가지를 선택하세요. 필수 문항입니다.</QuestionnaireDescription>
        <QuestionnaireChoices><QuestionnaireChoice value="문서">문서</QuestionnaireChoice><QuestionnaireChoice value="프로젝트">프로젝트</QuestionnaireChoice></QuestionnaireChoices>
        <QuestionnaireError>! 한 가지를 선택해야 다음으로 갈 수 있습니다.</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireItem name="updates" required multiple>
        <QuestionnaireTitle>어떤 소식을 받으시겠어요?</QuestionnaireTitle>
        <QuestionnaireDescription>한 가지 이상을 고르세요.</QuestionnaireDescription>
        <QuestionnaireChoices>{['출시','팁','이벤트'].map((name) => <QuestionnaireChoice key={name} value={name}>{name}</QuestionnaireChoice>)}</QuestionnaireChoices>
        <QuestionnaireError>! 소식을 한 가지 이상 선택하세요.</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireItem name="notes">
        <QuestionnaireTitle>추가 의견이 있나요?</QuestionnaireTitle>
        <QuestionnaireDescription>이 문항은 건너뛸 수 있습니다.</QuestionnaireDescription>
        <QuestionnaireInput aria-label="추가 의견" maxLength={120} />
        <QuestionnaireError>! 의견을 입력하거나 건너뛰세요.</QuestionnaireError>
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious>이전</QuestionnairePrevious>
        <QuestionnaireSkip>건너뛰기</QuestionnaireSkip>
        <QuestionnaireNext>다음</QuestionnaireNext>
        <QuestionnaireSubmit>제출</QuestionnaireSubmit>
      </QuestionnaireActions>
    </Questionnaire>
  )
}

export function ChatComposerDemo() {
  const [message, setMessage] = useState('')
  const [attached, setAttached] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  function send() {
    const text = message.trim()
    if (!text) return
    setSent((history) => [...history, attached ? `${text} · 첨부 notes.txt` : text])
    setMessage('')
    setAttached(false)
  }
  return <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); send() }}>
    <Textarea aria-label="채팅 메시지" placeholder="Enter로 전송, Shift+Enter로 줄바꿈" value={message} maxLength={200}
      onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
        event.preventDefault()
        send()
      }} />
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => setAttached(!attached)}>{attached ? 'notes.txt 제거' : '예시 파일 첨부'}</Button>
      <Button type="submit" disabled={!message.trim()}>전송</Button>
    </div>
    {sent.length > 0 && <div role="log" aria-label="보낸 예시 메시지" className="space-y-1">
      {sent.map((text, index) => <p key={index} className="rounded border bg-white p-2 whitespace-pre-wrap wrap-anywhere">{text}</p>)}
    </div>}
  </form>
}

export function CitationDemo() {
  return <p className="leading-relaxed">
    회의 안건은 금요일까지 취합합니다.{' '}
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="xs" aria-label="근거 1 미리보기" />}>[1]</PopoverTrigger>
      <PopoverContent className="max-w-[calc(100vw-2rem)]">
        <PopoverTitle>예시 문서 · 회의록</PopoverTitle>
        <blockquote className="border-s-2 ps-2">금요일 오후까지 팀 문서에 안건을 남겨 주세요.</blockquote>
      </PopoverContent>
    </Popover>
  </p>
}
