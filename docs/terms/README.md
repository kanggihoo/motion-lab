# 용어 대시보드 — 계획

화면 UI·모션·스타일 용어를 **눈으로 보고 바로 익히기** 위한 대시보드. 용어마다 작은 라이브 데모를 붙여 "그래서 이게 뭔데"를 1초 안에 확인한다.

이 폴더는 **무엇을 만들지** 정리한다. UI 카드의 구현은 `src/terms/`에 있다.

## 누구를 위한 것인가

나 자신. FE·디자인을 공부하면서 용어에 빨리 익숙해지고, 각 용어가 화면에서 어떻게 보이는지 직접 확인하는 것이 목적이다.

그래서 카드에는 영상처럼 **AI 요청 문장**을 넣고, 거기에 **구현 키워드**(CSS 속성, HTML 요소, GSAP API)도 함께 넣는다. 이름을 알면 → 요청할 수 있고 → 구현을 찾아볼 수 있다.

## 섹션

| 섹션 | 파일 | 다루는 것 | 카드 수 |
|---|---|---|---|
| UI | [ui.md](ui.md) | 어떤 화면과 상태를 만드는가 | 91 |
| Motion | [motion.md](motion.md) | 무엇이 언제 어떻게 움직이는가 | 32 |
| Style | [style.md](style.md) | 화면이 어떤 시각 규칙을 따르는가 | 5 |
| Camera | [camera.md](camera.md) | 촬영할 때 무엇을 어떻게 담는가(무브·앵글·렌즈) | 26 |
| Edit | [edit.md](edit.md) | 숏을 어떻게 잇고 시간의 흐름을 어떻게 바꾸는가 | 20 |
| Look | [look.md](look.md) | 완성 화면의 색·빛·질감 | 7 |

합계 181장. 출발점은 영상 3편의 용어 98개(1탄 UI 24 + 2탄 Motion 24 + 3탄 영상 기법 50)다.

**섹션을 새로 붙이는 방법**: 파일 하나(`camera.md`)를 만들고 이 표에 한 줄을 추가한다. 다른 섹션과 개념이 겹치면 카드의 "관계" 줄에 적는다(아래 연결 메모 참고).

## 범주는 '시작 조건' 기준으로 나눈다

영상의 분류(예: 2탄 "화면과 마우스")는 페이지 전환, pin, magnetic, confetti를 한 묶음에 넣는다. 그러면 "스크롤할 때 쓰는 효과"를 한곳에서 비교할 수 없다.

