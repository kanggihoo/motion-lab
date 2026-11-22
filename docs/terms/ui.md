# UI 섹션

**어떤 화면과 상태를 만드는가.** 움직임보다 구조와 상태를 다룬다. 움직이는 것이 있으면 Motion 카드에 연결한다.

| 범주 | 다루는 것 | 카드 | 수 |
|---|---|---|---|
| Layout | 페이지 뼈대와 영역 배치 | Hero Section, Grid Layout, Bento Grid, Masonry Layout, Sidebar Layout, Sticky Header, Split Layout, Aspect Ratio, Resizable, Scroll Area, Separator, Direction, App Shell, Container, Stack | 15 |
| Navigation & Menu | 어디로 가고 무엇을 실행하나 | Tabs, Breadcrumb, Navigation Menu, Menubar, Dropdown Menu, Context Menu, Command, Stepper, Outline, Toolbar | 10 |
| Overlay | 현재 화면 위에 뜨는 층 | Modal Dialog, Drawer, Popover, Hover Card, Tooltip, Lightbox | 6 |
| Form & Input | 값을 입력하고 고르는 것 | Button, Button Group, Toggle, Toggle Group, Input, Input Group, Input OTP, Textarea, Label, Field, Checkbox, Radio Group, Switch, Slider, Select, Editable Combobox, Calendar, Date Picker, Multi Selector, Tokenizer, Number Input, File Input, Power Search, Rich Text Editor, Selectable Card | 25 |
| Data Display | 정보를 보여 주는 것 | Accordion, Collapsible, Carousel, Avatar, Badge, Kbd, Item, Table, Data Table, Chart, Code Block, Typography, Clickable Card, Token, Description List, Tree View, Overflow List, Timestamp, Bulk Action Bar | 19 |
| State & Feedback | 기다림·비어 있음·실패·반응 | Loading State, Empty State, Error State, Alert, Micro-interaction, Status Dot, Visually Hidden | 7 |
| Chat (AI) | AI 채팅 화면의 부품 | Message, Bubble, Message Scroller, Attachment, Marker, Trace, Questionnaire, Chat Composer, Citation | 9 |

합계 91장.

**이미 알아서 뺀 것**: Responsive Layout, Card Layout(shadcn Card 포함), Toast / Snackbar(shadcn Toast 포함), Pagination / Infinite Scroll(shadcn Pagination 포함), Hover Effect (2026-11-22). 다른 카드에서 이 이름이 나오면 설명 없이 그대로 쓴다.

**shadcn/ui 컴포넌트 목록 반영 (2026-11-22)**: shadcn 문서의 컴포넌트 66종 중 위 표에 없던 것을 카드로 추가했다(`*(shadcn)*` 표시). 별도 카드 없이 기존 카드 안에서 다루는 것:
- Dialog·Alert Dialog → Modal Dialog
- Sheet·Drawer → Drawer
- Native Select → Select
- Combobox → Editable Combobox
- Skeleton·Progress·Spinner → Loading State
- Empty → Empty State
- Sidebar → Sidebar Layout

범주는 카드가 21장에서 66장으로 늘어 3개(Layout / Component / State & Feedback)로는 사이드바에서 찾기 어려워졌다. 그래서 7개로 다시 나눴다. Component에 있던 카드는 Navigation & Menu / Overlay / Form & Input / Data Display로 옮겼다.

**출처 표기**: `*(shadcn)*` 카드의 출처는 shadcn 문서(Base UI 버전)이다. 계획 문서에만 남기고 화면에는 표시하지 않는다.

영상 출처: 1탄 = https://www.youtube.com/watch?v=mlhKEy-2bgI

**이 섹션 데모의 공통점**: 레이아웃 카드는 **폭 슬라이더**(320px ↔ 1280px)로 미니 화면의 폭을 바꿔 가며 보여 준다. 반응형 동작이 핵심이라 고정 스크린샷으로는 안 된다.

---

## Layout

### Hero Section
- **무엇**: 사이트에 들어오자마자 보이는 첫 영역이다. 제목, 짧은 설명, CTA 버튼, 대표 이미지로 "무엇인지"를 한눈에 알린다.
- **데모**: 미니 랜딩 화면. 각 구성 요소에 마우스를 올리면 이름표(제목 / 설명 / CTA / 이미지)가 뜬다.
- **요청 예문**: "랜딩 첫 화면을 Hero Section으로: 한 줄 제목, 두 줄 설명, 'Start for Free' CTA 버튼, 오른쪽에 제품 이미지."
- **구현**: `<section>` + `<h1>`, CTA는 이동이면 `<a>`, 동작이면 `<button>`
- **관계**: CTA(Call to Action) = 구성 요소. "가장 누르게 하고 싶은 버튼"
- **출처**: 1탄 1:03~1:32

