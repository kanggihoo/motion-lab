# Motion 섹션

**무엇이 언제 어떻게 움직이는가.** 범주는 영상 순서가 아니라 요청 공식의 축을 따른다: *무엇*(Basics·Text & Graphic) / *어떻게·얼마나 빨리*(Timing & Sequence) / *언제*(Scroll·Transition·Pointer & Event).

| 범주 | 카드 | 수 |
|---|---|---|
| Basics | Fade, Slide, Scale | 3 |
| Timing & Sequence | Easing, Spring, Bounce, Duration / Delay, Stagger, Loop, Keyframe, Timeline | 8 |
| Text & Graphic | Typewriter, Text Scramble, Split Text, Count-up, Line Drawing, Morphing, Marquee, Motion Path | 8 |
| Scroll | Scroll Reveal, Scroll Scrub, Pin, Scrollytelling, Parallax Scrolling, Scroll Snap, Pinned Horizontal Scroll | 7 |
| Transition | Page Transition, Shared Element Transition | 2 |
| Pointer & Event | Magnetic Button, Custom Cursor, 3D Tilt, Confetti | 4 |


**이 섹션 데모의 공통점**
- 모든 데모에 **"다시 재생"** 버튼이 있다. 시간이 핵심인 카드에는 **속도 슬라이더**(0.25× ~ 2×)를 둔다.
- 개발 중에는 GSDevTools로 타임라인을 긁어 본다(`AGENTS.md` 개발용 도구).

---

## Basics — 무엇이 변하나

### Fade
- **무엇**: 투명도가 바뀌며 나타나거나(fade-in) 사라진다(fade-out). 가장 기본이고 어디에 넣어도 어색하지 않다.
- **데모**: 모달 배경이 0.2초 fade-in. 0.2s / 0.6s / 1.2s를 비교한다.
- **요청 예문**: "모달이 열릴 때 배경을 0.2초 Fade In, 닫힐 때 Fade Out."
- **구현**: `opacity` + `transition`, GSAP `autoAlpha`(opacity와 함께 `visibility`도 바꿔서 투명한 요소가 클릭을 막지 않는다)
- **관계**: 실무에서는 Slide와 섞어 "살짝 올라오며 나타남"으로 많이 쓴다

### Slide
- **무엇**: 화면 밖이나 근처에서 미끄러져 들어온다. **방향**(위·아래·좌·우)이 핵심이다.
- **데모**: 알림 배너가 위에서 내려왔다가 3초 뒤 올라간다. 방향 4개를 선택할 수 있다. "Fade와 같이" 토글도 있다.
- **요청 예문**: "알림 배너가 화면 위에서 Slide Down으로 들어오고 3초 뒤 다시 올라감."
- **구현**: `transform: translate`(레이아웃을 다시 계산하지 않아 `top`/`left`보다 싸다), GSAP `x`·`y`
- **관계**: Drawer와 Toast의 등장이 이 움직임이다

### Scale
- **무엇**: 크기가 바뀐다. 커졌다가 원래대로 돌아오면 "톡 튀어나오는" **Pop**이 된다.
- **데모**: 장바구니 배지 숫자가 pop. scale만 / pop(1 → 1.2 → 1)을 비교한다. 중심점(`transform-origin`)을 가운데와 왼쪽 위로 바꿔 볼 수 있다.
- **요청 예문**: "장바구니에 담으면 숫자 배지를 Scale Pop으로 강조."
- **구현**: `transform: scale()`, `transform-origin`, GSAP `scale` + `ease: "back.out"`
- **관계**: Pop = 변형. 튀는 느낌을 더 원하면 Spring

---

## Timing & Sequence — 어떻게·얼마나 빨리

### Easing
- **무엇**: 움직이는 동안 **속도가 변하는 방식**이다. 같은 거리를 같은 시간에 가도 느낌이 다르다.
  - **ease-out**: 끝에서 느려진다. 들어올 때 쓴다.
  - **ease-in**: 처음이 느리다. 나갈 때 쓴다.
  - **ease-in-out**: 양 끝이 느리다.
