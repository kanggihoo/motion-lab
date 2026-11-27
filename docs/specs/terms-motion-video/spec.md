# 용어 대시보드 Motion·Camera·Edit·Look — Look 완성 및 테스트 기반

Status: approved
Decisions: [decisions.md](decisions.md) · Glossary and ADRs: [GLOSSARY.md](../../../GLOSSARY.md) · [0001](../../adr/0001-terms-3d-shared-scene.md)

## Problem

대표 카드 4장(Scroll Scrub · Dolly Zoom · Dissolve · Selective Color)으로 6개 섹션 내비게이션, 무대 구조, 3D 공유 장면, 단일 WebGL canvas 합성 구조는 검증되었다. 그러나 현재는 데이터·로직 무결성과 D-12 불변 조건을 자동으로 확인하는 테스트 기반이 없고, 영상 3섹션 중 첫 번째 완결 섹션인 **Look**의 나머지 6장(`Color Grading`, `Day for Night`, `Volumetric Light`, `Film Grain`, `Letterbox`, `Vignette`)이 비어 있다.

이번 iteration은 같은 slug(`terms-motion-video`) 안에서 Look 섹션 전체 7장을 완성하고, 이후 Camera(25장)·Edit(19장)·Motion(31장)으로 확장하기 위한 Vitest + Playwright 테스트 기반을 세운다.

## Assumptions

1. `terms.html`은 Vite MPA 엔트리로 빌드되는 정적 클라이언트 애플리케이션이며 별도 백엔드가 없다.
2. React 19, `three`, `@react-three/fiber` v9, GSAP + ScrollTrigger가 이미 설치되어 있다.
3. `docs/terms/look.md`가 Look 7장의 정의·관계·출처 원문을 보유하며, `AGENTS.md` 「용어 대시보드」 규칙이 적용된다.
4. Playwright E2E는 로컬 개발/프리뷰 서버에서 Chromium(WebGL 활성)으로 실행한다.

## Usage

1. **Look 섹션 탐색 및 전/후 비교**: 사용자가 상단 섹션 내비게이션에서 `Look`을 선택하면 `Color & Light`(4장)와 `Texture & Frame`(3장)이 노출된다. 각 카드의 `전/후 분할 위치` 슬라이더(`0~100%`)와 카드별 컨트롤(예: `Color Grading` 프리셋, `Day for Night` 3단계 체크박스, `Letterbox` 화면비 버튼)을 조작해 원본과 효과를 비교한다.
2. **기존 카드·키보드·해시 탐색**: 사용자가 `#ui/...` 또는 `#style/...` hash로 직접 진입하거나, `Motion · Scroll`의 `Scroll Scrub` 내부 스크롤 영역에 `Tab`으로 들어가 화살표 키로 스크롤한 뒤 다시 `Tab`으로 빠져나온다.
3. **자동 검증 실행**: 개발자가 `pnpm test`로 순수 계산·데이터 무결성·GSAP 언마운트 정리를 확인하고, `pnpm test:e2e`로 D-12 동작·DOM·키보드·WebGL 오류를 확인한다.

## Acceptance criteria