### Grid Layout *(추가)*
- **무엇**: 행과 열을 정하고, 각 항목이 몇 칸을 차지할지 지정하는 배치다.
- **데모**: 격자선을 켜고 끌 수 있다. 요약 카드 하나를 "2열 차지"로 바꾸면 나머지가 어떻게 밀리는지 보여 준다.
- **요청 예문**: "대시보드를 4열 Grid Layout으로 하고, 요약 카드는 2열을 차지하게."
- **구현**: `display: grid`, `grid-template-columns`, `grid-column: span 2`, `gap`
- **관계**: Bento Grid·Masonry Layout의 기준이다. 세 카드를 서로 연결한다
- **출처**: [W3C CSS Grid](https://www.w3.org/TR/css-grid/)

### Bento Grid
- **무엇**: 중요한 항목은 크게, 보조 항목은 작게 셀 크기를 다르게 한 격자다. 이름은 칸이 나뉜 일본 도시락(bento)에서 왔다.
- **데모**: 같은 카드 5개를 Grid(같은 크기)와 Bento(크기 차등)로 전환하며 보여 준다.
- **요청 예문**: "핵심 기능은 큰 카드, 나머지는 작은 카드로 Bento Grid 섹션. 모바일은 1열."
- **구현**: Grid + `grid-column`/`grid-row` span, `grid-auto-flow: dense`
- **관계**: Grid Layout의 응용. Masonry와 비교하면, Bento는 *중요도*로 크기를 정하고 Masonry는 *내용 높이*에 따라 채운다
- **출처**: 1탄 2:38

### Masonry Layout *(추가)*
- **무엇**: 높이가 제각각인 항목을, 빈 공간이 남은 열에 차례로 채워 넣는 배치다. Pinterest식 배치가 대표 예다.
- **데모**: 높이가 다른 카드 10장. Grid(행 정렬 때문에 빈 칸이 생김)와 Masonry(빈 칸 없음)를 전환한다.
- **요청 예문**: "이미지 갤러리를 3열 Masonry Layout으로, 이미지 원래 비율 유지."
- **구현**: CSS Masonry는 W3C 초안 단계라 **브라우저 지원이 진행 중**이다. 당장은 `columns: 3`으로 흉내 내거나(이 경우 순서가 세로로 흐름) JS로 배치한다
- **관계**: Bento Grid와 비교(위 참고)
- **출처**: [W3C CSS Grid Level 3 초안](https://www.w3.org/TR/css-grid-3/). 구현할 때 현재 지원 상태를 다시 확인한다

### Sidebar Layout
- **무엇**: 왼쪽에 메뉴, 오른쪽에 작업 영역을 두는 구조다. 메뉴를 눌러도 오른쪽 내용만 바뀐다.
- **데모**: 미니 관리자 화면. 메뉴 항목을 누르면 오른쪽만 바뀐다. 폭을 줄이면 사이드바가 햄버거 메뉴로 접힌다.
- **요청 예문**: "왼쪽에 고정 사이드바 내비게이션, 오른쪽에 메인 콘텐츠인 대시보드 레이아웃."
- **구현**: `grid-template-columns: 240px 1fr`, 사이드바는 `position: sticky` 또는 독립 스크롤
- **관계**: 좁은 화면에서는 Drawer로 바뀌는 경우가 흔하다 검색 별칭: Side Nav.
- **출처**: 1탄 2:38~3:09

### Sticky Header
- **무엇**: 스크롤해도 상단에 붙어 있는 헤더다.
- **데모**: 내부 스크롤 영역에서 헤더가 붙는 순간을 보여 준다. 일반 헤더와 나란히 비교한다.
- **요청 예문**: "상단 내비게이션을 Sticky Header로, 스크롤 중에도 보이게."
- **구현**: `position: sticky; top: 0`. 부모 요소에 `overflow: hidden`이 있으면 동작하지 않는다
- **관계**: Pin과 비교. Sticky Header는 *계속* 붙어 있고, Pin은 *정해진 스크롤 구간 동안만* 고정된다
- **출처**: 1탄 3:09

### Split Layout
- **무엇**: 이미지와 텍스트를 좌우로 나누는 배치다. 좁아지면 위아래로 쌓인다.
- **데모**: 50/50 배치. 폭 슬라이더를 움직이면 세로로 쌓인다. 비율을 50/50 ↔ 40/60으로 바꿔 볼 수 있다.
- **요청 예문**: "데스크톱은 이미지·설명을 50/50 Split Layout으로, 모바일은 세로로 쌓기."
- **구현**: `grid-template-columns: 1fr 1fr` + breakpoint에서 `1fr`
- **출처**: 1탄 3:42

### Aspect Ratio *(shadcn)*
- **무엇**: 내용을 정해진 가로세로 비율(16:9, 4:3, 1:1)로 고정하는 상자다. 이미지가 늦게 로드돼도 자리가 미리 잡혀서 레이아웃이 튀지 않는다.
- **데모**: 같은 이미지를 16:9 / 4:3 / 1:1로 전환한다. "비율 고정 끔"으로 바꾸면 이미지 로드 전후에 아래 내용이 밀리는 것(layout shift)을 보여 준다.
- **요청 예문**: "썸네일을 16:9 Aspect Ratio로 고정하고 이미지는 object-fit: cover."
- **구현**: CSS `aspect-ratio: 16 / 9`, `object-fit: cover`
- **shadcn**: Aspect Ratio · `pnpm dlx shadcn@latest add aspect-ratio` (`ratio={16 / 9}` prop)
- **출처**: [shadcn aspect-ratio](https://ui.shadcn.com/docs/components/base/aspect-ratio)

### Resizable *(shadcn)*
- **무엇**: 경계선을 끌어서 크기를 바꿀 수 있는 분할 패널이다. 예: 코드 에디터의 파일 목록 / 편집기 / 미리보기.
- **데모**: 가로 3분할 패널. 손잡이를 마우스로 끌거나, 키보드(포커스 후 화살표)로 크기를 바꾼다. 가로/세로 방향을 전환할 수 있다.
- **요청 예문**: "왼쪽 파일 목록과 오른쪽 편집기를 Resizable 패널로, 왼쪽은 최소 200px."
- **구현**: 손잡이에 `role="separator"` + `aria-valuenow`, pointer 이벤트로 크기 계산
- **관계**: Split Layout과 비교. Split은 *비율이 고정*되고, Resizable은 *사용자가 바꾼다* 검색 별칭: Resize Handle.
- **shadcn**: Resizable · `pnpm dlx shadcn@latest add resizable` (react-resizable-panels 기반)
- **출처**: [shadcn resizable](https://ui.shadcn.com/docs/components/base/resizable)

### Scroll Area *(shadcn)*
- **무엇**: 정해진 영역 안에서만 스크롤되는 상자다. 브라우저마다 다른 스크롤바 모양을 통일한다.
- **데모**: 긴 태그 목록을 높이 200px 안에서 세로로 스크롤한다. 가로 스크롤 예시도 있다. 기본 `overflow: auto`와 나란히 비교한다.
- **요청 예문**: "태그 목록을 높이 200px Scroll Area로, 얇은 커스텀 스크롤바."
- **구현**: `overflow: auto`, `scrollbar-width`, `scrollbar-color`
- **관계**: Message Scroller와 비교. Scroll Area는 *범용* 스크롤이고, Message Scroller는 채팅 전용 규칙(새 메시지 따라가기 등)이 있다 검색 별칭: Scrollable Area.
- **shadcn**: Scroll Area · `pnpm dlx shadcn@latest add scroll-area`
- **출처**: [shadcn scroll-area](https://ui.shadcn.com/docs/components/base/scroll-area)

### Separator *(shadcn)*
- **무엇**: 내용 묶음 사이를 나누는 가로선 또는 세로선이다.
- **데모**: 메뉴 그룹 사이의 가로선, 툴바 버튼 사이의 세로선.
- **요청 예문**: "설정 그룹 사이에 Separator, 툴바 버튼 사이엔 세로 Separator."
- **구현**: `<hr>` 또는 `role="separator"`. 장식용이면 `aria-hidden`
- **shadcn**: Separator · `pnpm dlx shadcn@latest add separator`
- **관계**: 검색 별칭: Divider.
- **출처**: [shadcn separator](https://ui.shadcn.com/docs/components/base/separator)

### Direction (RTL) *(shadcn)*
- **무엇**: 글을 쓰는 방향을 정한다. 아랍어·히브리어는 오른쪽에서 왼쪽(RTL)으로 쓰고, 이때 레이아웃 전체가 좌우 반전된다.
- **데모**: 같은 카드 UI를 LTR ↔ RTL로 전환한다. 아이콘, 여백, 화살표 방향이 같이 뒤집히는 것을 보여 준다.
- **요청 예문**: "앱 전체를 Direction provider로 감싸고 RTL 언어일 때 레이아웃 반전."
- **구현**: `dir="rtl"`, 논리 속성(`margin-inline-start`, Tailwind `ms-*`·`ps-*`)
- **shadcn**: Direction · `pnpm dlx shadcn@latest add direction` (화면 요소 없음. `DirectionProvider`와 `useDirection()`만 제공)
- **출처**: [shadcn direction](https://ui.shadcn.com/docs/components/base/direction)
### App Shell *(추가)*
- **무엇**: 앱을 둘러싸는 공통 구조다. 상단 바와 탐색 영역을 유지하고 가운데 화면만 바꾼다.
- **데모**: 미니 앱에서 문서와 알림을 오간다. 상단 바와 탐색의 위치는 유지된다.
- **요청 예문**: "문서와 알림에 같은 App Shell을 쓰고 가운데 작업 영역만 전환해 줘."
- **구현**: 공통 header, nav, main과 콘텐츠 슬롯
- **관계**: Sidebar Layout은 옆 메뉴 배치이고, App Shell은 그 메뉴를 포함하는 공통 틀이다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/main)

### Container *(추가)*
- **무엇**: 콘텐츠의 최대 너비와 양쪽 여백을 정하는 바깥 영역이다.
- **데모**: 폭을 바꾸고 최대 너비 제한을 켜거나 끈다. 화면과 콘텐츠 너비를 숫자로 비교한다.
- **요청 예문**: "본문을 최대 720px인 Container에 넣고 가운데 정렬해 줘."
- **구현**: max-width, margin-inline: auto, padding-inline
- **관계**: Container는 바깥 너비를 정하고, Grid Layout은 안쪽 항목을 배치한다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/max-width)

### Stack *(추가)*
- **무엇**: 항목을 한 방향으로 나열하고 일정한 간격을 두는 레이아웃이다.
- **데모**: 같은 항목을 세로와 가로로 바꾸고 gap을 조절한다.
- **요청 예문**: "설정 항목을 세로 Stack으로 놓고 간격은 16px로 맞춰 줘."
- **구현**: display: flex, flex-direction, gap
- **관계**: Stack은 한 축을 사용하고, Grid Layout은 행과 열을 함께 정할 수 있다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox)

---

## Navigation & Menu

### Tabs
- **무엇**: 한 공간에서 탭을 바꿔 가며 다른 내용을 보여 준다. 페이지를 새로 불러오지 않는다.
- **데모**: 개요 / 기능 / 가격 탭. 키보드 화살표로 이동할 수 있다. 선택된 탭이 강조된다.
- **요청 예문**: "개요·기능·가격을 Tabs 컴포넌트로, 선택된 탭 강조, 화살표 키 이동."
- **구현**: `role="tablist"` / `"tab"` / `"tabpanel"`, `aria-selected`, 화살표 키 처리(WAI-ARIA APG Tabs)
- **관계**: Accordion과 비교. Tabs는 *가로로 전환*하고, Accordion은 *세로로 펼친다* 검색 별칭: Tab List.
- **출처**: 1탄 4:11

### Breadcrumb *(shadcn)*
- **무엇**: 현재 페이지가 사이트 계층의 어디에 있는지 "홈 > 설정 > 알림"처럼 경로로 보여 준다.
- **데모**: 3단계 경로. 중간 단계를 누르면 그 위치로 이동한다. 경로가 길면 가운데 단계를 "…"로 접는다.
- **요청 예문**: "상단에 홈 > 프로젝트 > 설정 Breadcrumb, 마지막은 현재 페이지라 링크 없음."
- **구현**: `<nav aria-label="breadcrumb">` + `<ol>`, 현재 항목은 `aria-current="page"`
- **shadcn**: Breadcrumb · `pnpm dlx shadcn@latest add breadcrumb`
- **관계**: 검색 별칭: Breadcrumbs.
- **출처**: [shadcn breadcrumb](https://ui.shadcn.com/docs/components/base/breadcrumb)

### Navigation Menu *(shadcn)*
- **무엇**: 사이트 상단의 링크 묶음이다. 항목에 마우스를 올리거나 클릭하면 하위 링크 패널(메가 메뉴)이 펼쳐진다.
- **데모**: "제품 / 자료 / 가격" 상단 메뉴. "제품"을 열면 링크와 설명이 있는 패널이 나온다. 키보드로 이동할 수 있다.
- **요청 예문**: "상단에 Navigation Menu, '제품'에 마우스를 올리면 링크 6개짜리 패널."
- **구현**: `<nav>` + 링크, 패널 열림은 `aria-expanded`
- **관계**: Menubar와 비교. Navigation Menu는 *사이트 이동 링크*, Menubar는 *앱 명령*이다 검색 별칭: Top Nav, Mega Menu.
- **shadcn**: Navigation Menu · `pnpm dlx shadcn@latest add navigation-menu`
- **출처**: [shadcn navigation-menu](https://ui.shadcn.com/docs/components/base/navigation-menu)

### Menubar *(shadcn)*
- **무엇**: 데스크톱 앱처럼 "파일 / 편집 / 보기" 메뉴가 항상 보이는 가로 막대다. 각 메뉴에 명령 목록이 있다.
- **데모**: 미니 에디터 상단의 Menubar. 체크 항목("줄 번호 보기"), 라디오 항목, 하위 메뉴, 단축키 표시가 있다.
- **요청 예문**: "에디터 상단에 파일·편집·보기 Menubar, 항목 옆에 단축키 표시."
- **구현**: WAI-ARIA APG Menubar 패턴(`role="menubar"`, 좌우 화살표 이동)
- **관계**: Dropdown Menu는 버튼 *하나*의 메뉴이고, Menubar는 *여러 메뉴가 항상 보이는* 막대다. Context Menu와도 비교
- **shadcn**: Menubar · `pnpm dlx shadcn@latest add menubar`
- **출처**: [shadcn menubar](https://ui.shadcn.com/docs/components/base/menubar)

### Dropdown Menu *(Dropdown에서 분리)*
- **무엇**: 버튼 하나 아래로 **명령** 목록이 펼쳐진다. 예: 복제, 이름 변경, 삭제.
- **데모**: "⋯" 버튼 → 메뉴. 항목을 고르면 *동작이 실행*된다(값은 남지 않는다). 키보드 화살표로 이동한다.
- **요청 예문**: "카드의 ⋯ 버튼을 누르면 복제·삭제가 있는 Dropdown Menu."
- **구현**: WAI-ARIA APG Menu Button 패턴(`aria-haspopup`, `role="menu"`), `popover` 속성
- **관계**: Select와 비교. Menu는 *명령 실행*, Select는 *값 선택*이다. 영상의 Dropdown 예시(정렬 기준 선택)는 실제로는 Select다 검색 별칭: More Menu.
- **출처**: 1탄 5:13~5:43, [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

### Context Menu *(shadcn)*
- **무엇**: 오른쪽 클릭(모바일은 길게 누르기)으로 여는 메뉴다. 평소에는 보이지 않는다.
- **데모**: 파일 아이콘을 오른쪽 클릭하면 이름 변경 / 복제 / 삭제 메뉴가 뜬다. 키보드 사용자를 위해 Shift+F10과 ⋯ 버튼 대안을 함께 보여 준다.
- **요청 예문**: "파일 항목을 오른쪽 클릭하면 이름 변경·복제·삭제 Context Menu."
- **구현**: `contextmenu` 이벤트. 숨겨진 기능이라 같은 명령을 다른 경로(⋯ 버튼)로도 제공해야 한다
- **관계**: Dropdown Menu와 비교. 내용은 같고 *여는 방법*만 다르다
- **shadcn**: Context Menu · `pnpm dlx shadcn@latest add context-menu`
- **출처**: [shadcn context-menu](https://ui.shadcn.com/docs/components/base/context-menu)

### Command (Command Palette) *(shadcn)*
- **무엇**: ⌘K를 누르면 뜨는, 입력으로 명령이나 페이지를 검색해 실행하는 팔레트다.
- **데모**: ⌘K / Ctrl+K로 연다. "설정"을 입력하면 결과가 좁혀지고, 화살표와 Enter로 실행한다. 그룹(페이지 / 명령)과 단축키가 표시된다.
- **요청 예문**: "⌘K로 여는 Command Palette, 페이지 이동과 명령을 그룹으로 나눠 검색."
- **구현**: 키보드 단축키 리스너 + Dialog + 필터링 목록(`role="listbox"`)
- **관계**: Editable Combobox와 비교. Combobox는 *값을 고르고*, Command는 *동작을 실행*한다 검색 별칭: Command Palette.
- **shadcn**: Command · `pnpm dlx shadcn@latest add command` (cmdk 기반, `CommandDialog` 포함)
- **출처**: [shadcn command](https://ui.shadcn.com/docs/components/base/command)
### Stepper *(추가)*
- **무엇**: 여러 단계의 순서와 현재 위치, 완료 여부를 한눈에 보여 주는 탐색이다.
- **데모**: 이전과 다음으로 배송 정보를 입력하는 3단계 흐름을 살펴본다. 현재 단계와 완료 상태를 글자로 표시한다.
- **요청 예문**: "주문을 배송·결제·확인의 3단계로 나누고 Stepper에 현재 단계를 표시해 줘."
- **구현**: 순서 있는 목록, aria-current="step", 단계 변경 후 제목 포커스
- **관계**: Stepper는 흐름의 위치를 보여 주고, Questionnaire는 질문과 응답을 관리한다.
- **출처**: [원문](https://designsystem.digital.gov/components/step-indicator/)

### Outline (Table of Contents) *(추가)*
- **무엇**: 긴 문서에서 제목별 위치를 알리고 원하는 부분으로 이동시키는 목차다.
- **데모**: 미니 문서의 세 제목을 클릭하거나 Enter로 선택하면 각 제목으로 이동한다.
- **요청 예문**: "가이드의 각 h2로 이동하는 Outline을 달아 줘."
- **구현**: nav, 제목 ID, 프래그먼트 링크, aria-current="location"
- **관계**: Outline은 같은 문서 안의 제목을 연결하고, Breadcrumb은 사이트 계층을 표시한다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)

### Toolbar *(추가)*
- **무엇**: 한 작업에 필요한 도구 버튼을 모아 둔 줄이다.
- **데모**: 편집 도구의 왼쪽·가운데·오른쪽 정렬을 바꾼다. 화살표로 도구 사이를 이동한다.
- **요청 예문**: "편집기 위에 정렬 Toolbar를 두고 좌우 화살표로 도구를 고르게 해 줘."
- **구현**: role="toolbar", aria-label, roving tabindex
- **관계**: Toolbar는 작업 맥락과 키보드 이동 규칙을 갖고, Button Group은 관련 버튼을 한 묶음으로 표시한다.
- **출처**: [원문](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

---

## Overlay

### Modal Dialog
- **무엇**: 현재 화면 위에 창을 띄우고, 그 창을 먼저 처리하게 만드는 UI다. 배경은 어둡게 막힌다.
- **데모**: "삭제" 버튼 → 확인 창. 배경 클릭, ESC, 취소 버튼으로 닫는다. 열려 있는 동안 Tab 키 포커스가 창 안에만 머무는 것을 표시한다.
- **요청 예문**: "삭제 버튼을 누르면 확인 Modal Dialog, 취소 버튼이나 ESC로 닫힘."
- **구현**: `<dialog>` + `showModal()`(포커스 가두기와 ESC를 브라우저가 처리), `::backdrop`
- **관계**: Overlay / Backdrop = 구성 요소(배경을 가리는 반투명 층). 비모달 Dialog(`show()`)는 배경을 막지 않는다. Drawer와 비교하면, Modal은 *중앙에서 집중을 요구*하고 Drawer는 *옆에서 덜 방해*한다
- **출처**: 1탄 4:42~5:13, [HTML dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)

### Drawer
- **무엇**: 화면 옆에서 서랍처럼 밀려 나오는 패널이다. 설정, 필터, 상세 보기처럼 현재 페이지를 떠나지 않고 하는 보조 작업에 쓴다.
- **데모**: 설정 버튼 → 오른쪽에서 Drawer. 바깥 클릭이나 ESC로 닫는다. "모바일" 토글을 켜면 아래에서 올라오는 Bottom Sheet로 바뀐다.
- **요청 예문**: "설정 버튼을 누르면 오른쪽 Drawer가 열리고, 바깥 클릭이나 ESC로 닫힘."
- **구현**: `<dialog>` + `transform: translateX(100%)` → `0`. 들어오는 움직임은 Motion · Slide
- **관계**: Bottom Sheet = 변형(모바일에서 아래에서 올라옴). Modal Dialog와 비교(위 참고) 검색 별칭: Bottom Sheet.
- **출처**: 1탄 5:13

### Popover *(추가)*
- **무엇**: 트리거 옆에 **클릭할 수 있는 내용**을 띄운다. 예: 설정값, 공유 옵션.
- **데모**: Tooltip과 나란히 둔다. Tooltip은 *설명만* 보여 주고 마우스를 떼면 사라진다. Popover는 안에 버튼이나 입력이 있고 클릭으로 열고 닫는다.
- **요청 예문**: "공유 버튼을 누르면 링크 복사·이메일 버튼이 있는 Popover."
- **구현**: HTML `popover` 속성 + `popovertarget`, 위치는 CSS anchor positioning
- **관계**: Tooltip, Dropdown Menu와 비교
- **출처**: [HTML popover](https://html.spec.whatwg.org/dev/popover.html)

### Hover Card *(shadcn)*
- **무엇**: 링크나 사용자 이름에 마우스를 올리면 뜨는 **풍부한 미리보기**다. 예: 프로필 사진, 소개, 팔로워 수.
- **데모**: "@사용자" 링크에 hover나 focus를 하면 프로필 카드가 뜬다. Tooltip(글자만)과 Popover(클릭으로 열림)를 나란히 비교한다.
- **요청 예문**: "작성자 이름에 마우스를 올리면 프로필 Hover Card, 0.5초 지연 후 표시."
- **구현**: hover와 focus 둘 다에서 열기, 여는 지연과 닫는 지연. 마우스가 없는 기기에서는 내용에 도달할 다른 경로가 필요하다
- **관계**: Tooltip(짧은 설명) / Hover Card(미리보기) / Popover(클릭, 조작 가능) 세 가지 비교
- **shadcn**: Hover Card · `pnpm dlx shadcn@latest add hover-card`
- **출처**: [shadcn hover-card](https://ui.shadcn.com/docs/components/base/hover-card)

### Tooltip
- **무엇**: 아이콘이나 버튼의 뜻을 잠깐 설명하는 작은 창이다. 보충 설명만 담는다.
- **데모**: 도움말 아이콘. hover와 키보드 focus 양쪽에서 뜬다. ESC로 닫힌다.
- **요청 예문**: "설정 항목 옆 도움말 아이콘에 Tooltip, hover와 키보드 focus 둘 다."
- **구현**: `aria-describedby`. 마우스를 Tooltip 위로 옮겨도 사라지지 않고 ESC로 닫을 수 있어야 한다(WCAG 1.4.13)
- **관계**: Popover와 비교. Tooltip 안에 클릭할 것이 있어야 한다면 Popover를 써야 한다 검색 별칭: Info Tip.
- **출처**: 1탄 5:43~6:09
### Lightbox *(추가)*
- **무엇**: 클릭한 사진이나 영상을 어두운 배경 위에 크게 보는 화면이다.
- **데모**: 썸네일을 열어 확대 이미지를 보고, 이전·다음과 Esc로 조작한다.
- **요청 예문**: "사진을 누르면 Lightbox로 확대하고 좌우 버튼으로 사진을 넘기게 해 줘."
- **구현**: Dialog와 이미지, 이전·다음 버튼, Esc
- **관계**: Lightbox는 이미지 감상에 맞춘 Modal Dialog의 변형이다.
- **출처**: [원문](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

---

## Form & Input

### Button *(shadcn)*
- **무엇**: 동작을 실행하는 버튼이다. variant(기본 / 보조 / 외곽선 / 고스트 / 링크 / 위험)와 크기로 중요도를 구분한다.
- **데모**: variant 6종 × 크기 3종 표. 아이콘만 있는 버튼, 비활성, 로딩 상태도 있다.
- **요청 예문**: "주 행동은 기본 Button, 취소는 outline, 삭제는 destructive variant."
- **구현**: `<button>`(이동이면 `<a>`), 아이콘만 있으면 `aria-label`
- **shadcn**: Button · `pnpm dlx shadcn@latest add button`
- **관계**: 검색 별칭: Icon Button.
- **출처**: [shadcn button](https://ui.shadcn.com/docs/components/base/button)

### Button Group *(shadcn)*
- **무엇**: 관련된 버튼들을 테두리가 이어진 한 묶음으로 붙인 것이다. 예: 정렬(왼쪽 / 가운데 / 오른쪽), 이전 / 다음.
- **데모**: 따로 떨어진 버튼과 Button Group을 비교한다. 입력칸과 버튼을 붙인 예시도 있다.
- **요청 예문**: "복사·붙여넣기·잘라내기를 Button Group으로 붙여서 배치."
- **구현**: `role="group"` + `aria-label`, 가운데 버튼의 모서리 둥글기 제거
- **관계**: Toggle Group과 비교. Button Group은 *누르면 실행*되고, Toggle Group은 *눌린 상태가 남는다*
- **shadcn**: Button Group · `pnpm dlx shadcn@latest add button-group`
- **출처**: [shadcn button-group](https://ui.shadcn.com/docs/components/base/button-group)

### Toggle *(shadcn)*
- **무엇**: 켜짐 / 꺼짐 두 상태를 가진 버튼이다. 예: 텍스트 에디터의 **굵게** 버튼.
- **데모**: B / I / U 토글. 눌린 상태가 모양과 텍스트(켜짐/꺼짐)로 함께 표시된다.
- **요청 예문**: "에디터 툴바에 굵게 Toggle, 눌린 상태 유지."
- **구현**: `<button aria-pressed="true|false">`
- **관계**: Switch와 비교. Toggle은 *도구 상태*(굵게), Switch는 *설정 켜고 끄기*(알림 받기) 검색 별칭: Toggle Button.
- **shadcn**: Toggle · `pnpm dlx shadcn@latest add toggle`
- **출처**: [shadcn toggle](https://ui.shadcn.com/docs/components/base/toggle)

### Toggle Group *(shadcn)*
- **무엇**: Toggle 여러 개를 묶은 것이다. 하나만 고를 수도(정렬), 여러 개를 고를 수도(굵게+기울임) 있다.
- **데모**: 정렬(하나만 선택)과 서식(여러 개 선택)을 전환한다. 화살표 키로 이동한다.
- **요청 예문**: "텍스트 정렬을 single Toggle Group으로, 서식은 multiple Toggle Group으로."
- **구현**: single이면 라디오와 비슷한 의미(`role="radiogroup"` 또는 `aria-pressed`), 화살표 키 이동
- **관계**: Radio Group과 비교. 보이는 형태가 버튼이냐 동그라미냐의 차이고, 단일 선택이라는 의미는 같다 검색 별칭: Segmented Control, Toggle Button Group.
- **shadcn**: Toggle Group · `pnpm dlx shadcn@latest add toggle-group`
- **출처**: [shadcn toggle-group](https://ui.shadcn.com/docs/components/base/toggle-group)

### Input *(shadcn)*
- **무엇**: 한 줄 텍스트 입력칸이다. `type`(email, password, number, search)에 따라 모바일 키보드와 검증이 달라진다.
- **데모**: type 4종을 나란히 둔다. 모바일 폭에서 type마다 다른 키보드 힌트를 텍스트로 안내한다. 비활성, 오류 상태도 있다.
- **요청 예문**: "이메일 Input은 type=email, autocomplete=email."
- **구현**: `<input type autocomplete inputmode>`
- **shadcn**: Input · `pnpm dlx shadcn@latest add input`
- **출처**: [shadcn input](https://ui.shadcn.com/docs/components/base/input)

### Input Group *(shadcn)*
- **무엇**: 입력칸 안이나 옆에 아이콘, 글자, 버튼을 붙인 것이다. 예: 돋보기 아이콘이 있는 검색창, "https://" 접두어, 전송 버튼.
- **데모**: 검색(앞에 아이콘), URL(앞에 글자 + 뒤에 복사 버튼), 채팅 입력(뒤에 전송 버튼) 세 가지.
- **요청 예문**: "검색 Input Group: 앞에 돋보기 아이콘, 뒤에 ⌘K 표시."
- **구현**: 바깥 테두리를 감싸는 요소에 `:focus-within` 스타일
- **관계**: Field(라벨·도움말·오류를 감싸는 껍데기)와 다르다. Input Group은 *입력칸 하나를 꾸민다*
- **shadcn**: Input Group · `pnpm dlx shadcn@latest add input-group`
- **출처**: [shadcn input-group](https://ui.shadcn.com/docs/components/base/input-group)

### Input OTP *(shadcn)*
- **무엇**: 인증번호 6자리처럼 칸이 나뉜 일회용 코드 입력이다. 한 칸에 입력하면 다음 칸으로 넘어가고, 붙여넣기도 된다.
- **데모**: 6칸. 입력, 지우기(Backspace로 앞 칸 이동), "123456" 붙여넣기를 해 본다.
- **요청 예문**: "6자리 Input OTP, 붙여넣기 지원, 다 채우면 자동 제출."
- **구현**: 실제로는 `<input autocomplete="one-time-code" inputmode="numeric" maxlength="6">` 하나에 칸 모양만 입힌다
- **shadcn**: Input OTP · `pnpm dlx shadcn@latest add input-otp`
- **출처**: [shadcn input-otp](https://ui.shadcn.com/docs/components/base/input-otp)

### Textarea *(shadcn)*
- **무엇**: 여러 줄 텍스트 입력칸이다.
- **데모**: 고정 높이 vs 내용에 따라 자동으로 늘어나는 높이. 글자 수 카운터가 있다.
- **요청 예문**: "의견 입력은 Textarea, 내용에 따라 높이 자동 증가, 최대 500자 카운터."
- **구현**: `<textarea>`, 자동 높이는 CSS `field-sizing: content`
- **shadcn**: Textarea · `pnpm dlx shadcn@latest add textarea`
- **출처**: [shadcn textarea](https://ui.shadcn.com/docs/components/base/textarea)

### Label *(shadcn)*
- **무엇**: 입력칸의 이름표다. 라벨을 눌러도 입력칸이 선택되고, 스크린리더가 입력칸 이름으로 읽는다.
- **데모**: 라벨이 연결된 입력칸과 연결 안 된 입력칸. 라벨 글자를 클릭해서 차이를 직접 확인한다.
- **요청 예문**: "모든 입력칸에 Label 연결, placeholder로 라벨을 대신하지 않기."
- **구현**: `<label for="id">`
- **관계**: Field의 구성 요소
- **shadcn**: Label · `pnpm dlx shadcn@latest add label`
- **출처**: [shadcn label](https://ui.shadcn.com/docs/components/base/label)

### Field *(shadcn)*
- **무엇**: 라벨, 입력칸, 도움말, 오류 메시지를 한 단위로 묶는 폼 필드 껍데기다. 여러 필드를 묶은 fieldset도 포함한다.
- **데모**: 회원가입 필드 3개. 잘못 입력하면 도움말 대신 오류 메시지가 뜬다(아이콘과 글자로 표시). 세로 배치와 가로 배치를 전환할 수 있다.
- **요청 예문**: "회원가입 폼을 Field로 구성: 라벨, 도움말, 오류 메시지, 오류 시 입력칸 강조."
- **구현**: `<fieldset>` + `<legend>`, `aria-describedby`(도움말·오류), `aria-invalid`
- **관계**: Label = 구성 요소. Error State와 연결(폼 오류) 검색 별칭: Form Layout.
- **shadcn**: Field · `pnpm dlx shadcn@latest add field`
- **출처**: [shadcn field](https://ui.shadcn.com/docs/components/base/field)

### Checkbox *(shadcn)*
- **무엇**: 독립적인 항목을 켜고 끄는 체크 상자다. 여러 개를 동시에 고를 수 있다. 일부만 선택된 "중간 상태"(indeterminate)도 있다.
- **데모**: "전체 선택" + 항목 3개. 일부만 고르면 전체 선택 상자가 중간 상태(−)가 된다.
- **요청 예문**: "목록 위에 전체 선택 Checkbox, 일부 선택 시 indeterminate 표시."
- **구현**: `<input type="checkbox">`, `indeterminate`는 JS 속성
- **관계**: Switch와 비교. Checkbox는 *제출할 때 반영*되고, Switch는 *즉시 반영*된다(관례)
- **shadcn**: Checkbox · `pnpm dlx shadcn@latest add checkbox`
- **출처**: [shadcn checkbox](https://ui.shadcn.com/docs/components/base/checkbox)

### Radio Group *(shadcn)*
- **무엇**: 여러 선택지 중 **하나만** 고르는 동그라미 버튼 묶음이다. 선택지가 모두 펼쳐져 있다.
- **데모**: 배송 방법 3개. 화살표 키로 선택이 이동한다. Select로 같은 선택을 했을 때와 비교한다.
- **요청 예문**: "배송 방법을 Radio Group으로, 선택지마다 설명 한 줄."
- **구현**: `<input type="radio" name>` + `<fieldset>`
- **관계**: Select와 비교. 선택지가 적고(2~5개) 비교가 필요하면 Radio Group, 많으면 Select. Toggle Group과도 비교 검색 별칭: Radio List.
- **shadcn**: Radio Group · `pnpm dlx shadcn@latest add radio-group`
- **출처**: [shadcn radio-group](https://ui.shadcn.com/docs/components/base/radio-group)

### Switch *(shadcn)*
- **무엇**: 설정을 **즉시** 켜고 끄는 스위치다. 예: 알림 받기, 다크 모드.
- **데모**: "알림 받기" Switch를 켜면 아래 설정이 바로 활성화된다. 켜짐/꺼짐을 위치와 글자로 함께 표시한다.
- **요청 예문**: "알림 설정을 Switch로, 바꾸면 즉시 저장되고 Toast로 확인."
- **구현**: `<button role="switch" aria-checked>`
- **관계**: Checkbox, Toggle과 비교
- **shadcn**: Switch · `pnpm dlx shadcn@latest add switch`
- **출처**: [shadcn switch](https://ui.shadcn.com/docs/components/base/switch)

### Slider *(shadcn)*
- **무엇**: 막대 위의 손잡이를 끌어서 범위 안의 값을 고른다. 손잡이 두 개로 범위(최소~최대)를 고를 수도 있다.
- **데모**: 음량(단일 값), 가격 범위(두 손잡이). 키보드 화살표, Home/End, PageUp/PageDown으로 조작한다. 현재 값을 숫자로 표시한다.
- **요청 예문**: "가격 필터를 두 손잡이 Slider로, 1만 원 단위, 현재 범위를 숫자로 표시."
- **구현**: `<input type="range">`(단일 값), 범위는 `role="slider"` 두 개 + `aria-valuetext`
- **관계**: 이 대시보드의 폭 조절 슬라이더가 이것이다
- **shadcn**: Slider · `pnpm dlx shadcn@latest add slider`
- **출처**: [shadcn slider](https://ui.shadcn.com/docs/components/base/slider)

### Select *(Dropdown에서 분리)*
- **무엇**: 정해진 목록에서 **값 하나**를 고른다. 고른 값이 버튼에 남는다.
- **데모**: 정렬 기준(최신·인기·이름) 선택. 고르면 아래 목록이 다시 정렬된다.
- **요청 예문**: "정렬 기준을 최신·인기·이름 중에서 고르는 Select."
- **구현**: `<select>`(네이티브가 접근성·모바일 UI를 공짜로 준다). 커스텀이면 APG select-only Combobox
- **관계**: 검색 별칭: Selector.
- **출처**: 1탄 5:43(영상의 정렬 예시), [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

### Editable Combobox *(Dropdown에서 분리)*
- **무엇**: **입력하면서** 후보를 검색하거나 제안받는다. 예: 도시 검색, 태그 입력.
- **데모**: 도시 이름을 입력하면 후보 목록이 좁혀진다. 화살표 키로 고르고 Enter로 확정한다.
- **요청 예문**: "도시 입력칸을 Editable Combobox로, 두 글자부터 후보 제안."
- **구현**: `<input list>` + `<datalist>`(가장 간단한 방법), APG Combobox(editable)
- **관계**: Select와 비교. 목록이 길고 사용자가 이름을 안다면 Combobox가 맞다 검색 별칭: Typeahead.
- **출처**: [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

### Calendar *(shadcn)*
- **무엇**: 화면에 항상 펼쳐진 달력이다. 날짜 하나나 기간을 고른다.
- **데모**: 날짜 하나 선택 / 기간 선택을 전환한다. 예약 불가 날짜는 비활성으로 표시한다. 키보드 화살표로 날짜를 이동한다.
- **요청 예문**: "예약 페이지에 기간 선택 Calendar, 지난 날짜와 마감일은 비활성."
- **구현**: 달력 표(`role="grid"`), 화살표 키 이동
- **관계**: Date Picker와 비교. Calendar는 *항상 펼쳐져* 있고, Date Picker는 *버튼을 눌러 연다*
- **shadcn**: Calendar · `pnpm dlx shadcn@latest add calendar` (react-day-picker 기반)
- **출처**: [shadcn calendar](https://ui.shadcn.com/docs/components/base/calendar)

### Date Picker *(shadcn)*
- **무엇**: 버튼이나 입력칸을 누르면 달력이 팝업으로 열리는 날짜 선택기다. shadcn에서는 Popover와 Calendar를 조합해서 만든다.
- **데모**: "날짜 선택" 버튼 → Popover 안의 Calendar. 고르면 버튼 글자가 그 날짜로 바뀐다. 기간 선택 버전도 있다. 네이티브 `<input type="date">`와 비교한다.
- **요청 예문**: "마감일 입력을 Date Picker로, 선택 후 'YYYY년 M월 D일' 형식으로 표시."
- **구현**: Popover + Calendar 조합, 날짜 표시는 `Intl.DateTimeFormat`. 가장 간단한 방법은 `<input type="date">`
- **관계**: Calendar + Popover = 구성 요소 검색 별칭: Date Input, Date Range Input, Date Time Input.
- **shadcn**: Date Picker · 별도 add 명령 없음(`popover`, `calendar`를 설치해서 조합)
- **출처**: [shadcn date-picker](https://ui.shadcn.com/docs/components/base/date-picker)
### Multi Selector *(추가)*
- **무엇**: 정해진 후보에서 여러 값을 선택하는 입력이다.
- **데모**: 세 가지 알림 주제 중 여러 항목을 체크하고 선택 개수를 확인한다.
- **요청 예문**: "알림 설정을 Multi Selector로 만들어 여러 주제를 동시에 고르게 해 줘."
- **구현**: checkbox 그룹 또는 aria-multiselectable이 지정된 listbox
- **관계**: Select 데모는 값 하나를 고르고, Multi Selector는 여러 값을 유지한다.
- **출처**: [원문](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)

### Tokenizer (Tag Input) *(추가)*
- **무엇**: 입력한 텍스트를 여러 개의 독립된 토큰으로 바꾸는 입력이다.
- **데모**: 태그를 입력하고 Enter로 추가한다. 토큰은 각 삭제 버튼으로 제거한다.
- **요청 예문**: "태그 입력에서 Enter를 누르면 Token을 추가하고 개별 삭제를 지원해 줘."
- **구현**: 폼 제출 처리, 값 배열, 토큰 제거 버튼
- **관계**: Tokenizer는 토큰을 만드는 입력이고, Token은 생성된 값의 표현이다.
- **출처**: [원문](https://react-spectrum.adobe.com/react-aria/TagGroup.html)

### Number Input *(추가)*
- **무엇**: 숫자를 입력하고 일정한 단위로 늘리거나 줄이는 입력이다.
- **데모**: 수량을 입력하거나 −·+와 화살표로 조절한다. 0~10 범위를 표시한다.
- **요청 예문**: "수량 Number Input에 최소 0, 최대 10과 증감 버튼을 넣어 줘."
- **구현**: input type="number"와 min/max/step, spinbutton 키보드 규칙
- **관계**: Number Input은 정확한 값을 직접 입력하고, Slider는 범위에서 값을 고르는 데 유리하다.
- **출처**: [원문](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/)

### File Input (Dropzone) *(추가)*
- **무엇**: 파일을 선택하거나 지정된 영역에 끌어다 놓는 입력이다.
- **데모**: 파일 선택 또는 드래그로 이름과 크기만 로컬에 표시하고 제거한다.
- **요청 예문**: "첨부 입력에 Dropzone과 키보드로 열 수 있는 파일 선택을 함께 제공해 줘."
- **구현**: input type="file", dragover/drop, FileList
- **관계**: File Input은 파일을 받고, Attachment는 받은 파일과 상태를 표시한다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop)

### Power Search *(추가)*
- **무엇**: 텍스트 검색과 함께 상태나 유형 같은 조건을 조합하는 검색이다.
- **데모**: 검색어와 상태 필터를 함께 적용해 문서 목록을 좁힌다.
- **요청 예문**: "문서 검색에 이름 검색과 상태 조건을 함께 적용하는 Power Search를 만들어 줘."
- **구현**: 검색 폼과 필터 상태, 결과 수 출력
- **관계**: Power Search는 데이터를 조건으로 찾고, Command는 실행할 명령을 찾는다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/search)

### Rich Text Editor *(추가)*
- **무엇**: 글의 내용과 함께 굵게나 제목 같은 서식을 편집하는 도구다. 이 데모는 contentEditable 수준으로 흉내 내며 문서 모델, 실행 취소 이력 관리, 붙여넣기 정제를 갖춘 에디터가 아니다.
- **데모**: 편집 영역에 글을 입력하고 굵게와 제목 도구를 적용한다. 서식 없는 붙여넣기만 받는다.
- **요청 예문**: "간단한 메모에 굵게와 제목을 지원하는 Rich Text Editor를 만들어 줘."
- **구현**: contenteditable, Selection과 Range, 접근 가능한 Toolbar
- **관계**: Typography는 표시 스타일을 적용하고, Rich Text Editor는 내용과 서식을 편집한다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/contenteditable)

### Selectable Card *(추가)*
- **무엇**: 카드 전체가 선택지인 입력이다. 설명을 읽고 선택 상태를 남길 수 있다.
- **데모**: 설명과 함께 두 플랜을 Radio Group 카드로 표시한다. 화살표로 선택을 바꾼다.
- **요청 예문**: "요금제를 Selectable Card로 만들고 동시에 하나만 고르게 해 줘."
- **구현**: radio와 연결된 label, 선택·포커스 표시
- **관계**: Radio Group의 선택 의미를 유지하면서 각 선택지에 카드 크기의 클릭 영역을 제공한다.
- **출처**: [원문](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)

---

## Data Display

### Accordion
- **무엇**: 궁금한 항목만 펼쳐 보는 UI다. FAQ에 많이 쓴다.
- **데모**: FAQ 3개. 펼칠 때 화살표가 90° 돌아간다(제외한 Rotate 용어의 사례). "하나만 열림 / 여러 개 열림"을 전환할 수 있다.
- **요청 예문**: "FAQ를 Accordion으로, 질문을 누르면 답이 펼쳐지고 다시 누르면 접힘."
- **구현**: `<details>` / `<summary>`(네이티브), 커스텀이면 `aria-expanded`
- **출처**: 1탄 4:31~4:42

### Collapsible *(shadcn)*
- **무엇**: 패널 **하나**를 접고 펼친다. 예: "더 보기", "고급 설정 펼치기".
- **데모**: "고급 설정" 하나를 펼치고 접는다. 여러 항목이 있는 Accordion과 나란히 비교한다.
- **요청 예문**: "폼 하단의 고급 설정을 Collapsible로, 기본은 접힘."
- **구현**: `<details>`, 커스텀이면 `aria-expanded` + `aria-controls`
- **관계**: Accordion은 Collapsible *여러 개를 묶은 것*이다. Trace와 Bubble의 '더 보기'도 이것으로 만든다
- **shadcn**: Collapsible · `pnpm dlx shadcn@latest add collapsible`
- **출처**: [shadcn collapsible](https://ui.shadcn.com/docs/components/base/collapsible)

### Carousel
- **무엇**: 여러 카드를 좌우로 넘겨 보는 방식이다. 공간이 좁을 때 리뷰나 갤러리에 쓴다.
- **데모**: 리뷰 카드 5장. 좌우 버튼, 스와이프, 키보드로 넘긴다. 멈출 때 카드 단위로 정렬된다.
- **요청 예문**: "고객 리뷰를 Carousel로, 좌우 버튼과 모바일 스와이프."
- **구현**: `overflow-x: auto` + `scroll-snap-type: x mandatory`. 자동 넘김을 넣으면 정지 버튼이 필수다(WCAG 2.2.2)
- **관계**: Scroll Snap = 구현 수단. Pinned Horizontal Scroll과 비교하면, Carousel은 *가로 입력*(스와이프·버튼)이고 Pinned Horizontal Scroll은 *세로 스크롤을 가로 이동으로 바꾼다*
- **출처**: 1탄 6:09~6:41

### Avatar *(shadcn)*
- **무엇**: 사용자를 나타내는 작은 원형 이미지다. 이미지가 없거나 로드에 실패하면 이니셜로 대체한다.
- **데모**: 이미지 / 이미지 실패 시 이니셜 / 여러 명이 겹친 그룹("+3").
- **요청 예문**: "댓글 작성자 Avatar, 이미지 실패 시 이니셜 fallback."
- **구현**: `<img alt>` + `onError` 처리. 이름이 옆에 있으면 `alt=""`
- **shadcn**: Avatar · `pnpm dlx shadcn@latest add avatar`
- **출처**: [shadcn avatar](https://ui.shadcn.com/docs/components/base/avatar)

### Badge *(shadcn)*
- **무엇**: 상태나 분류를 나타내는 작은 라벨이다. 예: "신규", "진행 중", "베타".
- **데모**: variant 4종. 상태 배지를 색만이 아니라 아이콘과 글자로도 구분한다(성공 ✓ / 경고 ! / 오류 ×).
- **요청 예문**: "주문 상태를 Badge로: 결제 완료는 기본, 취소는 destructive, 아이콘 포함."
- **구현**: `<span>`. 상태를 색으로만 전달하지 않는다
- **관계**: Kbd와 비교(Kbd는 키보드 키 전용)
- **shadcn**: Badge · `pnpm dlx shadcn@latest add badge`
- **출처**: [shadcn badge](https://ui.shadcn.com/docs/components/base/badge)

### Kbd *(shadcn)*
- **무엇**: 키보드 키를 키캡 모양으로 표시한다. 예: ⌘ K, Ctrl + S.
- **데모**: 단축키 안내 목록. 버튼, 툴팁, 검색창 안에 들어간 예시.
- **요청 예문**: "검색창 오른쪽에 ⌘K를 Kbd로 표시."
- **구현**: HTML `<kbd>`
- **관계**: Command Palette, Input Group과 함께 자주 쓴다
- **shadcn**: Kbd · `pnpm dlx shadcn@latest add kbd`
- **출처**: [shadcn kbd](https://ui.shadcn.com/docs/components/base/kbd)

### Item *(shadcn)*
- **무엇**: "아이콘/이미지 + 제목 + 설명 + 오른쪽 버튼" 형태의 목록 행 한 줄이다. 설정 목록, 연결된 계정 목록 같은 데 쓴다.
- **데모**: 연결된 계정 3줄(아이콘, 이름, 설명, "연결 해제" 버튼). variant(기본 / 외곽선 / 흐림)와 크기를 전환한다.
- **요청 예문**: "연결된 서비스 목록을 Item으로: 왼쪽 로고, 이름과 설명, 오른쪽 관리 버튼."
- **구현**: flex 행, 목록이면 `<ul>`/`<li>`
- **관계**: Field와 비교. Item은 *보여 주기용*이고, 입력이 있으면 Field를 쓴다
- **shadcn**: Item · `pnpm dlx shadcn@latest add item`
- **출처**: [shadcn item](https://ui.shadcn.com/docs/components/base/item)

### Table *(shadcn)*
- **무엇**: 행과 열로 된 데이터 표다.
- **데모**: 주문 목록 표. 헤더, 줄무늬 행, 합계 행(footer), 좁은 폭에서 가로 스크롤.
- **요청 예문**: "주문 목록을 Table로, 금액 열은 오른쪽 정렬, 하단에 합계 행."
- **구현**: `<table>` + `<thead>`/`<tbody>`/`<tfoot>`, `<th scope>`, `<caption>`
- **관계**: Data Table은 이 Table에 정렬·필터·페이지 기능을 더한 것이다
- **shadcn**: Table · `pnpm dlx shadcn@latest add table`
- **출처**: [shadcn table](https://ui.shadcn.com/docs/components/base/table)

### Data Table *(shadcn)*
- **무엇**: 정렬, 필터, 페이지 나눔, 열 숨기기, 행 선택이 되는 표다. shadcn에서는 완성된 컴포넌트가 아니라 **Table + TanStack Table로 조립하는 가이드**다.
- **데모**: 사용자 20명 표. 열 헤더를 눌러 정렬하고, 검색으로 필터하고, 체크박스로 행을 선택한다. 정렬 상태는 화살표 기호와 `aria-sort`로 표시한다.
- **요청 예문**: "사용자 목록을 Data Table로: 이름·가입일 정렬, 이메일 검색, 행 선택 후 일괄 삭제."
- **구현**: shadcn 가이드는 `@tanstack/react-table`을 쓴다. 이 대시보드 데모는 의존성을 늘리지 않으려고 Table + 직접 만든 정렬·필터 상태로 흉내만 낸다
- **관계**: Table = 구성 요소. Checkbox(행 선택)
- **shadcn**: Data Table · `pnpm dlx shadcn@latest add table` + `pnpm add @tanstack/react-table`(가이드)
- **출처**: [shadcn data-table](https://ui.shadcn.com/docs/components/base/data-table)

### Chart *(shadcn)*
- **무엇**: 막대·선·영역·원 차트다. shadcn Chart는 Recharts 위에 색, 툴팁, 범례 스타일만 입힌 얇은 층이다.
- **데모**: 같은 월별 데이터를 막대 / 선 / 영역으로 전환한다. 툴팁과 범례가 있다. 차트 아래에 같은 데이터를 표로도 제공한다(차트만으로는 스크린리더가 읽을 수 없다).
- **요청 예문**: "월별 매출을 Chart로: 막대 차트, 호버 시 툴팁, 아래에 데이터 표."
- **구현**: Recharts(`<BarChart>` 등) + shadcn `ChartContainer`, `ChartConfig`로 색 지정
- **shadcn**: Chart · `pnpm dlx shadcn@latest add chart` (Recharts v3 기반)
- **출처**: [shadcn chart](https://ui.shadcn.com/docs/components/base/chart)

### Code Block *(shadcn)*
- **무엇**: 코드, 터미널 출력, diff를 보여 주는 상자다. 헤더(파일 이름), 줄 번호, 복사 버튼, 구문 강조가 있다.
- **데모**: TSX 코드, 터미널 출력, diff(추가/삭제 줄) 세 가지. 복사 버튼을 누르면 "복사됨" 상태가 표시된다.
- **요청 예문**: "설치 안내에 Code Block: 파일 이름 헤더, 줄 번호, 복사 버튼."
- **구현**: `<pre><code>`, 구문 강조(Shiki), 복사는 `navigator.clipboard`
- **shadcn**: Code Block · `pnpm dlx shadcn@latest add code-block` (Shiki 기반 `useHighlightedCode` 훅 포함)
- **출처**: [shadcn code-block](https://ui.shadcn.com/docs/components/base/code-block)

### Typography (Typeset) *(shadcn)*
- **무엇**: 제목, 문단, 목록, 인용, 코드가 섞인 긴 글(블로그, 렌더링된 markdown, AI 채팅 답변)에 일관된 글자 스타일을 입히는 CSS다. shadcn 문서에서 이 페이지의 현재 이름은 "Typeset"이다.
- **데모**: 같은 markdown 글을 스타일 없음 / Typeset 적용으로 전환한다. 크기와 줄 간격 프리셋을 바꿔 본다.
- **요청 예문**: "블로그 본문에 Typeset 스타일 적용, 본문 16px, 줄 간격 1.7."
- **구현**: 컨테이너 클래스 하나로 하위 `h1`~`p`·`ul`·`blockquote`를 스타일링. 비슷한 것으로 Tailwind의 `prose`가 있다
- **관계**: Style · Type Scale과 연결(크기 단계를 정하는 규칙) 검색 별칭: Blockquote, Heading, Markdown, Rich Text View.
- **shadcn**: Typeset · add 명령 없음. `typeset.css`를 복사해서 쓴다
- **출처**: [shadcn typography](https://ui.shadcn.com/docs/components/base/typography)
### Clickable Card *(추가)*
- **무엇**: 카드 표면을 눌러 상세 페이지로 이동하는 표시 요소다.
- **데모**: 두 문서 카드에서 링크를 선택하면 같은 데모 영역에 상세를 표시한다.
- **요청 예문**: "문서 카드를 Clickable Card로 만들어 Tab과 Enter로 상세를 열게 해 줘."
- **구현**: 카드 전체를 단일 a 요소로 감싸고 중첩 링크·버튼을 피한다.
- **관계**: Clickable Card는 상세로 이동하고, Selectable Card는 입력값을 유지한다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)

### Token (Chip/Tag) *(추가)*
- **무엇**: 선택된 태그나 사람처럼 하나의 값을 짧은 단위로 표시한다. 제거하거나 조작할 수 있는 형태도 있다.
- **데모**: 세 태그를 표시하고 각 제거 버튼으로 지운다.
- **요청 예문**: "활성 필터마다 삭제할 수 있는 Token을 보여 줘."
- **구현**: 목록과 의미 있는 제거 버튼 이름
- **관계**: Badge는 정보나 상태를 표시하고, Token은 개별 값을 나타내며 제거 가능한 경우가 많다.
- **출처**: [원문](https://react-spectrum.adobe.com/react-aria/TagGroup.html)

### Description List (Metadata List) *(추가)*
- **무엇**: 이름과 값이 짝을 이루는 목록이다. 저자, 작성일, 상태 같은 메타데이터에 쓰인다.
- **데모**: 문서 메타데이터를 좁은 화면의 세로 배치와 두 열로 바꿔 본다.
- **요청 예문**: "작성자, 수정일, 공개 여부를 Description List로 보여 줘."
- **구현**: dl, dt, dd
- **관계**: Description List는 이름과 값의 짝을 표시하고, Table은 여러 행과 열을 비교한다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dl)

### Tree View (Tree List) *(추가)*
- **무엇**: 항목이 부모와 자식으로 이어지는 계층 목록이다.
- **데모**: 파일 트리에서 폴더를 열고 닫는다. 화살표로 보이는 항목 사이를 이동한다.
- **요청 예문**: "문서 폴더를 Tree View로 만들고 키보드로 열거나 닫게 해 줘."
- **구현**: role="tree", treeitem, group, aria-expanded와 roving tabindex
- **관계**: Tree View는 계층과 탐색 규칙을 갖고, Accordion은 독립된 패널을 접고 펼친다.
- **출처**: [원문](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)

### Overflow List *(추가)*
- **무엇**: 일부 항목만 한 줄에 표시하고 공간 부족으로 숨긴 항목은 더 보기로 열어 주는 목록이다.
- **데모**: 너비를 조절해 보이는 태그 개수를 바꾼다. +N 버튼에서 나머지 이름을 확인한다.
- **요청 예문**: "선택된 멤버가 넘치면 +N Overflow List에 넣어 줘."
- **구현**: 가용 너비 계산, 숨겨진 항목 수, Popover
- **관계**: Scroll Area는 영역을 스크롤하고, Overflow List는 넘친 항목을 별도로 연다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

### Timestamp (Relative Time) *(추가)*
- **무엇**: 시간을 날짜나 ‘5분 전’처럼 표시하는 시간 정보다.
- **데모**: 같은 이벤트를 절대 시각과 상대 시간으로 바꿔 본다. 기준 시각도 표시한다.
- **요청 예문**: "댓글 시간은 상대 시간으로 쓰고 정확한 시각도 확인할 수 있게 해 줘."
- **구현**: time datetime, Intl.DateTimeFormat, Intl.RelativeTimeFormat
- **관계**: Message의 시간은 Timestamp로 표현할 수 있다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)

### Bulk Action Bar (Table Selection Toolbar) *(추가)*
- **무엇**: 여러 행을 선택했을 때 선택 수와 일괄 작업을 표시하는 도구 영역이다.
- **데모**: 행을 체크하면 작업 영역이 나타나고, 보관을 누르면 선택한 행만 사라진다.
- **요청 예문**: "선택한 행의 개수와 보관 버튼을 Bulk Action Bar로 보여 줘."
- **구현**: 행 ID 집합, 선택 수 출력, 일괄 동작 버튼
- **관계**: Data Table은 선택 상태를 관리하고, Bulk Action Bar는 선택 항목에 적용하는 명령을 제공한다.
- **출처**: [원문](https://react-spectrum.adobe.com/react-spectrum/ActionBar.html)

---

## State & Feedback

### Loading State *(Skeleton Loading을 병합)*
- **무엇**: 기다리는 동안 무엇을 보여 줄지 정한다. 세 가지가 있다.
  - **Skeleton**: 실제 내용 자리에 회색 윤곽을 먼저 보여 준다. 구조를 미리 알 때 쓴다.
  - **Progress Bar**: 진행률을 아는 작업에 쓴다. 예: 업로드.
  - **Spinner**: 진행률을 모르는 짧은 대기에 쓴다.
- **데모**: "불러오기" 버튼을 누르면 같은 카드 목록이 세 방식으로 로딩된다. 로딩 시간 슬라이더로 길게 기다릴 때 각각의 체감 차이를 보여 준다.
- **요청 예문**: "카드 목록을 불러오는 동안 실제 카드 구조를 흉내 낸 Skeleton Loading."
- **구현**: Skeleton은 배경 + shimmer(`@keyframes`, Reduced Motion이면 정지). Progress Bar는 `<progress>`. 공통으로 `aria-busy="true"`
- **관계**: Skeleton Loading = 별칭(검색어). Empty State·Error State와 함께 "데이터 조회의 세 결과"를 이룬다 검색 별칭: Progress Bar, Skeleton, Spinner.
- **출처**: 1탄 6:45, [Fluent 2 Skeleton](https://fluent2.microsoft.design/components/web/react/core/skeleton/usage)

### Empty State *(추가)*
- **무엇**: 조회는 **성공했지만 결과가 0건**일 때의 화면이다. 왜 비었는지와 다음 행동을 알려 준다.
- **데모**: 필터를 극단적으로 걸면 "결과 없음" + "필터 초기화" 버튼이 뜬다. 처음 써서 비어 있는 경우("첫 프로젝트 만들기")도 함께 보여 준다.
- **요청 예문**: "검색 결과가 0건이면 이유와 '필터 초기화' 버튼이 있는 Empty State."
- **구현**: 상태 분기(`loading | empty | error | data`)
- **관계**: Error State와 비교. Empty는 *성공했는데 0건*, Error는 *실패*다
- **출처**: [Carbon Empty States](https://www.carbondesignsystem.com/patterns/empty-states-pattern/)

### Error State *(추가)*
- **무엇**: 조회나 저장이 **실패**했을 때의 화면이다. 입력을 지우지 않고, 같은 자리에서 다시 시도하게 한다.
- **데모**: "네트워크 끊기" 토글을 켠 뒤 저장하면, 입력은 유지된 채 오류 메시지와 "다시 시도" 버튼이 뜬다.
- **요청 예문**: "조회에 실패하면 같은 자리에 오류 메시지와 '다시 시도' 버튼, 입력값은 유지."
- **구현**: `role="alert"`, 폼 필드 오류는 `aria-invalid` + `aria-describedby`
- **관계**: Empty State와 비교. 오류 순간의 흔들림은 후속 후보 Shake
- **출처**: [Carbon Notification](https://carbondesignsystem.com/components/notification/usage/). 구현할 때 오류 패턴 전용 문서로 교체를 검토한다

### Alert *(shadcn)*
- **무엇**: 화면 안에 고정으로 표시되는 안내 상자다. 예: "결제 수단이 곧 만료됩니다". 사라지지 않는다.
- **데모**: 정보 / 경고 / 오류 Alert. 아이콘과 제목으로 종류를 구분한다. Toast(잠깐 떴다 사라짐)와의 차이를 설명으로 적는다.
- **요청 예문**: "결제 페이지 상단에 경고 Alert: 아이콘, 제목, 한 줄 설명, '수단 변경' 링크."
- **구현**: 정적인 안내는 그냥 박스, 새로 생긴 중요한 오류만 `role="alert"`
- **관계**: Error State의 오류 표시에 쓴다. Alert Dialog와 다르다(Alert는 화면을 막지 않는다) 검색 별칭: Banner.
- **shadcn**: Alert · `pnpm dlx shadcn@latest add alert`
- **출처**: [shadcn alert](https://ui.shadcn.com/docs/components/base/alert)

### Micro-interaction
- **무엇**: 클릭, 저장, 선택 같은 작은 행동에 대한 즉각적인 시각 피드백이다. 예: 좋아요 하트가 튐, 저장 버튼이 체크로 바뀜.
- **데모**: 저장 버튼이 idle → loading(스피너) → success(체크) → idle로 바뀐다. 각 상태를 단계 버튼으로 멈춰 볼 수 있다.
- **요청 예문**: "저장 버튼에 Micro-interaction: 누르면 로딩 표시, 완료되면 체크 아이콘으로 바뀌었다가 2초 뒤 복귀."
- **구현**: 상태 기계(idle/loading/success). 아이콘 전환은 Motion · Morphing이나 Scale
- **관계**: 움직임 자체는 Motion 카드들(Scale, Spring, Morphing)로 만든다
- **출처**: 1탄 9:18
### Status Dot *(추가)*
- **무엇**: 온라인, 오프라인, 점검처럼 현재 상태를 짧게 표시하는 점이다.
- **데모**: 세 상태를 바꿔 본다. 점과 함께 서로 다른 기호와 상태명을 표시한다.
- **요청 예문**: "사용자 이름 옆에 Status Dot과 온라인 상태 텍스트를 함께 써 줘."
- **구현**: 장식 점은 aria-hidden, 상태 텍스트나 보조 기술용 이름
- **관계**: Status Dot은 상태의 작은 신호이고, Badge는 상태나 분류 전체를 라벨로 표시한다.
- **출처**: [원문](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)

### Visually Hidden *(추가)*
- **무엇**: 화면에서는 보이지 않지만 보조 기술로는 읽을 수 있게 하는 텍스트 패턴이다.
- **데모**: 아이콘 버튼 이름이 화면에 숨겨진 상태와 보이는 상태를 비교한다. 버튼 이름은 두 상태에서 같다.
- **요청 예문**: "아이콘 전용 버튼에 Visually Hidden 텍스트로 이름을 달아 줘."
- **구현**: sr-only, position: absolute, clip-path: inset(50%); display: none은 접근성 트리에서도 숨긴다
- **관계**: Tooltip은 상호작용 후 설명을 띄우고, Visually Hidden 텍스트는 처음부터 접근 가능한 이름을 줄 수 있다.
- **출처**: [원문](https://www.w3.org/WAI/WCAG22/Techniques/css/C7)

---

## Chat (AI)

### Message *(shadcn)*
- **무엇**: 채팅에서 메시지 한 건의 **행 레이아웃**이다. Avatar 자리, 좌우 정렬(나 / 상대), 위 이름·시간(header), 아래 상태(footer)를 담는다. 말풍선 자체는 그리지 않는다.
- **데모**: 나와 상대가 주고받는 대화 4건. 같은 사람이 연속으로 보낸 메시지는 Avatar를 한 번만 보여 준다(MessageGroup).
- **요청 예문**: "채팅 화면을 Message로: 상대는 왼쪽 Avatar, 나는 오른쪽 정렬, 하단에 보낸 시간."
- **구현**: flex 행 + 정렬. 목록은 `role="log"` 또는 `<ol>`
- **관계**: Bubble(말풍선 표면), Message Scroller(스크롤 컨테이너)와 함께 채팅 UI의 세 층을 이룬다 검색 별칭: Chat Message, Chat Message Metadata.
- **shadcn**: Message · `pnpm dlx shadcn@latest add message`
- **출처**: [shadcn message](https://ui.shadcn.com/docs/components/base/message)

### Bubble *(shadcn)*
- **무엇**: 채팅 메시지의 **말풍선 표면**이다. variant로 내 메시지와 상대 메시지의 모양을 다르게 하고, 리액션을 붙일 수 있다.
- **데모**: variant 몇 종, 좌우 정렬, 긴 메시지의 "더 보기"(Collapsible), 이모지 리액션.
- **요청 예문**: "내 메시지는 채운 Bubble, 상대는 외곽선 Bubble, 길면 '더 보기'로 접기."
- **구현**: 배경 + 모서리 둥글기. 정렬은 Message가 맡는다
- **관계**: Message가 행 레이아웃을 맡고, Bubble은 그 안의 표면을 맡는다
- **shadcn**: Bubble · `pnpm dlx shadcn@latest add bubble`
- **출처**: [shadcn bubble](https://ui.shadcn.com/docs/components/base/bubble)

### Message Scroller *(shadcn)*
- **무엇**: 채팅 전용 스크롤 영역이다. AI 답변이 스트리밍되는 동안 아래를 따라가고, 사용자가 위로 올려 읽으면 따라가기를 멈춘다. 이전 대화 불러오기와 "최신으로 이동" 버튼도 처리한다.
- **데모**: "응답 생성" 버튼을 누르면 가짜 스트리밍 답변이 한 줄씩 붙는다. 맨 아래에 있으면 화면이 따라가고, 위로 올리면 멈추면서 "최신으로 ↓" 버튼이 나타난다.
- **요청 예문**: "AI 채팅 영역을 Message Scroller로: 스트리밍 중 자동 스크롤, 사용자가 위로 올리면 멈추고 '최신으로' 버튼."
- **구현**: 맨 아래에 붙어 있는지 판정 + `scrollTop` 제어. 새 메시지 알림은 `aria-live`
- **관계**: Scroll Area(범용 스크롤)와 비교 검색 별칭: Chat Layout.
- **shadcn**: Message Scroller · `pnpm dlx shadcn@latest add message-scroller` (`@shadcn/react` 기반)
- **출처**: [shadcn message-scroller](https://ui.shadcn.com/docs/components/base/message-scroller)

### Attachment *(shadcn)*
- **무엇**: 채팅이나 폼에 첨부한 파일·이미지 카드다. 미리보기, 파일 이름과 크기, 업로드 상태(업로드 중 / 처리 중 / 오류 / 완료), 삭제 버튼이 있다.
- **데모**: 파일 3개가 업로드 상태를 차례로 거친다. 오류 파일에는 재시도 버튼이 있다. 상태를 아이콘과 글자로 함께 표시한다.
- **요청 예문**: "채팅 입력창 위에 첨부 파일을 Attachment로: 썸네일, 이름, 업로드 진행 상태, 삭제 버튼."
- **구현**: `<input type="file">`, 진행률은 `<progress>`, 상태 변경은 `aria-live`
- **관계**: Item과 비교(Item은 범용 행, Attachment는 파일과 업로드 상태 전용). Loading State·Error State와 연결
- **shadcn**: Attachment · `pnpm dlx shadcn@latest add attachment`
- **출처**: [shadcn attachment](https://ui.shadcn.com/docs/components/base/attachment)

### Marker *(shadcn)*
- **무엇**: 대화 흐름 중간에 끼는 **한 줄짜리** 상태·안내다. 예: "오늘", "대화가 요약되었습니다", "생각 중…".
- **데모**: 대화 사이의 날짜 구분선, 시스템 안내, 진행 중 표시(Spinner + 반짝이는 글자) 세 가지 variant.
- **요청 예문**: "채팅에서 날짜가 바뀌면 separator Marker로 '11월 22일' 표시."
- **구현**: 구분선이면 `role="separator"`, 진행 상태면 `role="status"`
- **관계**: Trace와 비교. Marker는 *한 줄*이고, Trace는 *여러 단계가 펼쳐진다*. Separator와도 비교 검색 별칭: Chat System Message.
- **shadcn**: Marker · `pnpm dlx shadcn@latest add marker`
- **출처**: [shadcn marker](https://ui.shadcn.com/docs/components/base/marker)

### Trace *(shadcn)*
- **무엇**: AI 에이전트의 작업 과정(추론, 도구 호출, 참고 자료)을 단계 목록으로 보여 준다. 각 단계는 상태(진행 중 / 대기 / 오류 / 완료)를 갖고, 펼치면 세부 내용이 나온다.
- **데모**: "검색 → 파일 읽기 → 답변 작성" 3단계가 차례로 진행된다. 완료된 단계를 펼치면 세부 내용이 나온다. 상태를 아이콘과 글자로 함께 표시한다.
- **요청 예문**: "AI 답변 위에 Trace로 도구 호출 단계를 표시하고, 각 단계는 펼쳐서 입력·출력 확인."
- **구현**: 목록 + Collapsible, 진행 상태 변화는 `aria-live`
- **관계**: Collapsible = 구성 요소. Marker와 비교 검색 별칭: Chat Tool Calls.
- **shadcn**: Trace · `pnpm dlx shadcn@latest add trace`
- **출처**: [shadcn trace](https://ui.shadcn.com/docs/components/base/trace)

### Questionnaire *(shadcn)*
- **무엇**: 여러 질문을 한 단계씩 넘기며 답하는 설문이다. 단일 선택, 복수 선택, 자유 입력, 건너뛰기가 가능하다.
- **데모**: 3문항 설문. 진행률(2/3), 이전 / 건너뛰기 / 다음 / 제출 버튼. 필수 문항을 비워 두면 다음으로 넘어가지 않고 이유를 표시한다.
- **요청 예문**: "온보딩을 Questionnaire로: 3문항, 진행률 표시, 마지막 문항은 건너뛰기 가능."
- **구현**: 문항마다 `<fieldset>` + `<legend>`, 단계가 바뀌면 포커스를 새 질문으로 이동
- **관계**: Radio Group·Checkbox(문항 하나)를 여러 단계로 묶은 것. Field의 검증과 연결
- **shadcn**: Questionnaire · `pnpm dlx shadcn@latest add questionnaire` (`@shadcn/react` 기반)
- **출처**: [shadcn questionnaire](https://ui.shadcn.com/docs/components/base/questionnaire)
### Chat Composer *(추가)*
- **무엇**: 메시지를 입력하고 첨부와 전송을 처리하는 채팅 창의 입력 영역이다.
- **데모**: 여러 줄 메시지를 입력하고 예시 첨부를 붙인다. Enter로 전송, Shift+Enter로 줄바꿈한다.
- **요청 예문**: "채팅에 Chat Composer를 넣고 빈 메시지는 전송하지 않게 해 줘."
- **구현**: form, textarea, 제출 단축키, 입력 상태
- **관계**: Chat Composer는 보내기 전 입력을 편집하고, Message는 보낸 내용을 표시한다.
- **출처**: [원문](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea)

### Citation *(추가)*
- **무엇**: 답변의 특정 내용이 어떤 자료에 근거하는지 문장 안에서 연결하는 표식이다.
- **데모**: 답변의 [1] 버튼을 열어 가짜 문서의 제목과 인용 부분을 확인한다.
- **요청 예문**: "AI 답변의 근거 문장 옆에 Citation을 붙이고 자료 미리보기를 열어 줘."
- **구현**: 인용·참고 표시, 설명 있는 링크나 버튼, 미리보기 Popover
- **관계**: Citation은 근거를 연결하는 의미를 갖고, Popover는 근거 미리보기를 여는 UI다.
- **출처**: [원문](https://elements.ai-sdk.dev/components/inline-citation)
