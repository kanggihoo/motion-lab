import { previewPicture } from "@terms/components/preview-picture"

import { Avatar, AvatarFallback } from "@terms/components/ui/avatar"

import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { CircleHelpIcon } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from '@terms/components/ui/alert-dialog'
import { Button } from '@terms/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@terms/components/ui/dialog'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@terms/components/ui/drawer'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@terms/components/ui/hover-card'
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@terms/components/ui/popover'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@terms/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@terms/components/ui/tooltip'
import { useReducedMotion } from '@terms/lib/motion'
import { termHash } from '@terms/lib/term-hash'

function wrapDialogTab(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return
  const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (!first || !last || event.target !== (event.shiftKey ? first : last)) return
  event.preventDefault()
  if (event.shiftKey) last.focus()
  else first.focus()
}

export function ModalDemo() {
  const [alertOpen, setAlertOpen] = useState(false)
  const [focused, setFocused] = useState('')
  const [status, setStatus] = useState('문서가 있습니다.')
  const cancel = useRef<HTMLButtonElement>(null)
  const alertCancel = useRef<HTMLButtonElement>(null)
  function showFocused(event: FocusEvent<HTMLElement>) {
    if (event.target instanceof HTMLButtonElement) setFocused(event.target.textContent)
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>삭제</DialogTrigger>
          <DialogContent initialFocus={cancel} showCloseButton={false} onFocusCapture={showFocused} onKeyDown={wrapDialogTab}>
            <DialogTitle>문서를 삭제할까요?</DialogTitle>
            <DialogDescription>Tab으로 포커스를 옮겨 보세요. 배경 클릭, Esc 또는 취소로 닫을 수 있습니다.</DialogDescription>
            <p className="text-sm" aria-live="polite">창 내부 포커스 · {focused}</p>
            <DialogFooter>
              <DialogClose ref={cancel} render={<Button variant="outline" />}>취소</DialogClose>
              <DialogClose render={<Button variant="destructive" />} onClick={() => setStatus('문서를 삭제했습니다.')}>삭제 확인</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogTrigger render={<Button variant="outline" />}>Alert Dialog 비교</AlertDialogTrigger>
          <AlertDialogContent initialFocus={alertCancel} onFocusCapture={showFocused} onKeyDown={wrapDialogTab}>
            <AlertDialogTitle>문서를 영구 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>Alert Dialog는 바깥을 눌러도 닫히지 않습니다. 취소하거나 삭제를 확인하세요.</AlertDialogDescription>
            <p className="text-sm" aria-live="polite">창 내부 포커스 · {focused}</p>
            <AlertDialogFooter>
              <AlertDialogCancel ref={alertCancel}>취소</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => {
                setStatus('문서를 영구 삭제했습니다.')
                setAlertOpen(false)
              }}>삭제 확인</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <output className="block">{status}</output>
    </div>
  )
}