- **데모**: 같은 공 4개를 linear / ease-in / ease-out / ease-in-out으로 나란히 굴린다. 각 공 옆에 속도 곡선 그래프를 그리고 진행 점이 곡선을 따라간다.
- **요청 예문**: "메뉴가 열릴 때는 ease-out, 닫힐 때는 0.3초 ease-in."
- **구현**: CSS `transition-timing-function`, `cubic-bezier()`, GSAP `power2.out` 등
- **이 저장소의 예**: `src/connection-pool/sim.ts:40`, `:66`
- **관계**: 영상 편집의 키프레임 보간과 같은 개념(Camera·Edit 섹션의 공통 개념)

### Spring
- **무엇**: 목표를 **살짝 지나쳤다가** 되돌아와 자리 잡는 탄성 있는 움직임이다. stiffness(뻣뻣함)와 damping(감쇠)으로 출렁임을 조절한다.
- **데모**: 카드를 누르면 spring으로 커진다. stiffness·damping 슬라이더를 두고, 움직임 아래에 값 변화 그래프(목표선을 넘었다 돌아오는 모양)를 그린다.
- **요청 예문**: "카드를 누르면 Spring으로 살짝 커지고, 한 번만 은은하게 출렁이게."
- **구현**: GSAP에는 물리 기반 spring이 따로 없다. `back.out`(한 번 넘어감)이나 `elastic.out`으로 근사한다. CSS는 `linear()` 함수로 spring 곡선을 직접 찍을 수 있다
- **관계**: Bounce와 비교. Spring은 목표를 *지나쳤다 돌아오고*, Bounce는 *바닥에 부딪혀 튄다*

### Bounce
- **무엇**: 공이 바닥에 떨어져 몇 번 튀다가 멈추는 움직임이다. 귀여운 디테일에만 아껴 쓴다.
- **데모**: 결제 완료 체크 아이콘이 위에서 떨어져 두 번 튀고 멈춘다. Spring과 나란히 둔다.
- **요청 예문**: "결제 완료 체크 아이콘이 위에서 떨어져 Bounce 두 번 하고 멈춤."
- **구현**: GSAP `ease: "bounce.out"`
- **관계**: Spring과 비교(위 참고)

### Duration / Delay
- **무엇**: **duration**은 움직이는 데 걸리는 시간이고, **delay**는 움직이기 전에 기다리는 시간이다.
  - 버튼 같은 작은 반응: 0.1~0.2초
  - 큰 화면 요소: 0.3~0.5초
- **데모**: 제목은 즉시, 설명은 0.2초 뒤에 나타난다. 둘 다 0.4초 동안 움직인다. 아래 시간 막대(0~1초)에 각 요소의 delay 구간과 duration 구간을 색과 무늬로 표시한다.
- **요청 예문**: "제목은 바로, 설명은 0.2초 Delay 후 등장, 둘 다 Duration 0.4초."
- **구현**: `transition-duration`, `transition-delay`, GSAP `duration`·`delay`
- **관계**: 1탄의 Smooth Transition은 검색하면 여기로 온다(hover 200ms = hover 상태 + Duration 0.2초 + Easing). Stagger는 이 delay를 순서대로 준 것이다

### Stagger *(1탄과 2탄을 한 장으로)*
- **무엇**: 여러 요소가 한꺼번에가 아니라 **시간차를 두고 차례로** 움직인다. 요소가 같아도 순서가 리듬을 만든다.
- **데모**: 카드 6장이 0.1초 간격으로 fade-in. 간격 슬라이더(0 ~ 0.3초)와 순서(처음부터 / 가운데부터 / 무작위)를 고를 수 있다.
- **요청 예문**: "카드 목록이 처음 나타날 때 0.1초 간격 Stagger로 하나씩 Fade In."
- **구현**: GSAP `stagger: 0.1`(`{ each, from: "center" }`), CSS는 `transition-delay: calc(var(--i) * 100ms)`
- **관계**: Duration / Delay의 응용. Split Text는 글자 단위 Stagger다

