# 용어 대시보드 Motion·Camera·Edit·Look 섹션 decisions

Glossary: [GLOSSARY.md](../../../GLOSSARY.md) · ADRs: [0001](../../adr/0001-terms-3d-shared-scene.md)

## D-1 범위와 iteration 나누기
- Status: settled
- Decision: 이번 iteration은 Motion·Camera·Edit·Look 네 섹션을 표현할 구조를 코드로 만들고, 섹션마다 대표 카드 하나로 그 구조를 증명한다. 대표 카드는 Motion · Scroll · Scroll Scrub, Camera · Movement · Dolly Zoom, Edit · Transition · Dissolve, Look · Color & Light · Selective Color다. 사용자가 네 장을 직접 보고 구조를 확인한 뒤, 필요한 결정을 이 파일에 더하고 spec.md와 AC를 쓴다. 나머지 81장은 그 spec으로 같은 slug의 다음 iteration에서 채운다.
- Rejected: 대표 카드 단계에서 spec과 AC를 먼저 쓰기 → 아직 만들어 보지 않은 구조에 합격선을 긋게 된다(사용자 결정, 2026-11-24) · 네 섹션 85장을 한 iteration으로 구현 → 사용자의 목적은 표현 구조를 잡는 것이고, 85장이 모두 끝나야 완료가 된다 · 문서로만 구조 확정 → canvas 한도나 내부 스크롤러 같은 구조 결정이 검증되지 않는다 · 섹션마다 slug 분리 → 3D 장면 결정이 여러 slug에 흩어진다

## D-2 섹션 내비게이션
- Status: settled
- Decision: 헤더에 섹션 6개를 평평하게 둔다. 순서는 UI · Motion · Style · Camera · Edit · Look으로 `docs/terms/README.md` 섹션 표와 같다.
- Rejected: 「웹」·「영상」 두 묶음으로 나누기 → 묶음 이름을 새로 만들 이유가 아직 없다
- Reuse: `src/terms/data/index.ts#sectionOrder` (modify) — 여섯 섹션 순서를 담는다

## D-3 카드 데이터 형태
- Status: settled
- Decision: 카드에 선택 필드 두 개를 더한다. 「촬영·편집」(Camera·Edit·Look 문서의 촬영·편집 구현)과 「이 저장소의 예」(Motion 문서의 에세이 위치)이고, 카드에서 각각 별도 항목으로 보인다. 기존 구현 필드는 웹 데모 구현을 담는다.
- Rejected: 두 내용을 구현 문자열 하나에 합치기 → 「촬영에서는 이렇게, 웹에서는 이렇게」 비교가 묻힌다
- Reuse: `src/terms/data/types.ts#Term` (modify) — 선택 필드 두 개만 추가한다 · `src/terms/components/TermCard.tsx#TermCard` (modify) — 새 필드를 표시한다

## D-4 섹션별 무대
- Status: settled
- Decision: 섹션마다 무대 하나를 두고 그 섹션의 모든 데모가 쓴다. Camera는 평면도 + 카메라 화면, Edit는 화면 + 타임라인, Look은 전/후 비교다. 무대는 레이아웃과 컨트롤 자리만 맡고, 장면 내용은 카드가 채운다.
- Rejected: 카드마다 독립 구현 → 문서가 같은 구조를 26장·20장에 요구해 중복이 이미 확인됐다 · 장면 자체를 일반화하는 장면 엔진 → AGENTS.md 범위 밖

## D-5 공유 장면
- Status: settled
- Decision: Camera·Edit·Look의 데모는 기본 도형으로 조립한 3D 공유 장면 하나를 쓴다. 구성은 전경(풀·울타리·그네), 중경(주황 주인공과 다른 색 상대, 인물 2명), 원경(언덕·나무·하늘·해)이고, 시간대는 값으로 바꾼다. 이번 iteration은 낮·노을을 만들고, 밤은 Day for Night 카드를 채울 때 더한다. 구현자는 카드를 구현할 때 그 문서의 `데모`·`요청 예문`·「웹 데모」 구현 줄을 이 장면 기준으로 고치고, 출처 줄은 건드리지 않는다.
- ADR: [0001](../../adr/0001-terms-3d-shared-scene.md)

## D-6 3D 라이브러리
- Status: settled
- Decision: 3D로 보여야 이해되는 데모는 `three` + `@react-three/fiber`로 만들고, 쓸지는 구현자가 판단한다. 공유 장면을 쓰는 Camera·Edit·Look 데모(D-5)는 이 판단 없이 3D다. `@react-three/drei`는 쓰지 않는다. AGENTS.md 「용어 대시보드」 절에 적었고(2026-11-24), 에세이 규칙은 그대로다. canvas마다 상태 설명 텍스트를 붙이는 것은 요구하지 않는다.
- ADR: [0001](../../adr/0001-terms-3d-shared-scene.md)

## D-7 WebGL context 관리
- Status: settled
- Decision: 카드 하나는 WebGL canvas를 최대 1개 가진다. canvas는 카드가 화면 안이나 그 가까이에 있을 때만 띄우고, 멀어지면 해제하고 정지 화면이나 자리 표시를 둔다. 여유 거리는 구현자가 정한다.
- ADR: [0001](../../adr/0001-terms-3d-shared-scene.md)