- [x] AC-1: `Look` 섹션의 `Color & Light` 4장(`Color Grading`, `Selective Color`, `Day for Night`, `Volumetric Light`)과 `Texture & Frame` 3장(`Film Grain`, `Letterbox`, `Vignette`) 총 7장이 등록·노출되고, 각 카드에 `촬영·편집`과 `웹 데모 구현`이 구분 표시되며, 데모가 없는 나머지 75장은 화면·검색·관계 링크에 나타나지 않는다 (D-1, D-2, D-3, D-10).
- [x] AC-2: 신규 Look 6장은 모두 `LookStage` 전/후 분할 비교(슬라이더 `0~100%`, `전`/`후` 텍스트 표식, 재생 버튼 및 속도 슬라이더 없음) 안에서 카드별 컨트롤을 제공한다 — `Color Grading`(`원본` 선택 시 `splitPercent = 100`으로 원본 100% 표시, `Teal & Orange / 차가운 블루 / 따뜻한 필름` 선택 시 `후` 영역에 해당 색보정 적용), `Day for Night`(`1. 전체 어둡게 / 2. 푸른 톤 / 3. 하늘 어둡게` 3단계 체크박스), `Volumetric Light`(`안개/먼지 농도` 슬라이더), `Film Grain`(`강도` 슬라이더, 자동 재생 없는 정적 그레인 패턴), `Letterbox`(`16:9 (표준) / 1.85:1 / 2.39:1 (Letterbox)` 버튼, `전`은 16:9 원본이고 `후` 영역에 선택한 화면비 검은 띠 적용), `Vignette`(`강도(Amount)`·`부드러움(Feather)` 슬라이더) (D-4, D-9, D-15).
- [x] AC-3: `SharedScene`과 `TIME_PALETTES`에 원경 불빛을 포함한 `night` 시간대가 추가되고(`ViewportCanvas`의 `night` 자리 표시 색상 포함), Look 7장 모두 `three` + `@react-three/fiber`(`@react-three/drei` 미사용) 기반 공유 장면으로 렌더링되며, `docs/terms/look.md`의 신규 6장 `데모`·`요청 예문`·`웹 데모` 구현 줄이 3D 공유 장면·`LookStage` 기준으로 갱신된다(`무엇`·`관계` 및 출처 유무는 유지) (D-5, D-6).
- [x] AC-4: 모든 3D 카드(Look 7장·Camera 1장·Edit 1장)는 카드당 `<canvas>`를 최대 1개만 유지하고, viewport에서 멀어지면 canvas를 해제해 자리 표시를 보이며, `webglcontextlost` 발생 시 검은 화면 대신 복구 안내와 재시도 버튼을 표시한다 (D-7, D-12).
- [x] AC-5: 활성 범주(`Motion · Scroll`, `Camera · Movement`, `Edit · Transition`, `Look · Color & Light`, `Look · Texture & Frame`)를 열었을 때 사용자 조작 전에는 어떤 데모도 자동 재생되지 않으며, 기존 대표 카드 4장의 컨트롤(`Scroll Scrub` scrub `0/0.5/2`, `Dolly Zoom` 방향 토글, `Dissolve` 겹침 `0.3s/1.0s/2.0s`, `Selective Color` 모드 토글)이 정상 동작한다 (D-12, D-15).
- [x] AC-6: `ScrollScrubDemo`, `DollyZoomDemo`, `DissolveDemo`에서 인터랙션·재생 후 언마운트하거나 다른 섹션·범주로 전환하면 남아 있는 `ScrollTrigger`와 활성 GSAP tween이 0개이며 콘솔 오류가 발생하지 않는다 (D-8, D-12).
- [x] AC-7: 키보드 `Tab`으로 `Motion · Scroll`의 `Scroll Scrub` 내부 스크롤 영역에 진입해 화살표 키로 스크롤한 뒤 다시 `Tab`을 누르면 영역 안에 갇히지 않고 다음 포커스 가능 요소로 이동한다 (D-8, D-12).
- [x] AC-8: 기존 `#ui/...`·`#style/...` hash 주소로 직접 진입하거나 이동할 때 해당 카드가 표시되며, 헤더의 `Reduced Motion 미리보기` 토글은 UI·Style 카드의 기존 동작을 유지하고 Motion·Camera·Edit·Look 데모는 해당 토글과 `prefers-reduced-motion`에 반응하지 않는다 (D-2, D-10, D-11, D-12).
- [x] AC-9: `src/connection-pool/`의 어떤 파일도 `src/terms/`나 `three`/`@react-three/fiber`를 import하지 않으며, 등록된 모든 섹션·범주의 카드마다 대응하는 `loadDemos` 키가 존재하고 섹션 내 카드 ID 중복이 없으며, 순수 계산(`toLuminanceHex`, `pickColor`, `TIME_PALETTES.night`, 광학/타임라인 계산)이 기대값을 만족한다 (D-5, D-6, D-10, D-12, D-13).
- [x] AC-10: `pnpm test`(Vitest), `pnpm test:e2e`(Playwright, 스크린샷·시각 비교 없음), `pnpm check`, `pnpm build`, `pnpm lint`가 모두 종료 코드 0으로 통과한다 (D-13).
- [x] AC-11: 사용자가 개발 서버(`/terms.html`)에서 Look 7장 및 기존 대표 카드들의 3D 공유 장면·전/후 분할 비교·컨트롤을 직접 확인해 시각적·구조적 결함이 없음을 확인한다 (D-1, D-4, D-5, D-13).

