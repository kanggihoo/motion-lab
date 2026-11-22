// 커넥션 풀 일정표. 모든 요청의 도착·획득·반납·타임아웃 시각을 처음에 한 번 계산한다.
// 화면은 이 일정표와 시각 t만으로 그린다 → 같은 t = 같은 화면 (역스크롤·중간 진입·새로고침 공통).
// 시간 단위는 '화면 시간'. 실제 초가 아니다 (connectionTimeout 30초와 쿼리 수 ms를 한 축척에 못 담는다).

export const POOL_SIZE = 10 // HikariCP maximumPoolSize 기본값
export const WAIT_LIMIT = 6 // connectionTimeout (기본 30초)을 화면 시간으로 축약
export const QUERY_LIMIT = 3 // 3장에서 거는 쿼리 타임아웃 (statement_timeout)

export const ENTER = 1.2 // 입구 → 대기열
export const TO_SLOT = 0.6 // 대기열 맨 앞 → 풀의 커넥션 자리
export const LANE = 0.7 // 풀 ↔ DB
export const QUERY = 0.5 // 정상 쿼리 실행
export const CANCEL_SHOW = 0.5 // 취소된 쿼리가 DB에서 ✕를 보여주는 시간

// 본문 단계. start부터 다음 단계 start까지가 그 단계의 구간이다.
// still: 움직임 줄이기에서 이 단계 동안 보여줄 정지 화면의 시각.
export const BEATS = [
  { id: 'normal', start: 0, still: 10.25, focus: 'pool', scene: '1 정상' },
  { id: 'slow', start: 14, still: 21.5, focus: 'pool', scene: '2 고갈' },
  { id: 'wait', start: 26, still: 33.4, focus: 'queue', scene: '2 고갈' },
  { id: 'db', start: 38, still: 43.4, focus: 'db', scene: '2 고갈' },
  { id: 'fix', start: 49, still: 58.5, focus: 'pool', scene: '3 완화' },
] as const
export const T_END = 65
export const FIX_AT = 49.5 // 쿼리 타임아웃 적용

export type Beat = (typeof BEATS)[number]
export const beatAt = (t: number) => Math.max(0, BEATS.findLastIndex((b) => b.start <= t))

export type Trip = {
  slow: boolean
  arrive: number // 대기열 도착 = getConnection() 호출
  ahead: number[] // 도착 순간 앞에서 기다리던 요청들이 대기열을 떠나는 시각
  leave: number // 대기열을 떠남: 커넥션을 받았거나(conn ≥ 0) 타임아웃(conn = -1)
  conn: number
  pick: number // 커넥션 자리에 도착 → 커넥션이 풀에서 빠진다
  atDb: number
  done: number // 쿼리 종료. 느린 쿼리는 취소 시각
  up: number // DB를 떠남
  release: number // 커넥션 반납
}

function arrivals() {
  const list: { at: number; slow: boolean }[] = []
  // 정상 요청: 0 이전부터 흘려서 첫 화면이 이미 돌고 있는 상태. 간격은 결정적으로 흔든다 (0.6~1.1).
  for (let i = 0, at = -8; at < T_END; i++, at += 0.6 + 0.5 * Math.abs(Math.sin(i * 7.3))) {
    list.push({ at, slow: false })
  }
  // 2장: 같은 느린 쿼리가 반복해서 들어온다. 3장: 타임아웃 아래에서 두 번 더.
  for (let i = 0; i < POOL_SIZE; i++) list.push({ at: 15 + i * 1.2, slow: true })
  list.push({ at: 54, slow: true }, { at: 58.5, slow: true })
  return list.sort((a, b) => a.at - b.at)
}

// FIFO 대기열 + 대기 한도. 도착 순서대로 처리하면 앞 요청의 운명이 이미 정해져 있어 이벤트 큐가 필요 없다.
// (가장 이른 반납 시각은 줄지 않으므로 도착 순서대로 배정하면 그대로 FIFO다. scripts/check-sim.ts가 확인)
export function simulate(): Trip[] {
  const freeAt: number[] = Array(POOL_SIZE).fill(-Infinity)
  const trips: Trip[] = []
  let slowCount = 0
  for (const { at, slow } of arrivals()) {
    const ahead = trips.filter((p) => p.leave > at).map((p) => p.leave)
    const grant = Math.max(at, Math.min(...freeAt))
    if (grant - at > WAIT_LIMIT) {
      const leave = at + WAIT_LIMIT
      trips.push({ slow, arrive: at, ahead, leave, conn: -1, pick: Infinity, atDb: Infinity, done: Infinity, up: Infinity, release: Infinity })
      continue
    }
    const conn = freeAt.findIndex((f) => f <= grant)
    const pick = grant + TO_SLOT
    const atDb = pick + LANE
    // 느린 쿼리는 타임아웃이 생길 때까지 끝나지 않는다. 적용 시점에 이미 한도를 넘긴 것들은 차례로 취소.
    const done = slow ? Math.max(atDb + QUERY_LIMIT, FIX_AT + 0.2 * slowCount++) : atDb + QUERY
    const up = slow ? done + CANCEL_SHOW : done
    const release = up + LANE
    freeAt[conn] = release
    trips.push({ slow, arrive: at, ahead, leave: grant, conn, pick, atDb, done, up, release })
  }
  return trips
}

export const trips = simulate()

export function countsAt(t: number) {
  let waiting = 0
  let inUse = 0
  let running = 0
  let timedOut = 0
  for (const p of trips) {
    if (p.arrive <= t && t < p.leave) waiting++
    if (p.pick <= t && t < p.release) inUse++
    if (p.atDb <= t && t < p.done) running++
    if (p.conn < 0 && p.leave <= t) timedOut++
  }
  return { waiting, available: POOL_SIZE - inUse, running, timedOut }
}