export function DrawerDemo() {
  const [mobile, setMobile] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const reduced = useReducedMotion()
  const settings = <label className="flex items-center gap-2"><input type="checkbox" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} /> 알림 받기</label>
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2"><input type="checkbox" checked={mobile} onChange={(event) => setMobile(event.target.checked)} /> 모바일 Bottom Sheet 보기</label>
      {mobile ? (
        <Drawer showSwipeHandle={!reduced} swipeDirection="down" onOpenChange={(_open, details) => {
          if (reduced && details.reason === 'swipe') details.cancel()
        }}>
          <DrawerTrigger render={<Button />}>설정 · 아래</DrawerTrigger>
          <DrawerContent onKeyDown={wrapDialogTab}>
            <div className="mx-auto w-full max-w-lg">
              <DrawerHeader><DrawerTitle>설정</DrawerTitle><DrawerDescription>아래에서 열리는 Bottom Sheet입니다.</DrawerDescription></DrawerHeader>
              <div className="px-4">{settings}</div>
              <DrawerFooter><DrawerClose render={<Button variant="outline" />}>닫기</DrawerClose></DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet>
          <SheetTrigger render={<Button />}>설정 · 오른쪽</SheetTrigger>
          <SheetContent side="right" showCloseButton={false} onKeyDown={wrapDialogTab}>
            <SheetHeader><SheetTitle>설정</SheetTitle><SheetDescription>오른쪽에서 열리는 Sheet입니다.</SheetDescription></SheetHeader>
            <div className="px-4">{settings}</div>
            <SheetFooter><SheetClose render={<Button variant="outline" />}>닫기</SheetClose></SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}

export function PopoverDemo() {
  const [message, setMessage] = useState('')
  return (
    <div className="flex flex-wrap gap-2">
      <Popover>
        <PopoverTrigger render={<Button />}>공유 · Popover</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>카드 공유</PopoverTitle>
          <PopoverDescription>공유 방법을 선택하세요.</PopoverDescription>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={async () => {
              const url = new URL(termHash('ui', 'overlay', 'popover'), location.href)
              try {
                await navigator.clipboard.writeText(url.href)
                setMessage('링크를 복사했습니다.')
              } catch {
                setMessage('링크를 복사할 수 없습니다.')
              }
            }}>링크 복사</Button>
            <a href="mailto:?subject=Popover%20%EB%8D%B0%EB%AA%A8" className="inline-flex h-8 items-center rounded-lg border px-2.5">이메일</a>
          </div>
          <output className="block">{message}</output>
        </PopoverContent>
      </Popover>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>설명 · Tooltip</TooltipTrigger>
        <TooltipContent>카드를 다른 사람에게 공유하는 기능입니다.</TooltipContent>
      </Tooltip>
      <HoverCard>
        <HoverCardTrigger href={termHash('ui', 'overlay', 'tooltip')} className="inline-flex h-8 items-center rounded-lg border bg-white px-2.5">미리보기 · Hover Card</HoverCardTrigger>
        <HoverCardContent className="max-w-[calc(100vw-2rem)]">
          <strong>Tooltip 카드 미리보기</strong>
          <p>버튼의 뜻을 잠깐 설명하는 작은 창입니다.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}

export function TooltipDemo() {
  return (
    <div className="flex items-center gap-2">
      <span>팀 알림</span>
      <Tooltip disableHoverablePopup={false}>
        <TooltipTrigger render={<Button variant="outline" size="icon-sm" aria-label="팀 알림 도움말" />}><CircleHelpIcon aria-hidden /></TooltipTrigger>
        <TooltipContent className="max-w-[calc(100vw-2rem)]">팀원의 새 작업이나 피드백이 등록되면 알림을 받습니다.</TooltipContent>
      </Tooltip>
    </div>
  )
}

export function HoverCardDemo() {
  const [show, setShow] = useState(false)
  const profile = (
    <div className="flex items-start gap-2">
      <Avatar aria-hidden><AvatarFallback>민</AvatarFallback></Avatar>
      <div><strong>@민서</strong><p>제품 디자이너 · 팔로워 28명</p></div>
    </div>
  )
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <HoverCard>
          <HoverCardTrigger href="#ui/overlay/hover-card" delay={500} onClick={(event) => { event.preventDefault(); setShow(!show) }} className="term-link">@민서 · Hover Card</HoverCardTrigger>
          <HoverCardContent>{profile}</HoverCardContent>
        </HoverCard>
        <Tooltip><TooltipTrigger render={<Button variant="outline" size="sm" />}>Tooltip</TooltipTrigger><TooltipContent>작성자입니다.</TooltipContent></Tooltip>
        <Popover><PopoverTrigger render={<Button variant="outline" size="sm" />}>Popover</PopoverTrigger>
          <PopoverContent><PopoverTitle>작성자 옵션</PopoverTitle><Button variant="outline" onClick={() => setShow(!show)}>프로필 전환</Button></PopoverContent>
        </Popover>
      </div>
      {show && <div className="rounded-lg border bg-white p-2">{profile}</div>}
    </div>
  )
}

const gallery = ['푸른 능선', '해 질 무렵']
export function LightboxDemo() {
  const [photo, setPhoto] = useState(0)
  const previous = useRef<HTMLButtonElement>(null)
  const url = (index: number) => index === 0 ? previewPicture : previewPicture.replace('%234338ca', '%23b45309')

  return <Dialog>
    <DialogTrigger render={<Button variant="outline" className="h-auto flex-col p-2" />}>
      <img src={url(0)} alt="" className="w-28 rounded" /> 사진 확대
    </DialogTrigger>
    <DialogContent showCloseButton={false} initialFocus={previous} onKeyDown={wrapDialogTab}>
      <DialogTitle>{gallery[photo]}</DialogTitle>
      <DialogDescription>사진 {photo + 1} / {gallery.length}</DialogDescription>
      <img src={url(photo)} alt={gallery[photo]} className="w-full rounded" />
      <DialogFooter>
        <Button ref={previous} variant="outline" onClick={() => setPhoto((photo + gallery.length - 1) % gallery.length)}>이전</Button>
        <Button variant="outline" onClick={() => setPhoto((photo + 1) % gallery.length)}>다음</Button>
        <DialogClose render={<Button />}>닫기</DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