### Loop
- **무엇**: 멈추지 않고 반복되는 움직임이다. 아이콘이 둥실 떠 있는 **Floating**이 대표적이다. 시선을 끌지만, 한 화면에 여러 개가 있으면 산만하다.
- **데모**: 히어로 일러스트가 4초 주기로 아주 천천히 오르내린다. "한 개만 / 다섯 개 동시" 토글로 산만함을 직접 비교한다. 일시정지 버튼도 있다.
- **요청 예문**: "히어로 일러스트에 Floating Loop, 한 주기 4초로 아주 천천히 위아래."
- **구현**: CSS `animation-iteration-count: infinite` + `alternate`, GSAP `repeat: -1, yoyo: true`. 5초 넘게 자동으로 움직이면 정지 수단이 필요하다(WCAG 2.2.2)
- **관계**: Floating = 사례. 계속 도는 회전도 Loop의 사례다(제외한 Rotate 용어)

### Keyframe *(추가)*
- **무엇**: 움직임 중간의 **특정 시점의 상태**를 직접 찍어 두는 것이다. 예: "60% 지점에서 최대 크기, 100%에서 원래 크기".
- **데모**: 진행 막대 위에 0% / 60% / 100% 지점을 표시한다. 점을 끌어 위치를 바꾸면 움직임이 바뀐다. 같은 시작과 끝을 transition(두 상태만)으로 했을 때와 비교한다.
- **요청 예문**: "배지 등장은 Keyframe으로: 0%에 scale 0, 60%에 1.2, 100%에 1."
- **구현**: CSS `@keyframes`, GSAP `keyframes: [...]` 또는 `keyframes: { "0%": ..., "60%": ... }`
- **관계**: transition과 비교. transition은 *두 상태 사이*를 잇고 도중에 되돌릴 수 있다. keyframe animation은 *정해진 경로*를 스스로 재생한다. 영상 편집의 키프레임과 같은 개념이다
- **출처**: [W3C CSS Animations](https://www.w3.org/TR/css-animations-1/#keyframes)

### Timeline *(추가, Orchestration 흡수)*
- **무엇**: 여러 움직임의 **순서와 겹침**을 한 줄의 시간축에 배치하는 것이다. 예: "제목이 끝나기 0.15초 전에 부제를 시작".
- **데모**: 트랙 3개(제목·부제·버튼)를 시간축 위의 막대로 보여 준다. 막대를 끌어 겹침을 바꾸면 즉시 재생된다. 스크러버로 시간을 앞뒤로 긁어 볼 수 있다.
- **요청 예문**: "GSAP Timeline으로 제목 → 부제(0.15초 겹침) → 버튼 순서, 전체를 한 번에 되감기 가능하게."
- **구현**: `gsap.timeline()`, 위치 파라미터(`"-=0.15"`, `"<"`), `tl.reverse()`
- **관계**: `AGENTS.md` 모션 어휘 2번 "전환 순서와 겹침"이 이것이다. Stagger는 Timeline의 특수한 경우(같은 간격)다. 영상 편집의 타임라인과 같은 개념이다
- **출처**: [GSAP Timeline](https://gsap.com/docs/v3/GSAP/Timeline/)

---

## Text & Graphic — 글자·숫자·선·아이콘

### Typewriter
- **무엇**: 글자가 타자기처럼 한 글자씩 나타난다. 끝에 깜빡이는 커서를 붙이면 "지금 치고 있는" 느낌이 난다.
- **데모**: 히어로 제목이 타이핑된다. 커서를 켜고 끌 수 있고, 타이핑 속도 슬라이더가 있다.
- **요청 예문**: "히어로 제목에 Typewriter 효과, 끝에 깜빡이는 커서."
- **구현**: CSS `steps()` + `width`(고정폭 글꼴일 때), GSAP TextPlugin. 스크린리더용으로 전체 문장을 처음부터 DOM에 둔다

### Text Scramble
- **무엇**: 무작위 문자가 빠르게 뒤섞이다가 원래 단어로 맞춰진다. 영화 해커 화면 같은 기술적 분위기를 낸다.
- **데모**: 섹션 제목이 1초 동안 scramble된 뒤 확정된다. 섞을 문자 집합(영문 / 숫자 / 기호)을 바꿔 볼 수 있다.
- **요청 예문**: "섹션 제목이 화면에 들어오면 1초간 Text Scramble 후 원래 글자로."
- **구현**: GSAP ScrambleTextPlugin(현재 무료). 진행 중에는 `aria-label`로 최종 문장을 제공한다

### Split Text
- **무엇**: 제목을 글자나 단어 단위로 쪼개서 하나씩 등장시킨다. 숨겨진 글자가 드러나서 **Text Reveal**이라고도 한다.
- **데모**: 메인 제목을 단어 단위로 아래에서 하나씩 올린다. 단위(글자 / 단어 / 줄)를 바꿔 볼 수 있다.
- **요청 예문**: "메인 제목을 단어 단위 Split Text Reveal로, 아래에서 하나씩 올라오게."
- **구현**: GSAP SplitText(`aria` 옵션으로 쪼개진 글자의 스크린리더 처리), 각 조각에 Stagger. 한국어는 글자 단위로 쪼개면 어색해서 단어 단위를 권장한다
- **관계**: 글자 단위 Stagger. Text Reveal은 더 넓은 이름이라 쪼개지 않는 reveal(후속 후보 Mask / Clip Reveal)도 포함한다

### Count-up
- **무엇**: 숫자가 0부터 빠르게 올라가 목표값에서 멈춘다. 가입자 수, 다운로드 수처럼 자랑하고 싶은 수치에 쓴다.
- **데모**: 통계 3개가 2초 동안 count-up하고, 끝에서 느려진다(ease-out). Easing을 linear로 바꿔 비교할 수 있다.
- **요청 예문**: "통계 섹션이 보이면 숫자를 0부터 목표값까지 2초 Count-up, 끝에서 느려지게."
- **구현**: GSAP으로 객체 값을 tween + `snap`, 표시는 `Intl.NumberFormat`. 최종 값은 처음부터 DOM이나 `aria-label`에 둔다(스크린리더가 중간 숫자를 읽지 않게)

### Line Drawing
- **무엇**: 보이지 않던 선이 펜으로 그리듯 그려진다. 로고, 아이콘, 차트 같은 SVG 선에 쓴다.
- **데모**: 꺾은선 그래프가 1.5초 동안 왼쪽에서 오른쪽으로 그려진다. 스크롤에 묶는 버전(Scroll Scrub)과 비교하는 토글이 있다.
- **요청 예문**: "그래프가 나타날 때 선을 왼쪽에서 오른쪽으로 1.5초 Line Drawing."
- **구현**: SVG `stroke-dasharray` + `stroke-dashoffset`, GSAP DrawSVGPlugin

### Morphing
- **무엇**: 한 모양이 다른 모양으로 부드럽게 바뀐다. 예: 햄버거 메뉴(☰) → X. 전후가 이어져 있어서 "상태가 바뀌었다"가 자연스럽게 전달된다.
- **데모**: 햄버거 아이콘을 누르면 X로 morph된다. 저장 → 체크 아이콘도 있다. 그냥 교체했을 때와 나란히 비교한다.
- **요청 예문**: "햄버거 아이콘을 누르면 세 줄이 X로 Morphing되며 메뉴가 열림."
- **구현**: GSAP MorphSVGPlugin(현재 무료). 햄버거 → X는 선 3개를 회전·이동시키는 쪽이 더 간단하다. 버튼에 `aria-expanded`

### Marquee
- **무엇**: 로고나 문구가 띠처럼 옆으로 끝없이 흐른다. 고객사 로고, 짧은 후기처럼 좁은 공간에 많이 보여 줄 때 쓴다.
- **데모**: 고객사 로고 띠. hover나 focus에서 멈춘다. 일시정지 버튼도 있다.
- **요청 예문**: "고객사 로고를 끝없는 Marquee로, 마우스를 올리면 정지."
- **구현**: 목록을 두 번 이어 붙이고 `@keyframes`로 `translateX(-50%)`, `animation-play-state: paused`. 복제한 목록은 `aria-hidden`. 자동으로 계속 움직이므로 정지 수단이 필수다(WCAG 2.2.2)

### Motion Path
- **무엇**: 직선이 아니라 미리 정한 **곡선 경로**를 따라 날아간다. 예: 상품 이미지가 호를 그리며 장바구니로 들어간다.
- **데모**: "담기"를 누르면 상품 썸네일이 곡선을 따라 장바구니 아이콘으로 간다. 경로선을 켜고 끌 수 있다.
- **요청 예문**: "'담기'를 누르면 상품 이미지가 곡선 Motion Path를 따라 장바구니 아이콘으로."
- **구현**: GSAP MotionPathPlugin, CSS `offset-path`
- **관계**: 영상의 카메라 패스와 같은 개념(Camera 섹션의 공통 개념)

---

## Scroll — 스크롤이 시작 조건

이 범주의 핵심은 **같은 스크롤 입력에서 결과가 갈리는 지점**이다. 한 줄로 비교하면:
- **Scroll Reveal**: 영역에 들어가면 정해진 시간 동안 *한 번 재생*한다.
- **Scroll Scrub**: 스크롤 위치 = 재생 위치. 40%에서 멈추면 모션도 40%에서 멈춘다.
- **Pin**: 스크롤하는 동안 영역을 *고정*한다.
- **Scroll Snap**: 스크롤을 멈춘 *위치를 정렬*한다.

이 넷을 한 화면에서 비교하는 **비교 데모**를 범주 맨 위에 둔다.

### Scroll Reveal *(UI에서 이동)*
- **무엇**: 스크롤하다 요소가 화면(viewport)에 들어오면 자연스럽게 나타난다.
- **데모**: 기능 섹션 3개가 들어올 때마다 살짝 올라오며 나타난다. "한 번만 / 나갈 때 되돌림" 토글이 있다.
- **요청 예문**: "각 기능 섹션이 화면에 들어오면 0.4초 동안 살짝 올라오며 나타나는 Scroll Reveal, 한 번만."
- **구현**: `IntersectionObserver`, GSAP ScrollTrigger `toggleActions`·`once`, CSS `animation-timeline: view()`
- **관계**: Scroll Scrub과 비교(위 참고). 순차 등장은 Stagger와 함께

### Scroll Scrub *(추가)*
- **무엇**: 스크롤 위치가 애니메이션의 **진행률**이 된다. 멈추면 멈추고, 거꾸로 스크롤하면 되감긴다.
- **데모**: 진행률 숫자(0~100%)를 같이 보여 주는 도형 변화. 스크롤 위치와 애니메이션 진행이 일치하는 것을 확인한다. scrub 값 0(즉시) / 0.5 / 2(관성)를 비교한다.
- **요청 예문**: "이 구간의 애니메이션을 Scroll Scrub으로, 스크롤 진행률과 재생 위치를 일치시키고 역스크롤 시 되감기."
- **구현**: GSAP ScrollTrigger `scrub: true | 숫자`, CSS `animation-timeline: scroll()`
- **이 저장소의 예**: `src/connection-pool/Scrolly.tsx:136`. `AGENTS.md` 모션 어휘 1번 "스크럽"이다
- **출처**: [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

### Pin *(Pin · Scrollytelling에서 분리)*
- **무엇**: 스크롤하는데도 영역이 화면에 **고정**되어 있다. 정해진 구간이 지나면 풀린다.
- **데모**: 내부 스크롤 영역. 고정이 시작되고 끝나는 경계를 표시한다(ScrollTrigger `markers`처럼). 고정된 동안 남은 거리를 보여 준다.
- **요청 예문**: "이 섹션을 500px 스크롤하는 동안 Pin으로 화면에 고정."
- **구현**: GSAP ScrollTrigger `pin: true`, CSS `position: sticky`(부모 높이로 고정 구간을 만든다)
- **이 저장소의 예**: `src/connection-pool/Scrolly.tsx:158`. 다이어그램을 `sticky top-0`으로 고정한다
- **관계**: Sticky Header와 비교. Pin은 *구간 동안만* 고정된다. 키보드 사용자가 고정 영역에 갇히지 않게 한다(`AGENTS.md` 사용성 기준)

### Scrollytelling *(Pin · Scrollytelling에서 분리)*
- **무엇**: 스크롤에 따라 **이야기가 단계별로** 펼쳐지는 페이지 구성이다. 기법이 아니라 페이지 형식이고, 보통 Pin + Scroll Scrub으로 만든다.
- **데모**: 세 단계 이야기. "Pin 사용 / Pin 없이 순서대로 노출"을 전환해서, Scrollytelling이 Pin과 같은 것이 아님을 보여 준다.
- **요청 예문**: "기능 소개를 Scrollytelling으로: 그림은 고정하고, 오른쪽 문단이 스크롤될 때마다 그림이 3단계로 바뀌게."
- **구현**: 고정된 그래픽 + 단계 문단 + 단계 판정(ScrollTrigger나 `IntersectionObserver`)
- **이 저장소의 예**: `src/connection-pool/` 에세이 전체. 가장 큰 실물 예시라 카드에서 링크한다

### Parallax Scrolling *(UI에서 이동)*
- **무엇**: 앞쪽과 뒤쪽 요소가 **다른 속도로** 움직여 깊이감을 만든다. 너무 강하면 어지러우니 은은하게 쓴다.
- **데모**: 배경, 중간, 전경 3층. 강도 슬라이더가 있다.
- **요청 예문**: "히어로 배경에 은은한 Parallax Scrolling, 모바일에서는 약하게 또는 끔."
- **구현**: ScrollTrigger + scrub으로 층마다 다른 `y`, CSS `animation-timeline: scroll()`
- **관계**: dolly와는 비유로만 연결한다(Camera 메모 참고)

### Scroll Snap *(UI에서 이동)*
- **무엇**: 스크롤을 멈추면 화면이 특정 섹션 경계에 딱 맞춰 정렬된다.
- **데모**: 전체 화면 섹션 3개. snap 끔 / `proximity` / `mandatory`를 비교한다.
- **요청 예문**: "전체 화면 섹션에 Scroll Snap을 적용해서 어중간하게 멈추지 않게."
- **구현**: `scroll-snap-type: y mandatory`, `scroll-snap-align: start`. JS가 필요 없다
- **관계**: 움직임이 아니라 *정지 위치*를 정한다. Carousel의 구현 수단이기도 하다

### Pinned Horizontal Scroll *(표제 변경, 원제 Horizontal Scroll)*
- **무엇**: 마우스 휠은 아래로 굴리는데 화면은 옆으로 넘어간다. 섹션을 Pin으로 고정하고, 세로 스크롤 양만큼 안쪽 내용을 가로로 민다.
- **데모**: 프로젝트 카드 5장. 세로 스크롤에 따라 가로로 이동한다. "모바일" 토글을 켜면 세로 목록으로 바뀐다.
- **요청 예문**: "프로젝트 섹션을 Pinned Horizontal Scroll로: 세로 스크롤에 카드가 가로로 이동, 모바일은 세로 목록."
- **구현**: ScrollTrigger `pin` + `scrub` + `x: -(trackWidth - viewportWidth)`, 모바일은 `gsap.matchMedia()`로 분기
- **관계**: Pin + Scroll Scrub의 응용. Carousel과 비교(입력 축이 다르다)

---

## Transition — 화면 전환

### Page Transition
- **무엇**: 링크를 눌렀을 때 화면이 갑자기 바뀌지 않고, 덮였다가 새 페이지가 나타난다. 앞에서 본 Fade·Slide를 페이지 전체에 적용한 것이다. 화면을 쓸고 지나가면 **Wipe**다.
- **데모**: 미니 2페이지 앱. fade / slide-up / wipe를 고를 수 있다. 카드 안에서 페이지 이동을 흉내 낸다.
- **요청 예문**: "페이지 이동 시 Page Transition: 0.3초 Fade Out 후 새 페이지가 아래에서 살짝 올라오게."
- **구현**: View Transitions API(`document.startViewTransition()`, 다중 페이지는 `@view-transition`), `::view-transition-old`/`new`
- **관계**: Wipe = 변형. View Transitions = 구현 API. 영상 편집의 wipe와는 대상이 다르다(Edit 섹션에서 비교)

### Shared Element Transition
- **무엇**: 목록의 카드를 누르면 그 카드가 커져서 상세 화면이 된다. 두 화면이 **같은 요소를 공유**해서, 누른 것이 어디로 갔는지 놓치지 않는다.
- **데모**: 상품 카드 3장. 누르면 이미지가 상세 화면 위치로 커진다. 그냥 Page Transition일 때와 비교한다.
- **요청 예문**: "상품 카드를 누르면 카드 이미지가 상세 페이지 이미지로 이어지는 Shared Element Transition."
- **구현**: View Transitions API + `view-transition-name`, 또는 GSAP Flip plugin
- **관계**: View Transitions는 이것의 구현 API이고, 페이지 전체 전환에도 쓰인다. 영상 편집의 match cut과는 비유로만 연결한다(같은 요소 vs 닮은 다른 요소)
- **출처**: [W3C View Transitions](https://www.w3.org/TR/css-view-transitions-1/)

---

## Pointer & Event — 포인터와 사건이 시작 조건

### Magnetic Button
- **무엇**: 커서가 다가가면 버튼이 자석처럼 끌려온다. 너무 많이 따라오면 오히려 누르기 어렵다.
- **데모**: CTA 버튼. 끌림 최대값 슬라이더(0 / 10 / 30px)로, 커지면 누르기 어려워지는 것을 체감한다. 터치 기기에서는 꺼진다.
- **요청 예문**: "메인 CTA에 Magnetic 효과, 커서가 가까우면 최대 10px 끌려오게, 터치 기기에선 끔."
- **구현**: `pointermove` + GSAP `quickTo`, `@media (hover: hover) and (pointer: fine)`

### Custom Cursor
- **무엇**: 기본 화살표 대신 작은 원이 마우스를 따라온다(Cursor Follow). 링크 위에서 커지거나 글자를 담기도 한다. 터치 화면에는 커서가 없으니 모바일에서는 끈다.
- **데모**: 카드 영역 안에서만 원형 커서가 살짝 늦게 따라온다. 링크 위에서 커진다.
- **요청 예문**: "데스크톱에서만 작은 원형 Custom Cursor가 살짝 늦게 따라오고, 링크 위에서 커지게."
- **구현**: `pointermove` + `quickTo`, `pointer-events: none`. 기본 커서를 숨기면(`cursor: none`) 위치를 잃는 사용자가 생기니 숨기지 않는 쪽을 권장한다
- **관계**: Cursor Follow = 별칭

### 3D Tilt
- **무엇**: 마우스를 카드 위에서 움직이면 카드가 그 방향으로 기운다. 반사광이 같이 움직이면 실물 카드를 보는 것 같다.
- **데모**: 가격 카드. 최대 기울기 슬라이더(0~20°), 반사광을 켜고 끌 수 있다.
- **요청 예문**: "가격 카드에 마우스 위치 기준 최대 10° 3D Tilt, 반사광도 같이 이동."
- **구현**: `perspective` + `rotateX`/`rotateY`, 반사광은 `radial-gradient` 위치. CSS 3D라서 `AGENTS.md`가 금지한 Three.js와는 무관하다

### Confetti
- **무엇**: 결제 완료 같은 축하의 순간에 색종이가 터진다. 매번 터지면 금방 의미가 없어지니, 가입이나 첫 결제처럼 드문 순간에 아껴 쓴다.
- **데모**: "첫 결제 완료" 버튼을 누르면 상단에서 2초 동안 confetti가 터진다.- **요청 예문**: "첫 결제가 끝나면 화면 상단에서 2초간 Confetti."
- **구현**: SVG/DOM 입자 수십 개 + GSAP(무작위 `x`·`y`·`rotation`). 라이브러리는 `AGENTS.md` 허용 표 밖이라 직접 만든다
- **관계**: 포인터가 아니라 *사건*이 시작 조건이다. 그래서 범주 이름이 "Pointer & Event"다
