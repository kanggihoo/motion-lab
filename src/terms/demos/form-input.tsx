import { TokenList } from "@terms/components/TokenList"
import { Card } from "@terms/components/ui/card"

import { useId, useRef, useState } from 'react'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@terms/components/ui/combobox'
import { NativeSelect, NativeSelectOption } from '@terms/components/ui/native-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@terms/components/ui/select'
import { CalendarIcon, SaveIcon, SearchIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { CalendarPreview, SignupPreview } from '@terms/components/FormPreviews'
import { Button } from '@terms/components/ui/button'
import { ButtonGroup } from '@terms/components/ui/button-group'
import { Checkbox } from '@terms/components/ui/checkbox'
import { Input } from '@terms/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from '@terms/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@terms/components/ui/input-otp'
import { Label } from '@terms/components/ui/label'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@terms/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@terms/components/ui/radio-group'
import { Slider } from '@terms/components/ui/slider'
import { Spinner } from '@terms/components/ui/spinner'
import { Switch } from '@terms/components/ui/switch'
import { Textarea } from '@terms/components/ui/textarea'
import { Toggle } from '@terms/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@terms/components/ui/toggle-group'


const sortOptions = [{ value: 'recent', label: '최신' }, { value: 'popular', label: '인기' }, { value: 'name', label: '이름' }]
const posts = [
  { name: '디자인 시스템', date: 12, likes: 18 },
  { name: '개발 가이드', date: 8, likes: 24 },
  { name: '팀 협업', date: 21, likes: 12 },
]
const sortPosts: Record<string, (a: typeof posts[number], b: typeof posts[number]) => number> = {
  recent: (a, b) => b.date - a.date,
  popular: (a, b) => b.likes - a.likes,
  name: (a, b) => a.name.localeCompare(b.name, 'ko'),
}

export function SelectDemo() {
  const [sort, setSort] = useState('recent')
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <p>shadcn Select</p>
          <Select items={sortOptions} value={sort} onValueChange={(value) => value && setSort(value)}>
            <SelectTrigger aria-label="shadcn 정렬 기준"><SelectValue /></SelectTrigger>
            <SelectContent>{sortOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className="flex flex-col gap-1">Native Select
          <NativeSelect value={sort} onChange={(event) => setSort(event.target.value)}>
            {sortOptions.map(({ value, label }) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}
          </NativeSelect>
        </label>
      </div>
      <ol className="list-decimal space-y-1 pl-5" aria-label="정렬된 문서" aria-live="polite">
        {posts.toSorted(sortPosts[sort]).map(({ name, date, likes }) => <li key={name}>{name} · 11/{date} · 좋아요 {likes}</li>)}
      </ol>
    </div>
  )
}

const cities = ['서울', '서울특별시 중구', '서울특별시 종로구', '부산', '부산광역시 해운대구', '대전', '대구', '인천', '광주']

export function ComboboxDemo() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-2">
      <Combobox items={cities} value={selected} onValueChange={setSelected}
        open={open && query.trim().length >= 2} onOpenChange={setOpen}
        onInputValueChange={(value, details) => {
          setQuery(value)
          if (details.reason === 'input-change') setOpen(value.trim().length >= 2)
        }}>
        <ComboboxInput aria-label="도시 이름" placeholder="도시 이름 두 글자부터" showTrigger={false} />
        <ComboboxContent>
          <ComboboxEmpty>일치하는 도시가 없습니다.</ComboboxEmpty>
          <ComboboxList>{(city: string) => <ComboboxItem key={city} value={city}>{city}</ComboboxItem>}</ComboboxList>
        </ComboboxContent>
      </Combobox>
      <output className="block">선택 도시 · {selected ?? '선택 전'}</output>
    </div>
  )
}

const buttonVariants = [
  ['default', '기본'], ['secondary', '보조'], ['outline', '외곽선'],
  ['ghost', '고스트'], ['link', '링크'], ['destructive', '위험'],
] as const
const buttonSizes = [['sm', '작게'], ['default', '보통'], ['lg', '크게']] as const

