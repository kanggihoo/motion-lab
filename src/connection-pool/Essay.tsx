import type { ReactNode } from 'react'
import { Scrolly } from './Scrolly'

const SRC = {
  hikari: 'https://github.com/brettwooldridge/HikariCP#frequently-used',
  hikariSource: 'https://github.com/brettwooldridge/HikariCP/blob/dev/src/main/java/com/zaxxer/hikari/pool/HikariPool.java',
  postgres: 'https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT',
}

const link = 'underline decoration-zinc-600 underline-offset-4 hover:text-zinc-100 hover:decoration-zinc-300'

// 새 탭: 같은 탭에서 열면 돌아왔을 때 스크롤(= 시각)을 잃는다
function Cite({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`text-sm text-zinc-400 ${link}`}>
      {children}
      <span className="sr-only"> (새 탭)</span>
    </a>
  )
}

const H2 = ({ children }: { children: ReactNode }) => <h2 className="text-lg font-semibold text-zinc-50 md:text-xl">{children}</h2>

const header = (
  <header className="pt-6 pb-10 md:pt-[14vh]">
    <h1 className="text-4xl font-bold tracking-tight md:text-5xl">커넥션 풀 고갈</h1>
    <p className="mt-4 text-lg break-keep text-zinc-300 md:text-xl">빌려간 커넥션이 돌아오지 않으면, 멀쩡한 요청들이 줄줄이 죽는다.</p>
    <p className="mt-4 text-sm text-zinc-400">스크롤하면 시간이 흐르고, 올리면 되감긴다.</p>
  </header>
)

const text = {
  normal: (
    <>
      <H2>1 · 정상</H2>
      <p>요청(●)은 DB에 직접 붙지 않는다. 풀에서 커넥션(□)을 빌려 쿼리를 보내고, 끝나면 돌려준다.</p>
      <p>
        풀의 커넥션 수는 정해져 있다. HikariCP 기본값은 10개. <Cite href={SRC.hikari}>HikariCP 설정</Cite>
      </p>
      <p>빌리고 돌려주는 순환이 도는 동안 가용 커넥션 수는 일정하게 유지된다.</p>
    </>
  ),
  slow: (
    <>
      <H2>2 · 고갈 — 느린 쿼리</H2>
      <p>느린 쿼리(◆)가 들어온다. 쿼리가 끝나지 않으니 커넥션도 돌아오지 않는다. 같은 쿼리가 또 오면 하나가 더 묶인다.</p>
      <p>
        이를 끊어 줄 시간 제한은 기본으로 꺼져 있다. PostgreSQL의 statement_timeout 기본값은 0, 제한 없음이다.{' '}
        <Cite href={SRC.postgres}>PostgreSQL 문서</Cite>
      </p>
    </>
  ),
  wait: (
    <>
      <H2>2 · 고갈 — 대기, 그리고 타임아웃</H2>
      <p>가용 커넥션이 0이 되면 새 요청은 풀 앞에서 기다린다. 요청을 감싼 원이 기다린 시간이다.</p>
      <p>
        기다림에는 한도가 있다. HikariCP는 connectionTimeout(기본 30초) 안에 커넥션을 못 받으면 예외를 던진다. 원이 다 차면 ✕.{' '}
        <Cite href={SRC.hikari}>HikariCP 설정</Cite>
      </p>
    </>
  ),
  db: (
    <>
      <H2>2 · 고갈 — DB는 멀쩡하다</H2>
      <p>줄은 DB가 아니라 풀 앞에 서 있다. 죽은 요청은 DB에 닿지도 못했고, 예외도 풀이 던진다.</p>
      <p>
        <code className="block rounded bg-zinc-900 px-3 py-2 font-mono text-xs leading-normal break-all text-zinc-300">
          HikariPool-1 - Connection is not available, request timed out after 30000ms (total=10, active=10, idle=0, waiting=7)
        </code>
        <Cite href={SRC.hikariSource}>HikariCP 소스 (형식 그대로, 숫자는 이 그림)</Cite>
      </p>
      <p>DB가 느려서가 아니라, 커넥션을 못 빌려서 죽었다.</p>
    </>
  ),
  fix: (
    <>
      <H2>3 · 완화 — 쿼리 타임아웃</H2>
      <p>
        쿼리에 시간 한도를 건다. PostgreSQL이라면 statement_timeout: 한도를 넘긴 쿼리는 중단된다. <Cite href={SRC.postgres}>PostgreSQL 문서</Cite>
      </p>
      <p>중단된 요청은 실패(✕)하지만 커넥션은 돌려준다. 대기열이 풀리고 순환이 다시 돈다. 이후의 느린 쿼리도 한도까지만 커넥션을 붙잡는다.</p>
    </>
  ),
}

export function Essay() {
  return (
    <>
      <a href="#summary" className="sr-only rounded bg-zinc-100 px-3 py-2 text-zinc-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
        요약으로 건너뛰기
      </a>
      <main>
        <Scrolly header={header} text={text} />

        <section id="summary" className="mx-auto max-w-2xl space-y-6 px-5 py-24 leading-relaxed break-keep text-zinc-200 md:text-lg">
          <H2>정리</H2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>풀의 커넥션 수는 고정이다. 빌려간 커넥션이 돌아오지 않으면 가용 수는 0이 된다.</li>
            <li>가용이 0이면 새 요청은 DB에 닿기 전에, 풀 앞에서 connectionTimeout을 넘겨 실패한다. 예외도 풀이 던진다.</li>
            <li>쿼리 타임아웃은 느린 쿼리를 실패시키는 대신 커넥션을 돌려받아 나머지 요청을 살린다.</li>
          </ol>
          <p className="text-sm text-zinc-400">
            그림의 시간은 압축했다. 대기 한도 30초와 짧은 쿼리를 같은 축척으로 그리면 쿼리가 보이지 않는다. 풀 크기 10은 기본값 그대로다.
          </p>

          <H2>근거</H2>
          <ul className="space-y-2 text-base">
            <li>
              <a className={link} href={SRC.hikari}>HikariCP README</a> — maximumPoolSize, connectionTimeout 기본값
            </li>
            <li>
              <a className={link} href={SRC.hikariSource}>HikariCP 소스</a> — HikariPool.createTimeoutException, 타임아웃 예외 메시지 형식
            </li>
            <li>
              <a className={link} href={SRC.postgres}>PostgreSQL 문서</a> — statement_timeout
            </li>
          </ul>

          <H2>「제작 과정」</H2>
          {/* 작업 구간마다 남긴 판단 기록(최대 3건: 입력 요지·실제 출력·처분·이유·결과 화면)으로 채운다. 지어내지 않는다 */}
          <p className="text-zinc-400">작성 중.</p>
        </section>
      </main>
    </>
  )
}