## Interfaces

```ts
export type TimeOfDay = 'day' | 'sunset' | 'night'

// Term 선택 필드 (src/terms/data/types.ts)
export interface Term {
  // ...기존 필수 필드
  filmmaking?: string
  repoExample?: string
}
```

- Look 섹션 hash 경로:
  - `#look/color-light/color-grading`
  - `#look/color-light/selective-color`
  - `#look/color-light/day-for-night`
  - `#look/color-light/volumetric-light`
  - `#look/texture-frame/film-grain`
  - `#look/texture-frame/letterbox`
  - `#look/texture-frame/vignette`
- `package.json` 테스트 스크립트:
  - `"test": "vitest run"`
  - `"test:e2e": "playwright test"`

## Constraints

- 3D 데모는 `three`와 `@react-three/fiber`만 사용하며 `@react-three/drei`, Framer Motion, confetti 라이브러리는 설치·사용하지 않는다 (D-6).
- `src/connection-pool/`은 `src/terms/` 및 3D 라이브러리를 import하지 않는다 (D-6, D-12).
- 대시보드 화면에는 `request` 문자열과 원문 출처를 표시하지 않으며, `docs/terms/look.md`의 `무엇`·`관계` 줄은 건드리지 않는다 (D-5).
- Motion·Camera·Edit·Look 데모는 `prefers-reduced-motion`과 헤더 미리보기 토글에 반응하지 않는다 (D-11).
- 이후 iteration(Camera 25장·Edit 19장·Motion 31장) 연속성 제약:
  - Camera 무대는 카드별 평면도/측면도 선택과 3D↔도식 공통 좌표 상수 공유를 따른다 (D-4).
  - `SharedScene` 확장은 시간대(`day`/`sunset`/`night`)·인물 상태(서기·걷기/달리기·점프·그네)·카드별 소품 슬롯(최대 1개)까지만 허용하고 오디오 카드는 무음 파형으로 표현한다 (D-5).
  - `Loop`·`Marquee` 등 무한 반복 데모도 초기 정지 상태 + 재생/일시정지 토글을 둔다 (D-12).
  - `Motion · Scroll`은 별도 4종 비교 블록 없이 `Scroll Reveal`·`Scroll Scrub`·`Pin`·`Scroll Snap` 4장을 범주 앞쪽에 나란히 두고, 제외 용어 4개(`Smooth Transition`, `Reverse`, `Zoom In`, `Slow Motion`)는 관련 카드 `aliases`로 검색에 연결한다 (D-16).

## Existing code

| Locator | Action | Obligation | Decision |
|---|---|---|---|
| `src/terms/data/index.ts#sectionOrder` | reuse | 6개 섹션 순서(`ui · motion · style · camera · edit · look`) 유지 | D-2 |
| `src/terms/data/index.ts#plannedSections` | reuse | 데모 없는 섹션을 비활성 항목으로 유지 | D-10 |
| `src/terms/data/types.ts#Term` | reuse | `filmmaking`·`repoExample` 선택 필드 스키마 유지 | D-3 |
| `src/terms/components/TermCard.tsx#TermCard` | reuse | `촬영·편집`·`웹 데모 구현`·`이 저장소의 예` 항목 표시 유지 | D-3 |
| `src/terms/components/TermSearch.tsx#TermSearch` | reuse | 등록된 Look 7장을 이름·별칭으로 검색 연결 | D-10, D-16 |
| `src/terms/components/stages/LookStage.tsx#LookStage` | reuse | Look 7장 모두의 전/후 분할 비교 무대로 사용 | D-4, D-9 |
| `src/terms/components/scene/SharedScene.tsx#SharedScene` | modify | `night` 시간대(원경 불빛 포함) 및 Look 6장 표현에 필요한 상태·효과 지원 | D-5 |
| `src/terms/components/scene/scene-colors.ts#TIME_PALETTES` | modify | `night` 팔레트 추가 | D-5 |
| `src/terms/components/scene/ViewportCanvas.tsx#ViewportCanvas` | modify | 카드당 최대 1개 canvas·viewport 근접 마운트·context 유실 복구 유지 및 `night` 자리 표시 톤 추가 | D-7, D-12 |
| `src/terms/components/scene/DualSceneComposer.tsx#DualSceneComposer` | modify | 단일 canvas 전/후 분할 합성에 Look 효과(색보정·Day for Night·그레인·비네트·레터박스 등) 지원 확장(셰이더 또는 `후` 클리핑 오버레이 조합은 구현 재량) | D-7 |
| `src/terms/data/look.ts#loadDemos` | modify | `Color & Light` 4장·`Texture & Frame` 3장 총 7장 데이터와 데모 로더 등록 | D-1, D-10 |
| `src/terms/demos/look-color-light.tsx#SelectiveColorDemo` | modify | 기존 `SelectiveColorDemo` 유지 및 `Color & Light` 나머지 3장 데모 추가 | D-1, D-15 |
| `src/terms/demos/camera-movement.tsx#DollyZoomDemo` | modify | 기존 데모 유지 및 순수 광학 계산 함수를 Vitest 검증 가능하도록 export | D-13 |
| `src/terms/demos/edit-transition.tsx#DissolveDemo` | modify | 기존 데모 유지 및 순수 타임라인 혼합 계산 함수를 Vitest 검증 가능하도록 export | D-13 |