export function ButtonDemo() {
  const [status, setStatus] = useState('누른 버튼이 없습니다.')
  const [loading, setLoading] = useState(false)
  return (
    <div className="space-y-2">
      <table className="w-full text-center">
        <caption className="sr-only">Button variant와 크기</caption>
        <thead><tr><th scope="col">스타일</th>{buttonSizes.map(([size, label]) => <th scope="col" key={size}>{label}</th>)}</tr></thead>
        <tbody>{buttonVariants.map(([variant, label]) => (
          <tr key={variant}><th scope="row">{label}</th>{buttonSizes.map(([size, sizeLabel]) => (
            <td key={size} className="p-0.5"><Button variant={variant} size={size} onClick={() => setStatus(`${label} · ${sizeLabel}`)}>{label}</Button></td>
          ))}</tr>
        ))}</tbody>
      </table>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="icon" aria-label="저장 아이콘" onClick={() => setStatus('아이콘 버튼 · 저장')}><SaveIcon aria-hidden /></Button>
        <Button disabled>비활성</Button>
        <Button variant="secondary" aria-pressed={loading} onClick={() => setLoading(!loading)}>
          {loading && <Spinner aria-hidden />} {loading ? '로딩 중 · 중지' : '로딩 상태 보기'}
        </Button>
      </div>
      <output className="block">{status}</output>
    </div>
  )
}

export function ButtonGroupDemo() {
  const [action, setAction] = useState('명령 대기')
  const [value, setValue] = useState('')
  const commands = ['복사', '붙여넣기', '잘라내기'].map((name) =>
    <Button size="sm" variant="outline" key={name} onClick={() => setAction(`${name} 실행`)}>{name}</Button>)
  return (
    <div className="space-y-2">
      <p>개별 버튼</p><div className="flex flex-wrap gap-2">{commands}</div>
      <p>Button Group</p><ButtonGroup aria-label="편집 명령">{commands}</ButtonGroup>
      <ButtonGroup aria-label="검색 입력과 버튼" className="max-w-full">
        <Input aria-label="검색어" value={value} onChange={(event) => setValue(event.target.value)} />
        <Button onClick={() => setAction(`검색 · ${value || '전체'}`)}>검색</Button>
      </ButtonGroup>
      <output className="block">{action}</output>
    </div>
  )
}

const formatting = [['B','굵게'], ['I','기울임'], ['U','밑줄']] as const

export function ToggleDemo() {
  const [flags, setFlags] = useState<string[]>([])
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">{formatting.map(([symbol, name]) => (
        <Toggle key={symbol} variant="outline" aria-label={name} pressed={flags.includes(symbol)} onPressedChange={(next) =>
          setFlags((previous) => next ? [...previous, symbol] : previous.filter((item) => item !== symbol))}>
          {symbol} {flags.includes(symbol) ? '켜짐' : '꺼짐'}
        </Toggle>
      ))}</div>
      <p className={`${flags.includes('B') ? 'font-bold' : ''} ${flags.includes('I') ? 'italic' : ''} ${flags.includes('U') ? 'underline' : ''}`}>선택한 서식을 적용한 예시입니다.</p>
    </div>
  )
}

export function ToggleGroupDemo() {
  const [multi, setMulti] = useState(false)
  const [alignment, setAlignment] = useState<string[]>(['왼쪽'])
  const [style, setStyle] = useState<string[]>([])
  const values = multi ? style : alignment
  const choices = multi ? ['굵게','기울임','밑줄'] : ['왼쪽','가운데','오른쪽']
  return (
    <div className="space-y-2">
      <label><input type="checkbox" checked={multi} onChange={(event) => setMulti(event.target.checked)} /> 여러 서식 선택</label>
      <ToggleGroup key={String(multi)} multiple={multi} value={values} onValueChange={(next) => {
        if (multi) setStyle(next)
        else if (next.length) setAlignment(next)
      }} variant="outline" aria-label={multi ? '서식' : '정렬'}>
        {choices.map((option) => <ToggleGroupItem key={option} value={option} size="sm">{option}</ToggleGroupItem>)}
      </ToggleGroup>
      <output className="block">선택 · {values.join(', ') || '없음'}</output>
    </div>
  )
}