2탄이 제시한 요청 공식은 **효과 이름 + 속도 + 시작 조건**이다(https://www.youtube.com/watch?v=r7iS0Gw3Jq4 11:17). 여기서 *속도*는 Timing 범주가, *시작 조건*은 Scroll·Pointer & Event 범주가 맡는다. 이렇게 나누면 "무엇이 움직이나"와 "어떻게·언제 움직이나"가 카드 단위로 분리된다.

## 카드 형식

각 섹션 파일의 용어 하나가 카드 한 장이다.

| 필드 | 내용 |
|---|---|
| 무엇 | 한두 문장 정의 |
| 데모 | 카드 안에서 무엇을 보여 주고, 무엇을 조작하게 하는가 |
| 요청 예문 | AI에게 그대로 쓸 수 있는 문장. 공식은 `용어 + 동작/속도 + 조건`. **화면에는 일단 표시하지 않는다**(데이터에는 남김, 2026-11-22) |
| 구현 | 찾아볼 CSS 속성·HTML 요소·GSAP API |
| 관계 | 다른 카드와의 관계(아래 4종) |
| 출처 | 영상 타임스탬프 또는 원문 링크. **이 계획 문서에만 남기고 화면에는 표시하지 않는다**(2026-11-22) |

### 관계 표기 4종

같은 검색어로 찾아오게 하되, **동의어로 뭉개지 않는다.**

- **별칭**: 같은 것의 다른 이름. 예: Cursor Follow = Custom Cursor
- **구성 요소**: 그 카드의 일부. 예: Backdrop은 Modal Dialog의 구성 요소
- **변형**: 그 카드의 한 형태. 예: Wipe는 Page Transition의 변형
- **구현 API**: 그 카드를 만드는 도구. 예: View Transitions는 Shared Element Transition의 구현 API이며, 페이지 전체 전환에도 쓰인다

## 규칙

1. **포함 기준: 이름을 알면 요청이나 구현이 달라지는가.** 개수 상한은 없다.
   - 통과 예: "카드를 Masonry로" vs "카드를 Grid로" → 결과 배치가 다르다
   - 탈락 예: Rotate → "90° 회전"은 이름 없이도 같은 요청이다
2. **출처 필수.** 영상 용어는 타임스탬프를, 영상 밖에서 추가한 용어는 원문 링크(웹: MDN, W3C, WAI-ARIA APG, 디자인 시스템 문서 / 영상: ASC 자료, Adobe·Blackmagic·Apple 공식 매뉴얼, 영화학 교재 *Film Art*)를 단다. 출처를 달 수 없는 용어는 넣지 않는다. 출처는 이 계획 문서에만 두고 대시보드 화면에는 표시하지 않는다.
3. **Reduced Motion 대응은 UI·Style 카드에만 있다.** Motion·Camera·Edit·Look은 나중에 넣는다(2026-11-24).
4. **데모는 보는 사람이 시작한다.** 자동 반복 재생 대신 hover·클릭·스크롤·"다시 재생" 버튼으로 시작한다. 카드 여러 장이 한 화면에서 동시에 움직이면 무엇을 봐야 할지 알 수 없다.
5. **데모는 키보드로도 조작할 수 있어야 한다.** hover로 시작하는 데모는 focus로도 시작되게 한다.

## 이 저장소에 두는 이유

`motion-lab` 저장소(구 `motion-essay`) 안의 별도 엔트리로 만든다(결정 2026-11-22). 같은 GSAP·Tailwind 설정을 쓰고, 에세이에서 실제로 쓴 기법과 바로 연결할 수 있다.

| 카드 | 에세이에서 쓴 곳 |
|---|---|
| Scroll Scrub | `src/connection-pool/Scrolly.tsx:136` — `scrollTrigger: { scrub }` |
| Pin | `src/connection-pool/Scrolly.tsx:158` — 다이어그램을 `sticky top-0`으로 고정 |
| Scrollytelling | `src/connection-pool/Scrolly.tsx` 전체 — 스크롤에 따라 단계 카드가 바뀜 |
| Easing | `src/connection-pool/Scrolly.tsx:27`, `:28` — `gsap.parseEase('power2.inOut')`, `gsap.parseEase('power2.out')` |

대시보드에 적용되는 규칙(에세이 규칙의 예외, shadcn/ui 허용 범위, 대시보드 완성 기준)은 `AGENTS.md`의 「용어 대시보드」 절에 있다.

## 넣지 않은 것과 이유

| 용어 | 처분 | 이유 |
|---|---|---|
| Smooth Transition (1탄) | 카드 없음. 검색하면 Duration / Delay·Easing으로 안내 | 1탄의 사례(7:53)는 "hover에 200ms"뿐이라, 독립 데모가 hover 데모와 같아진다. transition과 keyframe animation의 차이는 Keyframe 카드에서 다룬다 |
| Interpolation | 제외 | AI는 언제나 보간한다. 이름을 넣어도 요청 결과가 바뀌지 않는다. 보간 차이는 Easing·Keyframe에서 보인다 |
| Orchestration | Timeline 카드로 흡수 | 순서와 겹침은 Timeline 데모로 보여 줄 수 있다 |
| Rotate | 제외 | "90° 회전"은 이름 없이도 같은 요청이다. 화살표 회전은 Accordion, 계속 도는 회전은 Loop 카드의 사례로 남긴다 |
| Responsive Layout, Card Layout, Toast / Snackbar, Pagination / Infinite Scroll, Hover Effect | 제외 (2026-11-22) | 이미 아는 용어. 학습 목적의 대시보드라 카드로 만들 필요가 없다 |
| Gradient(Mesh), Grain/Noise | 보류 | 근거 출처가 약하고, Style은 규칙으로 고정할 수 있는 것부터 둔다. 영상 룩으로서의 Film Grain은 Look 섹션에 있다 |
| Reverse (3탄) | 카드 없음. 검색하면 Motion · Timeline(`tl.reverse()`)으로 안내 | Rotate와 같은 기준("거꾸로 재생"은 이름 없이도 같은 요청). `Timeline` 카드에 이미 `tl.reverse()`가 들어 있다 |
| Zoom In, Slow Motion (3탄) | 제외 (2026-11-23) | 이미 아는 용어. 단 Dolly In·Crash Zoom·Dolly Zoom·Speed Ramp·Bullet Time 등의 비교 기준이라 관계 줄과 검색어로 연결한다 |

**후속 후보**(기준은 통과하지만 1차 목록 밖): Mask / Clip Reveal(가려졌다 드러남, Split Text와 다른 방식), Shake(입력 오류 시 좌우 흔들림).

## 영상 48개의 처분

**유지한 것은 각 섹션 파일에 그대로 있다.** 아래는 바뀐 것만 정리했다.

| 원제 | 처분 | 간 곳 |
|---|---|---|
| Skeleton Loading | 병합·표제 변경 | UI · Loading State (Skeleton·Progress Bar·Spinner 비교) |
| Smooth Transition | 독립 카드 제거 | 검색어로 Duration / Delay·Easing에 연결 |
| Stagger Animation (1탄) | 이동 | Motion · Timing & Sequence (2탄 3:59의 언급과 한 장) |
| Scroll Reveal, Parallax Scrolling, Scroll Snap | 이동 | Motion · Scroll |
| Micro-interaction | 범주 변경 | UI · State & Feedback |
| Responsive Layout, Card Layout, Toast / Snackbar, Hover Effect | 제외 | 이미 앎 (Pagination / Infinite Scroll은 신규 추가였다가 같은 이유로 제외) |
| Glassmorphism | 이동 | Style · Surface & Contrast |
| Pin · Scrollytelling | 두 장으로 분리 | Motion · Scroll |
| Horizontal Scroll | 표제 변경 | Pinned Horizontal Scroll (원래 이름은 검색어) |
| Dropdown | 세 장으로 분리 | Dropdown Menu / Select / Editable Combobox |
| Modal / Dialog | 표제 좁힘 | Modal Dialog (Dialog 검색어 유지, Overlay / Backdrop은 구성 요소) |

산식: 48 − 1(Smooth Transition) + 1(Pin 분리) + 2(Dropdown 분리) + 14(신규) = 64 → 이미 아는 5장 제외 = **59**

## 영상 3탄 50개의 처분

**유지한 것은 `camera.md`·`edit.md`·`look.md`에 그대로 있다.** 아래는 바뀐 것만 정리했다.

| 원제 | 처분 | 간 곳 |
|---|---|---|
| High Angle, Low Angle | 병합 | Camera · Angle & Framing · High / Low Angle (두 이름 검색어) |
| Extreme Close-up | 표제 넓힘 | Camera · Angle & Framing · Shot Size (ECU는 변형·검색어) |
| Reverse | 독립 카드 제거 | 검색어로 Motion · Timeline(`tl.reverse()`)에 연결 |
| Zoom In, Slow Motion | 제외 | 이미 앎 (비교 기준이라 관계 줄·검색어로 연결) |
| One Take | 표제 변경 | Camera · Movement · Long Take (One Take·Oner 검색어) |
| God Rays | 표제 변경 | Look · Color & Light · Volumetric Light (God Rays·Light Shafts 검색어) |
| Fade Out | 표제 변경 | Edit · Transition · Fade to Black (Fade In / Out 검색어, Motion · Fade와 다른 대상) |
| Dolly In | 표제 넓힘 | Camera · Movement · Dolly In / Out |
| Iris, Tilt-shift | 표제 보강 | Iris (In / Out), Tilt-shift (Miniature Effect) |
| Dolly Zoom | 정의 수정 | "반대 방향으로 동시에" (원문 4:18은 한 방향뿐) |
| Camera Shake | 범주 이동 | 영상의 렌즈·빛 묶음 → Camera · Movement (Handheld와 비교) |
| Whip Pan | 범주 유지 | 카메라 무브지만 Edit · Transition (영상 10:28이 전환으로 사용) |

산식: 50 − 1(High/Low 병합) − 1(Reverse 제외) + 7(신규) = 55 → 이미 아는 2장(Zoom In, Slow Motion) 제외 = **53**

## Camera·Edit·Look 섹션 연결 메모

영상 섹션과 웹(Motion·Style) 섹션이 겹치거나 헷갈리는 지점.

- **공통 개념**: Easing, Keyframe, Timeline, Motion Path. 영상 편집 도구(키프레임 보간, 그래프 에디터)에서도 같은 이름과 같은 뜻으로 쓴다. 특히 `Motion · Timeline`은 `Edit · Time` 카드의 구현 API다(`timeScale()` → Time-lapse·Speed Ramp, `pause()` → Freeze Frame, `reverse()` → Reverse).
- **같은 이름, 다른 대상**:
  - **Wipe**: 웹에서는 페이지를 덮는 전환이고, 편집에서는 컷 사이의 전환이다. 두 섹션에 각각 두고 서로 비교한다.
  - **Fade 3종**: `Motion · Fade`(UI 요소 투명도) / `Edit · Fade to Black`(화면이 완전한 검정을 거침) / `Edit · Dissolve`(두 숏이 겹치며 전환).
- **구현 API vs 비유**:
  - `Scale` = **Zoom In의 구현 API**(화면 전체에 균일 확대는 광학 줌과 결과가 같다). **Dolly In과는 비유**(카메라가 실제로 이동해 원근이 바뀐다).
  - `Parallax` ↔ `Dolly In / Tracking Shot`: 의미는 비유로만 연결한다(층 속도차 vs 카메라 이동). 단 2D SVG 데모 구현에서는 Parallax 층 기법을 쓴다.
  - `Pin` ↔ locked-off shot: 스크롤 위치를 고정하는 것과 카메라 구도를 고정하는 것은 다르다.
  - `Shared Element` ↔ `Match Cut`: Shared Element는 *같은 요소*가 이어지고, Match Cut은 *다른 요소*가 형태만 닮는다.

## 결정 기록

- 2026-11-22: Claude·Codex 토의(8턴)로 64장 구성을 합의했다. 같은 날 이미 아는 UI 5장을 빼서 59장이 됐다. 사용자 결정 사항:
  - 상한 없음
  - 독자 = 본인 학습
  - 1차는 섹션별 계획 문서까지
  - 이 저장소에 둔다
- 토의 원본은 `.herdr-discuss/20261122-0203-ui-motion-terms/summary.md`에 있다. git에서는 제외되어 로컬에만 있다.
- 2026-11-22: `style.md`에서 출처를 모두 삭제했다(사용자 결정). 위 규칙 2의 "출처 필수"는 Style 섹션에 적용하지 않는다.
- 2026-11-23: agy·Claude(`opus`, effort `medium`) 토의(6턴)로 3탄 영상 50개의 `camera.md`·`edit.md`·`look.md` 3파일 분리, 표제·정의 보정, 신규 7장 추가를 합의했다. 사용자 결정으로 이미 아는 2장(`Zoom In`, `Slow Motion`)을 제외해 53장(전체 182장)으로 확정했다. 토의 원본은 `.herdr-discuss/20261123-1922-video-terms/summary.md`에 있다.
- 2026-11-24: Motion·Camera·Edit·Look의 reduced motion 대응을 나중으로 미루고 Reduced Motion 카드를 제거했다(사용자 결정). 전체 181장.
