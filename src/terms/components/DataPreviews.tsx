import type { ReactNode } from 'react'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table'
import './typeset.css'

export interface AccountRow {
  id: number
  name: string
  email: string
  date: string
}

export type AccountSort = { field: 'name' | 'date'; direction: 'ascending' | 'descending' }

export function AccountTable({ rows, sort, selected, onSort, onSelect }: {
  rows: AccountRow[]
  sort: AccountSort
  selected: ReadonlySet<number>
  onSort: (field: AccountSort['field']) => void
  onSelect: (id: number, checked: boolean) => void
}) {
  const sortLabel = (field: AccountSort['field']) => sort.field === field ? (sort.direction === 'ascending' ? ' ↑' : ' ↓') : ' ↕'

  return (
    <div className="max-h-64 overflow-auto rounded border bg-white">
      <Table className="min-w-[22rem]">
        <TableCaption className="sr-only">사용자 목록</TableCaption>
        <TableHeader><TableRow>
          <TableHead scope="col">선택</TableHead>
          <TableHead scope="col" aria-sort={sort.field === 'name' ? sort.direction : undefined}>
            <Button size="sm" variant="ghost" onClick={() => onSort('name')}>이름{sortLabel('name')}</Button>
          </TableHead>
          <TableHead scope="col">이메일</TableHead>
          <TableHead scope="col" aria-sort={sort.field === 'date' ? sort.direction : undefined}>
            <Button size="sm" variant="ghost" onClick={() => onSort('date')}>가입일{sortLabel('date')}</Button>
          </TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow key={row.id} data-state={selected.has(row.id) ? 'selected' : undefined}>
              <TableCell><Checkbox aria-label={`${row.name} 선택`} checked={selected.has(row.id)} onCheckedChange={(checked) => onSelect(row.id, checked)} /></TableCell>
              <TableCell className="font-medium">{row.name}</TableCell><TableCell>{row.email}</TableCell><TableCell>{row.date}</TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={4}>검색 결과가 없습니다.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  )
}

const orders = [['A-104','팀 플랜','결제 완료',49000],['A-105','개인 플랜','배송 중',19000],['A-106','연간 플랜','결제 완료',159000]] as const
const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })

export function OrderTable() {
  return (
    <Table className="min-w-[23rem] bg-white">
      <TableCaption className="sr-only">최근 주문</TableCaption>
      <TableHeader><TableRow>{['주문 번호', '상품', '상태', '금액'].map((name) =>
        <TableHead key={name} scope="col" className={name === '금액' ? 'text-right' : ''}>{name}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {orders.map(([id, name, status, cost]) => (
          <TableRow className="even:bg-slate-100" key={id}><TableCell>{id}</TableCell><TableCell>{name}</TableCell><TableCell>{status}</TableCell><TableCell className="text-right tabular-nums">{won.format(cost)}</TableCell></TableRow>
        ))}
      </TableBody>
      <TableFooter><TableRow><TableHead scope="row" colSpan={3}>합계</TableHead><TableCell className="text-right">{won.format(orders.reduce((sum, row) => sum + row[3], 0))}</TableCell></TableRow></TableFooter>
    </Table>
  )
}

export function TypesetPreview({ styled, large }: { styled: boolean; large: boolean }) {
  return (
    <article className={`rounded-lg border bg-white p-3 ${styled ? 'typeset' : ''} ${large && styled ? '[--typeset-size:18px] [--typeset-leading:1.85] [--typeset-flow:1.5em]' : '[--typeset-size:15px] [--typeset-leading:1.65]'}`}>
      <h3>제품 업데이트 기록</h3>
      <p>이번 업데이트에는 작업 목록을 더 쉽게 훑어보고 진행 상황을 공유하는 기능을 넣었습니다.</p>
      <h4>변경 사항</h4>
      <ul><li>요약을 상단에 표시합니다.</li><li>선택한 필터를 기억합니다.</li></ul>
      <blockquote>다음 할 일이 보이면 협업을 시작하기 쉽습니다.</blockquote>
      <p>로컬에서 <code>pnpm dev</code>로 확인해 보세요.</p>
    </article>
  )
}

export function CompareColumns({ children }: { children: ReactNode }) {
  return <div className="grid items-start gap-3 sm:grid-cols-2">{children}</div>
}