const inputTypes = [
  ['email','이메일 · @ 키'], ['password','비밀번호 · 글자 숨김'],
  ['number','숫자 · 숫자 키패드'], ['search','검색 · 검색 키'],
] as const

export function InputDemo() {
  const id = useId()
  return (
    <div className="grid grid-cols-2 gap-2">
      {inputTypes.map(([type, label]) => <label className="min-w-0" key={type}>{label}<Input type={type} className="mt-1" /></label>)}
      <label htmlFor={`${id}-disabled`}>비활성<Input id={`${id}-disabled`} disabled placeholder="입력 불가" /></label>
      <label htmlFor={`${id}-invalid`}>오류 · @ 누락<Input id={`${id}-invalid`} type="email" aria-invalid defaultValue="name" /></label>
    </div>
  )
}

export function InputGroupDemo() {
  const [address, setAddress] = useState('example.com')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  return (
    <div className="space-y-2">
      <InputGroup>
        <InputGroupInput aria-label="검색" placeholder="검색" />
        <InputGroupAddon><SearchIcon aria-hidden /></InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="URL 주소" value={address} onChange={(event) => setAddress(event.target.value)} />
        <InputGroupAddon><InputGroupText>https://</InputGroupText></InputGroupAddon>
        <InputGroupAddon align="inline-end"><InputGroupButton onClick={async () => {
          try {
            await navigator.clipboard.writeText(`https://${address}`)
            setStatus('주소를 복사했습니다.')
          } catch {
            setStatus('주소를 복사할 수 없습니다.')
          }
        }}>복사</InputGroupButton></InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="채팅 입력" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="메시지" />
        <InputGroupAddon align="inline-end"><InputGroupButton disabled={!message.trim()} onClick={() => { setStatus(`전송 · ${message}`); setMessage('') }}>전송</InputGroupButton></InputGroupAddon>
      </InputGroup>
      <output className="block wrap-anywhere">{status}</output>
    </div>
  )
}

export function OtpDemo() {
  const [value, setValue] = useState('')
  return (
    <div className="space-y-2">
      <InputOTP aria-label="6자리 인증번호" maxLength={6} value={value} onChange={setValue} pattern="[0-9]*" inputMode="numeric">
        <InputOTPGroup>{Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup>
      </InputOTP>
      <p>연습 코드 · <code>123456</code></p>
      <output className="block">{value.length === 6 ? '✓ 입력 완료 · 제출됨' : `${value.length} / 6자리`}</output>
    </div>
  )
}

export function TextareaDemo() {
  const id = useId()
  const [text, setText] = useState('')
  return (
    <div className="grid grid-cols-2 items-start gap-2">
      <label htmlFor={`${id}-fixed`}>고정 높이<Textarea id={`${id}-fixed`} value={text} maxLength={500} onChange={(event) => setText(event.target.value)} className="h-20 resize-none [field-sizing:fixed]" /></label>
      <label htmlFor={`${id}-auto`}>자동 높이<Textarea id={`${id}-auto`} value={text} maxLength={500} onChange={(event) => setText(event.target.value)} className="min-h-20 resize-none [field-sizing:content]" /></label>
      <output className="col-span-2">{text.length} / 500자</output>
    </div>
  )
}

export function LabelDemo() {
  const inputId = useId()

  return (
    <div className="space-y-2">
      <div className="space-y-1"><Label htmlFor={inputId}>연결된 이름표</Label><Input id={inputId} /></div>
      <div className="space-y-1"><span className="text-sm font-medium">연결되지 않은 이름표</span><Input aria-label="연결되지 않은 예시 입력" /></div>
    </div>
  )
}

export function FieldDemo() {
  const [horizontal, setHorizontal] = useState(false)
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [validating, setValidating] = useState(false)
  const errors = validating ? {
    name: values.name.trim().length < 2 ? '이름을 두 글자 이상 입력하세요.' : undefined,
    email: !/^.+@.+\..+$/.test(values.email) ? '이메일 형식을 확인하세요.' : undefined,
    password: values.password.length < 8 ? '비밀번호를 8자 이상 입력하세요.' : undefined,
  } : {}
  return (
    <form noValidate className="space-y-3" onSubmit={(event) => { event.preventDefault(); setValidating(true) }}>
      <label><input type="checkbox" checked={horizontal} onChange={(event) => setHorizontal(event.target.checked)} /> 가로로 배치</label>
      <SignupPreview values={values} horizontal={horizontal} errors={errors} onChange={(field, value) => setValues((previous) => ({ ...previous, [field]: value }))} />
      <Button type="submit">검증</Button>
      {validating && !Object.values(errors).some(Boolean) && <output className="ml-2">✓ 입력 확인</output>}
    </form>
  )
}

const subscriptions = ['업데이트', '기능 소식', '이벤트']

export function CheckboxDemo() {
  const [selected, setSelected] = useState<string[]>([])
  const mixed = selected.length > 0 && selected.length < subscriptions.length
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">소식 구독 선택</legend>
      <label className="flex items-center gap-2">
        <Checkbox checked={selected.length === subscriptions.length} indeterminate={mixed}
          onCheckedChange={() => setSelected(selected.length === subscriptions.length ? [] : subscriptions)}
          aria-label="전체 선택" className="data-indeterminate:border-primary data-indeterminate:after:content-['−'] data-indeterminate:after:static [&[data-indeterminate]_svg]:hidden" />
        전체 선택 {mixed && '(− 일부 선택)'}
      </label>
      {subscriptions.map((item) => (
        <label className="flex items-center gap-2 pl-3" key={item}>
          <Checkbox aria-label={item} checked={selected.includes(item)} onCheckedChange={(checked) =>
            setSelected((previous) => checked ? [...previous, item] : previous.filter((name) => item !== name))} />{item}
        </label>
      ))}
    </fieldset>
  )
}

