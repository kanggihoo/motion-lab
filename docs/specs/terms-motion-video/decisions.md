# 용어 대시보드 Motion·Camera·Edit·Look 섹션 decisions

Glossary: [GLOSSARY.md](../../../GLOSSARY.md) · ADRs: [0001](../../adr/0001-terms-3d-shared-scene.md)

## D-1 범위와 iteration 나누기
- Status: settled
- Decision: 대표 카드 4장으로 표현 구조 검증을 마쳤다. 남은 81장은 같은 slug 안에서 섹션별 4개 iteration(Look 6장 → Camera 25장 → Edit 19장 → Motion 31장)으로 나누어 채우며, 이번 iteration은 Look 남은 6장과 테스트 기반을 완성한다.
- Rejected: 81장 전체를 한 iteration으로 구현 → AGENTS.md 8시간 작업 단위를 넘기고 중간 승인이 불가능하다 · 대표 카드 단계에서 spec과 AC를 먼저 쓰기 → 만들지 않은 구조에 합격선을 긋게 된다 · 섹션마다 slug 분리 → 3D 공유 장면과 무대 결정이 흩어진다

## D-2 섹션 내비게이션
- Status: settled
- Decision: 헤더에 섹션 6개를 평평하게 둔다. 순서는 UI · Motion · Style · Camera · Edit · Look으로 `docs/terms/README.md` 섹션 표와 같다.
- Rejected: 「웹」·「영상」 두 묶음으로 나누기 → 묶음 이름을 새로 만들 이유가 아직 없다
- Reuse: `src/terms/data/index.ts#sectionOrder` (reuse) — 여섯 섹션 순서를 유지한다

## D-3 카드 데이터 형태
- Status: settled
- Decision: 카드에 선택 필드 두 개를 더한다. 「촬영·편집」(Camera·Edit·Look 문서의 촬영·편집 구현)과 「이 저장소의 예」(Motion 문서의 에세이 위치)이고, 카드에서 각각 별도 항목으로 보인다. 기존 구현 필드는 웹 데모 구현을 담는다.
- Rejected: 두 내용을 구현 문자열 하나에 합치기 → 「촬영에서는 이렇게, 웹에서는 이렇게」 비교가 묻힌다
- Reuse: `src/terms/data/types.ts#Term` (reuse) — 선택 필드 두 개 스키마를 유지한다 · `src/terms/components/TermCard.tsx#TermCard` (reuse) — 새 필드를 표시한다

## D-4 섹션별 무대
- Status: settled
- Decision: 섹션마다 무대 하나를 두고 그 섹션의 모든 데모가 쓴다. Camera는 도식(카드별 평면도 또는 측면도 선택, 공통 좌표 상수 공유) + 카메라 화면, Edit는 화면 + 타임라인, Look은 전/후 비교다. 무대는 레이아웃과 컨트롤 자리만 맡고 장면 내용은 카드가 채운다.
- Rejected: 카드마다 독립 구현 → 문서가 같은 구조를 26장·20장에 요구해 중복이 확인됐다 · 평면도만 고정 지원 → Crane Shot·High/Low Angle·Rack Focus·Depth of Field는 측면도가 필요하다 · 장면 자체를 일반화하는 장면 엔진 → AGENTS.md 범위 밖
- Reuse: `src/terms/components/stages/LookStage.tsx#LookStage` (reuse) — Look 섹션 전/후 비교 무대로 쓴다

## D-5 공유 장면
- Status: settled
- Decision: Camera·Edit·Look 데모는 기본 도형 3D 공유 장면 하나를 쓴다. 확장은 시간대(`day`/`sunset`/`night`, 밤은 원경 불빛 포함), 인물 상태(서기·걷기/달리기·점프·그네), 카드별 소품 슬롯(최대 1개)까지만 허용하고 별도 배경은 만들지 않는다. 오디오 카드는 무음 파형으로만 표현하며, 카드 구현 시 문서의 `데모`·`요청 예문`·「웹 데모」 줄을 이 장면 기준으로 고친다.
- Reuse: `src/terms/components/scene/SharedScene.tsx#SharedScene` (modify) — `night` 시간대와 Look 효과 확장을 반영한다 · `src/terms/components/scene/scene-colors.ts#TIME_PALETTES` (modify) — `night` 팔레트를 추가한다
- ADR: [0001](../../adr/0001-terms-3d-shared-scene.md)

## D-6 3D 라이브러리
- Status: settled
- Decision: 3D로 보여야 이해되는 데모는 `three` + `@react-three/fiber`로 만들고, 쓸지는 구현자가 판단한다. 공유 장면을 쓰는 Camera·Edit·Look 데모(D-5)는 이 판단 없이 3D다. `@react-three/drei`는 쓰지 않는다. AGENTS.md 「용어 대시보드」 절에 적었고, 에세이 규칙은 그대로다.
- ADR: [0001](../../adr/0001-terms-3d-shared-scene.md)