## Seams & test plan

- **Vitest 순수 로직·데이터 무결성·경계 검사 (`example`)**, `AC-1`, `AC-3`, `AC-9`, `AC-10`: `toLuminanceHex`·`pickColor`·`TIME_PALETTES.night`·광학/타임라인 순수 함수, 모든 섹션 카드의 `loadDemos` 키 매칭·ID 중복 없음·미구현 카드 미등록, `src/connection-pool/`의 대시보드/3D import 부재를 검증한다. 실제 브라우저 WebGL 렌더링과 DOM 키보드 이동은 놓친다. Prior art: `scripts/check-sim.ts`, `scripts/check-contrast.ts`.
- **Vitest GSAP 언마운트 정리 (`example`)**, `AC-6`, `AC-10`: `ScrollScrubDemo`, `DollyZoomDemo`, `DissolveDemo`를 마운트·조작 후 언마운트했을 때 `ScrollTrigger.getAll().length === 0`과 활성 tween 잔류가 없음을 검증한다. 실제 스크롤 물리 타이밍은 놓친다. Prior art: 없음.
- **Playwright 브라우저 E2E (`e2e`, 스크린샷·시각 비교 없음)**, `AC-1`, `AC-2`, `AC-3`, `AC-4`, `AC-5`, `AC-6`, `AC-7`, `AC-8`, `AC-10`: Look 7장 노출과 카드별 컨트롤 동작, 카드당 `<canvas>` 최대 1개 및 `webglcontextlost` 복구, 초기 자동 재생 없음, 섹션/범주 전환 후 콘솔 오류 없음, `Scroll Scrub` 키보드 `Tab` 탈출, `#ui/...`·`#style/...` hash 직접 진입 및 `Reduced Motion 미리보기` 분리 동작을 검증한다. 픽셀 단위 시각 품질은 놓친다. Prior art: 없음.
- **기존 체크 및 빌드 (`example`)**, `AC-10`: `pnpm check`, `pnpm build`, `pnpm lint` 실행.
- **사용자 브라우저 육안 검수 (`manual`)**, `AC-2`, `AC-3`, `AC-11`: 개발 서버 `/terms.html`에서 Look 7장과 대표 카드들의 3D 공유 장면 조형·색감·전/후 분할선·조작감을 직접 확인한다.

## Out of scope

- Camera 남은 25장(평면도·측면도 전환 및 공통 좌표 상수화 포함), Edit 남은 19장(무음 오디오 파형·속도 슬라이더 포함), Motion 남은 31장(`Scroll` 4종 인접 배치·제외 용어 4개 `aliases` 연결·`Loop`/`Marquee` 포함) — 같은 slug의 후속 iteration 범위 (D-1, D-4, D-5, D-9, D-16)
- `SharedScene`의 인물 상태(걷기·달리기·점프·그네 타기) 및 소품 슬롯(최대 1개) 확장 — Camera·Edit iteration에서 추가 (D-1, D-5)
- Motion·Camera·Edit·Look의 `prefers-reduced-motion` 대응 (D-11)
- Playwright 스크린샷/시각 회귀 테스트 (D-13)
- `@react-three/drei` 및 `AGENTS.md` 허용 목록 밖 라이브러리 (D-6)