const delivery = [
  ['일반 배송', '2~3일 소요'], ['빠른 배송', '다음 날 도착'], ['방문 수령', '매장에서 직접 수령'],
] as const

export function RadioGroupDemo() {
  const [selected, setSelected] = useState('일반 배송')
  return (
    <div className="space-y-2">
      <RadioGroup value={selected} onValueChange={setSelected} aria-label="배송 방법">
        {delivery.map(([name, description]) => (
          <label className="flex items-center gap-2" key={name}><RadioGroupItem aria-label={name} value={name} /><span>{name} · {description}</span></label>
        ))}
      </RadioGroup>
      <label className="block">Select 비교 <NativeSelect value={selected} onChange={(event) => setSelected(event.target.value)}>
        {delivery.map(([name]) => <NativeSelectOption key={name}>{name}</NativeSelectOption>)}
      </NativeSelect></label>
    </div>
  )
}

export function SwitchDemo() {
  const id = useId()
  const [on, setOn] = useState(false)
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2"><Switch aria-label="알림 받기" checked={on} onCheckedChange={setOn} /> 알림 받기 · {on ? '켜짐' : '꺼짐'}</label>
      <label htmlFor={id}>알림 수신 주소 <Input id={id} type="email" disabled={!on} placeholder="name@example.com" /></label>
    </div>
  )
}

export function SliderDemo() {
  const [volume, setVolume] = useState([40])
  const [price, setPrice] = useState([20, 65])
  return (
    <div className="space-y-4 px-2 py-1">
      <div className="space-y-3">
        <output className="block">음량 · {volume[0]}%</output>
        <Slider value={volume} onValueChange={(value) => setVolume(typeof value === 'number' ? [value] : [...value])} getAriaLabel={() => '음량'} largeStep={10} />
      </div>
      <div className="space-y-3">
        <output className="block">가격 · {price[0]}~{price[1]}만 원</output>
        <Slider value={price} onValueChange={(value) => { if (typeof value !== 'number') setPrice([...value]) }} getAriaLabel={(index) => index === 0 ? '최소 가격' : '최대 가격'} largeStep={10} minStepsBetweenValues={1} />
      </div>
    </div>
  )
}

const dateDisplay = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' })

