import { useId } from 'react'
import type { DateRange } from 'react-day-picker'
import { Calendar } from './ui/calendar'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from './ui/field'
import { Input } from './ui/input'

const fields = [
  { key: 'name', label: '이름', help: '두 글자 이상으로 입력하세요.', type: 'text' },
  { key: 'email', label: '이메일', help: '@가 있는 이메일을 입력하세요.', type: 'email' },
  { key: 'password', label: '비밀번호', help: '8자 이상으로 입력하세요.', type: 'password' },
] as const

type SignupValues = Record<(typeof fields)[number]['key'], string>

export function SignupPreview({ values, onChange, errors, horizontal }: {
  values: SignupValues
  onChange: (field: keyof SignupValues, value: string) => void
  errors: Partial<SignupValues>
  horizontal: boolean
}) {
  const id = useId()
  return (
    <FieldSet>
      <FieldLegend>회원가입</FieldLegend>
      <FieldGroup>
        {fields.map(({ key, label, help, type }) => (
          <Field key={key} data-invalid={Boolean(errors[key])} orientation={horizontal ? 'horizontal' : 'vertical'}>
            <FieldLabel htmlFor={`${id}-${key}`} className="shrink-0">{label}</FieldLabel>
            <FieldContent className="min-w-0">
              <Input id={`${id}-${key}`} type={type} value={values[key]} aria-invalid={Boolean(errors[key])}
                aria-describedby={`${id}-${key}-help`} onChange={(event) => onChange(key, event.target.value)} />
              {errors[key] ? <FieldError id={`${id}-${key}-help`}>! {errors[key]}</FieldError> :
                <FieldDescription id={`${id}-${key}-help`}>{help}</FieldDescription>}
            </FieldContent>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  )
}

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' })
const monthFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' })
const weekdayFormat = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })
const month = new Date(2026, 10, 1)
const unavailable = [{ before: new Date(2026, 10, 5) }, new Date(2026, 10, 18)]
const calendarProps = {
  defaultMonth: month,
  today: new Date(2026, 10, 5),
  disabled: unavailable,
  className: 'mx-auto max-w-full rounded-lg border [--cell-size:clamp(1.4rem,6.4vw,1.75rem)]',
  formatters: {
    formatCaption: (date: Date) => monthFormat.format(date),
    formatWeekdayName: (date: Date) => weekdayFormat.format(date),
  },
  labels: {
    labelPrevious: () => '이전 달',
    labelNext: () => '다음 달',
    labelDayButton: (date: Date, modifiers: Record<string, boolean>) =>
      `${dateFormat.format(date)}${modifiers.selected ? ' · 선택됨' : ''}${modifiers.disabled ? ' · 예약 불가' : ''}`,
  },
  modifiersClassNames: { selected: 'font-bold underline underline-offset-4' },
}

export function CalendarPreview(props: { range: false; value: Date | undefined; onSelect: (date: Date | undefined) => void } |
  { range: true; value: DateRange | undefined; onSelect: (date: DateRange | undefined) => void }) {
  return props.range ?
    <Calendar {...calendarProps} mode="range" selected={props.value} onSelect={props.onSelect} excludeDisabled /> :
    <Calendar {...calendarProps} mode="single" selected={props.value} onSelect={props.onSelect} />
}
