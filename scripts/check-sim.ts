// 일정표 불변식. 실행: pnpm check
import assert from 'node:assert/strict'
import { BEATS, CANCEL_SHOW, FIX_AT, LANE, POOL_SIZE, T_END, WAIT_LIMIT, countsAt, simulate, trips } from '../src/connection-pool/sim.ts'

// 커넥션 하나를 두 요청이 겹쳐 쥐지 않는다
for (let k = 0; k < POOL_SIZE; k++) {
  const held = trips.filter((p) => p.conn === k)
  held.forEach((p, i) => i === 0 || assert.ok(p.leave >= held[i - 1]!.release, `커넥션 ${k} 중복 대여`))
}

// FIFO: 도착 순서대로 대기열을 떠나고, 대기는 한도를 넘지 않는다
trips.forEach((p, i) => {
  assert.ok(p.leave - p.arrive <= WAIT_LIMIT + 1e-9, `대기 한도 초과 @${p.arrive}`)
  assert.ok(i === 0 || p.leave >= trips[i - 1]!.leave, `FIFO 위반 @${p.arrive}`)
})

// 장면별 이야기가 성립한다
const start = (id: string) => BEATS.find((b) => b.id === id)!.start
const sample = (a: number, b: number) => Array.from({ length: (b - a) * 10 }, (_, i) => countsAt(a + i / 10))
assert.ok(sample(0, start('slow')).every((c) => c.waiting === 0 && c.available > 0), '1장: 대기 없이 순환')
assert.ok(sample(start('wait'), FIX_AT).some((c) => c.available === 0 && c.timedOut > 0), '2장: 고갈 + 타임아웃')
assert.ok(sample(start('db'), FIX_AT).every((c) => c.running === POOL_SIZE), '2장: DB는 느린 쿼리 10개만 실행')
// 취소된 첫 커넥션이 돌아온 뒤로는 아무도 타임아웃되지 않는다
assert.ok(trips.every((p) => p.conn >= 0 || p.leave < FIX_AT + CANCEL_SHOW + LANE), '3장: 타임아웃이 멈춘다')
assert.ok(sample(T_END - 8, T_END).every((c) => c.waiting === 0), '3장: 대기열 해소')

// 결정적: 다시 계산해도 같은 일정표 → 새로고침해도 같은 화면
assert.deepEqual(simulate(), trips)

console.log(`sim ok: ${trips.length} trips`)