function rangeLabel(range: DateRange | undefined) {
  if (!range?.from) return '선택 전'
  return range.to ? dateDisplay.formatRange(range.from, range.to) : `${dateDisplay.format(range.from)}부터`
}

export function CalendarDemo() {
  const [range, setRange] = useState(false)
  const [day, setDay] = useState<Date | undefined>()
  const [days, setDays] = useState<DateRange | undefined>()
  return (
    <div className="space-y-2">
      <label><input type="checkbox" checked={range} onChange={(event) => setRange(event.target.checked)} /> 기간 선택</label>
      {range ? <CalendarPreview range value={days} onSelect={setDays} /> : <CalendarPreview range={false} value={day} onSelect={setDay} />}
      <output className="block">{range ? rangeLabel(days) : day ? dateDisplay.format(day) : '선택 전'} · 11월 18일 예약 불가</output>
    </div>
  )
}

export function DatePickerDemo() {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [useRange, setUseRange] = useState(false)
  const [day, setDay] = useState<Date | undefined>()
  const [days, setDays] = useState<DateRange | undefined>()
  const caption = useRange ? (days?.from ? rangeLabel(days) : '기간 선택') : (day ? dateDisplay.format(day) : '날짜 선택')
  return (
    <div className="space-y-2">
      <label className="block"><input type="checkbox" checked={useRange} onChange={(event) => setUseRange(event.target.checked)} /> 기간 버전</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" />}><CalendarIcon aria-hidden />{caption}</PopoverTrigger>
        <PopoverContent className="w-fit max-w-[calc(100vw-1.5rem)] p-2">
          <PopoverTitle className="sr-only">날짜 선택 달력</PopoverTitle>
          {useRange ? <CalendarPreview range value={days} onSelect={setDays} /> :
            <CalendarPreview range={false} value={day} onSelect={(next) => { setDay(next); if (next) setOpen(false) }} />}
        </PopoverContent>
      </Popover>
      <label htmlFor={id} className="block space-y-1">네이티브 날짜 입력<Input id={id} type="date" className="block max-w-full" /></label>
    </div>
  )
}

const subjects = ['제품 소식', '보안 알림', '이벤트']
export function MultiSelectorDemo() {
  const [choices, setChoices] = useState<string[]>([])
  return <fieldset className="space-y-2">
    <legend className="font-semibold">알림 주제</legend>
    {subjects.map((item) => <label key={item} className="flex items-center gap-2">
      <Checkbox aria-label={item} checked={choices.includes(item)} onCheckedChange={(checked) =>
        setChoices((previous) => checked ? [...previous, item] : previous.filter((name) => name !== item))} />{item}
    </label>)}
    <output className="block">{choices.length}개 선택 · {choices.join(', ') || '없음'}</output>
  </fieldset>
}

export function TokenizerDemo() {
  const [tokens, setTokens] = useState(['디자인'])
  const [value, setValue] = useState('')
  return <form className="space-y-2" onSubmit={(event) => {
    event.preventDefault()
    const token = value.trim()
    if (token && !tokens.includes(token)) { setTokens([...tokens, token]); setValue('') }
  }}>
    <TokenList tokens={tokens} remove={(token) => setTokens(tokens.filter((item) => item !== token))} />
    <div className="flex items-center gap-2">
      <Input aria-label="새 태그" placeholder="태그 입력 후 Enter" value={value} maxLength={40} onChange={(event) => setValue(event.target.value)} />
      <Button type="submit">추가</Button>
    </div>
  </form>
}

function boundQuantity(n: number) { return Math.max(0, Math.min(10, n)) }
export function NumberInputDemo() {
  const [value, setValue] = useState('2')
  const quantity = Number(value)
  return <div className="space-y-2">
    <ButtonGroup aria-label="수량 조절">
      <Button variant="outline" aria-label="수량 줄이기" disabled={quantity <= 0} onClick={() => setValue(String(boundQuantity(quantity - 1)))}>−</Button>
      <Input type="number" min={0} max={10} step={1} aria-label="수량" className="w-20" value={value}
        onChange={(event) => setValue(event.target.value)} onBlur={() => setValue(String(boundQuantity(Math.round(quantity))))} />
      <Button variant="outline" aria-label="수량 늘리기" disabled={quantity >= 10} onClick={() => setValue(String(boundQuantity(quantity + 1)))}>+</Button>
    </ButtonGroup>
    <p>허용 범위 · 0~10</p>
  </div>
}

