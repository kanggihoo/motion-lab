import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table'

const sales = [
  { month: '1월', sales: 44 }, { month: '2월', sales: 57 }, { month: '3월', sales: 38 },
  { month: '4월', sales: 72 }, { month: '5월', sales: 86 },
]
const salesConfig = { sales: { label: '매출', color: '#4f46e5' } } satisfies ChartConfig

export default function SalesChart({ kind }: { kind: 'bar' | 'line' | 'area' }) {
  const Frame = kind === 'bar' ? BarChart : kind === 'line' ? LineChart : AreaChart
  return (
    <div className="space-y-2">
      <ChartContainer config={salesConfig} className="h-44 w-full min-w-0 bg-white">
        <Frame data={sales} accessibilityLayer margin={{ left: 4, right: 8, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis width={22} tickLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          {kind === 'bar' && <Bar dataKey="sales" name="매출" fill="var(--color-sales)" isAnimationActive={false} />}
          {kind === 'line' && <Line dataKey="sales" name="매출" stroke="var(--color-sales)" strokeWidth={2} isAnimationActive={false} />}
          {kind === 'area' && <Area dataKey="sales" name="매출" stroke="var(--color-sales)" fill="var(--color-sales)" fillOpacity={0.25} isAnimationActive={false} />}
        </Frame>
      </ChartContainer>
      <Table>
        <TableCaption className="sr-only">월별 매출 (만 원)</TableCaption>
        <TableHeader><TableRow><TableHead scope="col">월</TableHead><TableHead scope="col" className="text-right">매출 (만 원)</TableHead></TableRow></TableHeader>
        <TableBody>{sales.map(({ month, sales: value }) => <TableRow key={month}><TableCell>{month}</TableCell><TableCell className="text-right">{value}</TableCell></TableRow>)}</TableBody>
      </Table>
    </div>
  )
}