## D-7 WebGL context 관리
- Status: settled
- Decision: 카드 하나는 WebGL canvas를 최대 1개 가진다. canvas는 카드가 화면 안이나 그 가까이에 있을 때만 띄우고, 멀어지면 해제하고 정지 화면이나 자리 표시를 둔다. 여유 거리는 구현자가 정한다.
- Reuse: `src/terms/components/scene/ViewportCanvas.tsx#ViewportCanvas` (modify) — viewport 근접 시에만 canvas를 마운트하고 context 유실을 복구하며 `night` 자리 표시 톤을 지원한다 · `src/terms/components/scene/DualSceneComposer.tsx#DualSceneComposer` (modify) — 단일 canvas 다중 장면 합성에 재사용하고 Look 효과에 필요한 옵션을 확장한다
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
- Rejected: 범주의 모든 카드 데모가 있을 때만 노출 → 대표 카드 하나로 구조를 증명하는 단계에서 채울 수 없다 · 섹션이 통째로 끝나야 노출 → 같은 이유
- Reuse: `src/terms/data/index.ts#plannedSections` (reuse) — 보여 줄 범주가 없는 섹션을 비활성 항목으로 유지한다

## D-11 Reduced motion
- Status: provisional
- Decision: Motion·Camera·Edit·Look 데모는 reduced motion 대응 없이 만들고, Reduced Motion 카드는 없앤다. UI·Style 카드의 기존 대응과 헤더 미리보기 토글은 그대로 둔다. AGENTS.md 완성 기준과 `docs/terms/` 문서는 2026-11-24에 이에 맞춰 고쳤다.
- Default: 새 데모는 `prefers-reduced-motion`과 헤더 미리보기 토글에 반응하지 않는다. 사용자가 reduced motion 대응을 다시 넣자고 하면 재검토한다.
- Rejected: Reduced Motion 카드가 헤더 토글을 조작하고 멀미 유발 카드의 재생을 막기 → 혼자 보는 페이지라 지금 고민할 가치가 작다(사용자 결정)

## D-12 절대 일어나면 안 되는 것
- Status: settled
- Decision: 여섯 가지를 금지한다. ① 미조작 데모 자동 재생(`Loop`·`Marquee`도 초기 정지+토글) ② 전환 후 tween·ScrollTrigger 잔류 ③ Pin·Scroll 키보드 트랩 ④ 기존 UI·Style hash 깨짐 ⑤ 에세이(`src/connection-pool/`)의 대시보드 import ⑥ WebGL context 유실로 검은 화면 방치.
- Rejected: `Loop`·`Marquee`만 초기 자동 재생 허용 → 여러 카드가 동시에 움직여 첫 번째 불변 조건과 충돌한다 · 오디오·모바일 포인터 규칙을 D-12에 중복 추가 → 오디오는 D-5에서 무음 파형으로 고정됐고 모바일 규칙은 AGENTS.md에 이미 있다

## D-13 테스트
- Status: settled
- Decision: 이번 iteration에서 Vitest와 Playwright를 함께 도입한다. Vitest는 순수 계산과 데이터 무결성을 검증하고, Playwright는 스크린샷·시각 비교 없이 D-12의 동작·DOM·키보드·WebGL 오류만 검증한다. 화면 확인은 사용자가 직접 한다. 기존 check 스크립트는 유지한다.
- Rejected: Playwright 스크린샷 기반 시각 회귀 테스트 도입 → 시각 확인은 사용자가 직접 하므로 스냅샷 유지 비용이 불필요하다 · 자동 테스트 없이 81장 진행 → D-12 회귀를 수동으로 놓치기 쉽다

## D-14 문서 수정 분담
- Status: dropped
- Decision: 출처 정리는 사용자가 2026-11-24에 마쳐 남은 의무가 없다. 문서 `데모` 줄 수정은 D-5로 옮겼다.

## D-15 대표 카드의 컨트롤
- Status: settled
- Decision: 대표 카드는 문서가 적어 둔 컨트롤(Dolly Zoom 방향 토글, Dissolve 겹침 길이, Scroll Scrub scrub 값, Selective Color 원본/효과 토글)을 갖춘다. 처음 값 같은 세부는 구현하면서 정한다. 카드마다 다른 컨트롤을 무대에 끼울 수 있는지가 81장의 전제라서다.
- Rejected: 컨트롤을 빼고 문서에서도 지우거나 다음으로 미루기 → 무대가 카드별 컨트롤을 받는 구조가 검증되지 않는다

## D-16 Motion · Scroll 카드 배치와 제외 용어 검색 연결
- Status: settled
- Decision: `Motion · Scroll` 범주 상단에 별도 4종 비교 블록은 두지 않고, 핵심 4장(`Scroll Reveal` · `Scroll Scrub` · `Pin` · `Scroll Snap`)을 범주 앞쪽에 나란히 배치한다. 카드에서 제외한 4개 용어(`Smooth Transition`, `Reverse`, `Zoom In`, `Slow Motion`)는 관련 카드의 `aliases`로 검색에 연결한다.
- Rejected: `Motion · Scroll` 범주 맨 위에 별도 4종 비교 블록 신설 → 기존 대시보드에 범주 상단 전용 데모 자리가 없고 7장 각각의 데모와 중복된다
- Reuse: `src/terms/components/TermSearch.tsx#TermSearch` (reuse) — `aliases` 기반 검색으로 제외 용어를 관련 카드에 연결한다