export function FileInputDemo() {
  const [files, setFiles] = useState<File[]>([])
  const id = useId()
  return <div className="space-y-2">
    <div className="rounded-lg border border-dashed bg-white p-3" onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); setFiles(Array.from(event.dataTransfer.files)) }}>
      <Label htmlFor={id} className="mb-2 block">파일을 놓거나 선택하세요</Label>
      <Input id={id} type="file" multiple className="h-auto max-w-full"
        onChange={(event) => { setFiles(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = '' }} />
    </div>
    <ul className="space-y-1">
      {files.map((file, index) => <li className="flex flex-wrap items-center gap-2" key={index}>
        <span className="wrap-anywhere">{file.name} · {file.size.toLocaleString('ko-KR')}바이트</span>
        <Button size="sm" variant="outline" aria-label={`${file.name} 제거`} onClick={() => setFiles(files.filter((_, i) => i !== index))}>제거</Button>
      </li>)}
    </ul>
  </div>
}

const searchableDocuments = [{ name: '디자인 가이드', state: '공개' }, { name: '디자인 초안', state: '초안' }, { name: '보안 정책', state: '공개' }]

export function PowerSearchDemo() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState('')
  const matches = searchableDocuments.filter((doc) => doc.name.includes(query.trim()) && (!state || state === doc.state))
  return <div className="space-y-2">
    <Input type="search" aria-label="문서 이름 필터" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문서 이름" />
    <label>공개 상태 <select value={state} onChange={(event) => setState(event.target.value)}><option value="">모두</option><option>공개</option><option>초안</option></select></label>
    <output className="block">{matches.length}건</output>
    <ul className="space-y-1">{matches.map((doc) => <li key={doc.name}>{doc.name} · {doc.state}</li>)}</ul>
  </div>
}

export function RichTextEditorDemo() {
  const editor = useRef<HTMLDivElement>(null)
  const range = useRef<Range>(null)
  function format(command: 'bold' | 'formatBlock', value?: string) {
    editor.current?.focus()
    if (range.current && editor.current?.contains(range.current.commonAncestorContainer)) {
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range.current)
    }
    document.execCommand(command, false, value)
  }
  return <div className="space-y-2">
    <ButtonGroup aria-label="메모 서식">
      <Button variant="outline" onClick={() => format('bold')}>굵게</Button>
      <Button variant="outline" onClick={() => format('formatBlock', 'h4')}>제목</Button>
    </ButtonGroup>
    <div ref={editor} aria-label="서식 메모" contentEditable suppressContentEditableWarning
      className="min-h-24 rounded border bg-white p-3 wrap-anywhere [&_h4]:text-lg [&_h4]:font-semibold"
      onBlur={() => {
        const selection = window.getSelection()
        if (selection?.rangeCount) range.current = selection.getRangeAt(0).cloneRange()
      }}
      onPaste={(event) => { event.preventDefault(); document.execCommand('insertText', false, event.clipboardData.getData('text/plain')) }}>
      메모를 입력하거나 선택해 서식을 적용하세요.
    </div>
  </div>
}

export function SelectableCardDemo() {
  const [plan, setPlan] = useState('개인')
  const id = useId()
  return <RadioGroup aria-label="요금제" value={plan} onValueChange={setPlan}>
    {['개인', '팀'].map((name, index) => <Card key={name} className="relative flex-row items-center gap-2 p-3">
      <RadioGroupItem id={`${id}-${index}`} aria-label={name} value={name} />
      <label htmlFor={`${id}-${index}`} className="cursor-pointer after:absolute after:inset-0">
        <strong>{name}{name === plan ? ' · 선택됨' : ''}</strong><span className="block">{name === '개인' ? '개별 작업에 적합' : '공동 작업에 적합'}</span>
      </label>
    </Card>)}
  </RadioGroup>
}
