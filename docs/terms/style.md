# Style 섹션

**화면이 어떤 시각 규칙을 따르는가.** 움직임도 구조도 아닌 재질·대비·글자·여백을 다룬다. 영상 2편에서 직접 나온 것은 Glassmorphism 하나뿐이다. 나머지는 `AGENTS.md`의 "시각 완성도를 올리는 순서"(타이포 스케일 고정 → 여백 정리 → 명도 대비)에서 가져왔다. 이 순서는 안목이 아니라 **규칙**이라 비디자이너도 따라 할 수 있다.

| 범주 | 카드 | 수 |
|---|---|---|
| Surface & Contrast | Glassmorphism, Elevation, Text Contrast | 3 |
| Typography & Spacing | Type Scale, Spacing Scale | 2 |

**이 섹션 데모의 공통점**: 같은 미니 카드 UI 하나에 설정을 바꿔 적용하는 **전/후 비교**로 보여 준다. 움직임이 없어 Reduced Motion의 영향이 없다.

**포함 기준 메모**: Gradient(Mesh), Grain/Noise는 보류했다. "규칙으로 고정할 수 있는 것"이 먼저다. 늘릴 때도 README의 기준(이름을 알면 요청이나 구현이 달라지는가)을 그대로 적용한다.

---

## Surface & Contrast

### Glassmorphism *(UI에서 이동)*
- **무엇**: 뒤 배경이 흐리게 비치는 반투명 유리 질감의 스타일이다. 글자가 읽기 어려워질 수 있어서 대비 확보가 조건이다.
- **데모**: 컬러 배경 위의 카드. blur 강도와 배경 불투명도 슬라이더가 있다. 카드 위 글자의 **현재 대비 값**(예: 3.1:1 ✗ / 4.8:1 ✓)을 실시간으로 표시해서 Text Contrast 카드로 이어지게 한다.
- **요청 예문**: "카드 배경을 Glassmorphism으로(backdrop blur 12px, 반투명 흰색), 단 본문 대비 4.5:1 유지."
- **구현**: `backdrop-filter: blur()`, 반투명 `background`, 얇은 밝은 `border`. Tailwind `backdrop-blur-*`
- **이 저장소의 예**: `src/connection-pool/Scrolly.tsx:158`. 모바일 다이어그램 띠에 `backdrop-blur-sm`
- **관계**: Text Contrast가 사용 조건이다

### Elevation *(추가)*
- **무엇**: 그림자의 깊이로 **층위**를 표현한다. 예: 팝오버가 카드보다 위에, 모달이 그보다 위에 떠 보인다.
- **데모**: 같은 화면에 바닥, 카드, Popover, Modal Dialog를 겹쳐 놓고 층마다 그림자를 다르게 준다. "모두 같은 그림자"로 바꾸면 무엇이 위인지 헷갈리는 것을 보여 준다.
- **요청 예문**: "Elevation을 3단계로: 카드는 약한 그림자, Popover는 중간, Modal Dialog는 가장 깊게."
- **구현**: `box-shadow` 단계(Tailwind `shadow-sm`/`md`/`xl`), 어두운 테마에서는 그림자 대신 표면 밝기로 층을 나눈다
- **관계**: UI의 Popover, Modal Dialog, Drawer와 연결. hover 시 카드가 "떠오르는" 것은 Elevation이 한 단계 바뀌는 것이다

### Text Contrast *(추가)*
- **무엇**: 글자색과 배경색의 **명도 대비 비율**이다. 보통 크기 본문은 4.5:1 이상, 큰 글자는 3:1 이상(WCAG AA).
- **데모**: 글자색과 배경색 선택기. 대비 비율과 통과 여부(✓/✗, 색만이 아니라 기호와 텍스트로 표시)를 실시간으로 보여 준다. 자주 틀리는 예(회색 위 회색, 사진 위 흰 글씨)를 프리셋으로 둔다.
- **요청 예문**: "모든 본문 텍스트는 배경과 Text Contrast 4.5:1 이상, 보조 텍스트도 예외 없음."
- **구현**: 브라우저 DevTools의 contrast 표시, 대비 계산 공식(상대 휘도). Tailwind 색상 단계에서 조합을 고정한다
- **관계**: Glassmorphism의 사용 조건. `AGENTS.md` "명도 대비"

---

## Typography & Spacing

### Type Scale *(추가)*
- **무엇**: 제목, 본문, 라벨의 글자 크기를 **정해진 단계**로만 쓰는 규칙이다. 예: 12 / 16 / 20 / 24 / 32. 아무 크기나 쓰지 않는다.
- **데모**: 같은 카드 화면을 "제각각 크기"(13, 15, 17, 22…)와 "Type Scale 적용"으로 전환한다. 비율(1.2 / 1.25 / 1.333)을 바꾸면 전체가 한 번에 바뀐다.
- **요청 예문**: "Type Scale을 12·14·16·20·24·32로 고정하고, 제목·본문·라벨은 이 단계만 사용."
- **구현**: Tailwind `text-xs` ~ `text-3xl`(또는 `@theme`에서 단계 정의), 반응형은 `clamp()`
- **관계**: `AGENTS.md` "타이포 스케일 고정"이 시각 완성도 1단계다

### Spacing Scale *(추가)*
- **무엇**: 요소 안팎의 간격을 **정해진 단계**로만 쓰는 규칙이다. 예: 4 / 8 / 16 / 24 / 32 / 48px.
- **데모**: 같은 카드 화면을 "제각각 여백"과 "8px 단위 Spacing Scale"로 전환한다. 여백 시각화(margin·padding에 색 띠)를 켜고 끌 수 있다.
- **요청 예문**: "간격은 Spacing Scale 4·8·16·24·32·48px만 사용, 카드 안쪽 16, 카드 사이 24."
- **구현**: Tailwind spacing(`p-4` = 16px 등, 기본 4px 단위), CSS 변수로 단계 고정
- **관계**: UI · Layout 카드(Grid Layout, Bento Grid)의 `gap`이 이 단계를 따른다. 배치 패턴이 아니라 수치 체계라서 Style에 둔다. `AGENTS.md` "여백 정리"