## D-8 Scroll 범주 데모의 스크롤 입력
- Status: settled
- Decision: Motion · Scroll 범주 7장은 카드 안의 높이 고정 내부 스크롤러에서 입력을 받고, ScrollTrigger는 그 스크롤러에 건다.
- Rejected: 페이지 스크롤 사용 → 카드 7장이 서로의 시작 조건을 건드린다

## D-9 공통 컨트롤
- Status: settled
- Decision: 보는 사람이 시작하고 시간으로 재생되는 데모에는 모두 「다시 재생」을 둔다. 스크롤이 진행을 정하는 데모와 애니메이션 없이 상태만 바꾸는 토글에는 두지 않는다. 속도 슬라이더(0.25×~2×)는 Motion · Timing & Sequence와 Edit · Time 범주에만 둔다.
- Rejected: 모든 움직임 데모에 속도 슬라이더 → Scroll·Pointer 데모는 입력이 속도를 정한다

## D-10 범주 노출
- Status: settled
- Decision: 여섯 섹션이 내비게이션에 보이고, 보여 줄 범주가 하나도 없는 섹션은 비활성이다. 범주는 데모가 있는 카드가 하나라도 있으면 노출한다. 섹션 데이터에는 데모가 있는 카드만 넣어서, 화면·검색·관계 링크에 데모 없는 카드가 나오지 않게 한다.
- Rejected: 범주의 모든 카드 데모가 있을 때만 노출 → 대표 카드 하나로 구조를 증명하는 이번 iteration(D-1)에서 채울 수 없다 · 섹션이 통째로 끝나야 노출 → 같은 이유
- Reuse: `src/terms/data/index.ts#plannedSections` (modify) — 보여 줄 범주가 없는 섹션을 비활성 항목으로 남긴다

## D-11 Reduced motion
- Status: provisional
- Decision: Motion·Camera·Edit·Look 데모는 reduced motion 대응 없이 만들고, Reduced Motion 카드는 없앤다. UI·Style 카드의 기존 대응과 헤더 미리보기 토글은 그대로 둔다. AGENTS.md 완성 기준과 `docs/terms/` 문서는 2026-11-24에 이에 맞춰 고쳤다.
- Default: 새 데모는 `prefers-reduced-motion`과 헤더 미리보기 토글에 반응하지 않는다. 사용자가 reduced motion 대응을 다시 넣자고 하면 재검토한다.
- Rejected: Reduced Motion 카드가 헤더 토글을 조작하고 멀미 유발 카드(Crash Zoom·Handheld·Camera Shake·Whip Pan)의 재생을 막기 → 혼자 보는 페이지라 지금 고민할 가치가 작다(사용자 결정)

## D-12 절대 일어나면 안 되는 것
- Status: settled
- Decision: 다음 여섯 가지는 어떤 조작에서도 일어나면 안 된다. 첫째, 보는 사람이 시작하지 않은 데모가 자동으로 재생된다. 둘째, 범주나 섹션을 바꾼 뒤 이전 카드의 tween이나 ScrollTrigger가 남는다. 셋째, 키보드 사용자가 Pin·Scroll 데모 안에 갇힌다. 넷째, 기존 UI·Style 카드의 hash 주소가 깨진다. 다섯째, 에세이(`src/connection-pool/`)가 대시보드 코드를 import한다. 여섯째, WebGL context가 꺼져 데모가 검게 변한다.

## D-13 테스트
- Status: provisional
- Decision: Playwright E2E와 Vitest는 81장을 채우는 spec에서 도입한다. AGENTS.md 스택 표에 `Vitest + Playwright`를 허용으로 적었다(2026-11-24). 기존 `scripts/check-sim.ts`·`scripts/check-contrast.ts`는 그대로 둔다.
- Default: 대표 카드 네 장은 사용자가 화면을 직접 보고 확인하며, 자동 테스트는 만들지 않는다. 구조가 확인되어 spec을 쓸 때 재검토한다.
- Rejected: 대표 카드 단계부터 Playwright로 D-12를 검증 → 구조가 바뀔 수 있는 단계라 테스트가 먼저 낡는다

## D-14 문서 수정 분담
- Status: dropped
- Decision: 출처 정리는 사용자가 2026-11-24에 마쳐 남은 의무가 없다. 문서 `데모` 줄 수정은 D-5로 옮겼다.

## D-15 대표 카드의 컨트롤
- Status: settled
- Decision: 대표 카드는 문서가 적어 둔 컨트롤(Dolly Zoom 방향 토글, Dissolve 겹침 길이, Scroll Scrub scrub 값, Selective Color 원본/효과 토글)을 갖춘다. 처음 값 같은 세부는 구현하면서 정한다. 카드마다 다른 컨트롤을 무대에 끼울 수 있는지가 81장의 전제라서다.
- Rejected: 컨트롤을 빼고 문서에서도 지우거나 다음으로 미루기 → 무대가 카드별 컨트롤을 받는 구조가 검증되지 않는다
