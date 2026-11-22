import type { TermSection } from './types'

export default {
  id: 'style',
  name: 'Style',
  categories: [
    {
      id: "surface-contrast",
      name: "Surface & Contrast",
      loadDemos: async () => {
        const demo = await import('@terms/demos/surface-contrast')
        return {
          "glassmorphism": demo.GlassmorphismDemo,
          "elevation": demo.ElevationDemo,
          "text-contrast": demo.TextContrastDemo,
        }
      },
      terms: [
        {
          id: "glassmorphism",
          name: "Glassmorphism",
          aliases: ["Frosted Glass", "유리 효과"],
          definition: "뒤 배경이 흐리게 비치는 반투명 유리 질감의 스타일이다. 글자가 읽기 어려워질 수 있어서 대비 확보가 조건이다.",
          whenToUse: "컬러 배경 위의 카드. blur 강도와 배경 불투명도 슬라이더가 있다. 카드 위 글자의 **현재 대비 값**(예: 3.1:1 ✗ / 4.8:1 ✓)을 실시간으로 표시해서 Text Contrast 카드로 이어지게 한다.",
          request: "카드 배경을 Glassmorphism으로(backdrop blur 12px, 반투명 흰색), 단 본문 대비 4.5:1 유지.",
          implementation: "`backdrop-filter: blur()`, 반투명 `background`, 얇은 밝은 `border`. Tailwind `backdrop-blur-*`",
          relations: [],
          related: {
            names: ["Text Contrast"],
            description: "Text Contrast가 사용 조건이다",
          },
        },
        {
          id: "elevation",
          name: "Elevation",
          aliases: ["Shadow Depth", "그림자 깊이"],
          definition: "그림자의 깊이로 **층위**를 표현한다. 예: 팝오버가 카드보다 위에, 모달이 그보다 위에 떠 보인다.",
          whenToUse: "같은 화면에 바닥, 카드, Popover, Modal Dialog를 겹쳐 놓고 층마다 그림자를 다르게 준다. \"모두 같은 그림자\"로 바꾸면 무엇이 위인지 헷갈리는 것을 보여 준다.",
          request: "Elevation을 3단계로: 카드는 약한 그림자, Popover는 중간, Modal Dialog는 가장 깊게.",
          implementation: "`box-shadow` 단계(Tailwind `shadow-sm`/`md`/`xl`), 어두운 테마에서는 그림자 대신 표면 밝기로 층을 나눈다",
          relations: [],
          related: {
            names: ["Popover", "Modal Dialog", "Drawer"],
            description: "UI의 Popover, Modal Dialog, Drawer와 연결. hover 시 카드가 \"떠오르는\" 것은 Elevation이 한 단계 바뀌는 것이다",
          },
        },
        {
          id: "text-contrast",
          name: "Text Contrast",
          aliases: ["Contrast Ratio", "명도 대비"],
          definition: "글자색과 배경색의 **명도 대비 비율**이다. 보통 크기 본문은 4.5:1 이상, 큰 글자는 3:1 이상(WCAG AA).",
          whenToUse: "글자색과 배경색 선택기. 대비 비율과 통과 여부(✓/✗, 색만이 아니라 기호와 텍스트로 표시)를 실시간으로 보여 준다. 자주 틀리는 예(회색 위 회색, 사진 위 흰 글씨)를 프리셋으로 둔다.",
          request: "모든 본문 텍스트는 배경과 Text Contrast 4.5:1 이상, 보조 텍스트도 예외 없음.",
          implementation: "브라우저 DevTools의 contrast 표시, 대비 계산 공식(상대 휘도). Tailwind 색상 단계에서 조합을 고정한다",
          relations: [],
          related: {
            names: ["Glassmorphism"],
            description: "Glassmorphism의 사용 조건. `AGENTS.md` \"명도 대비\"",
          },
        },
      ],
    },
    {
      id: "typography-spacing",
      name: "Typography & Spacing",
      loadDemos: async () => {
        const demo = await import('@terms/demos/typography-spacing')
        return {
          "type-scale": demo.TypeScaleDemo,
          "spacing-scale": demo.SpacingScaleDemo,
        }
      },
      terms: [
        {
          id: "type-scale",
          name: "Type Scale",
          aliases: ["Typography Scale", "타이포 스케일"],
          definition: "제목, 본문, 라벨의 글자 크기를 **정해진 단계**로만 쓰는 규칙이다. 예: 12 / 16 / 20 / 24 / 32. 아무 크기나 쓰지 않는다.",
          whenToUse: "같은 카드 화면을 \"제각각 크기\"(13, 15, 17, 22…)와 \"Type Scale 적용\"으로 전환한다. 비율(1.2 / 1.25 / 1.333)을 바꾸면 전체가 한 번에 바뀐다.",
          request: "Type Scale을 12·14·16·20·24·32로 고정하고, 제목·본문·라벨은 이 단계만 사용.",
          implementation: "Tailwind `text-xs` ~ `text-3xl`(또는 `@theme`에서 단계 정의), 반응형은 `clamp()`",
          relations: [],
          related: {
            names: ["Typography (Typeset)"],
            description: "`AGENTS.md` \"타이포 스케일 고정\"이 시각 완성도 1단계다",
          },
        },
        {
          id: "spacing-scale",
          name: "Spacing Scale",
          aliases: ["Spacing", "여백 단계"],
          definition: "요소 안팎의 간격을 **정해진 단계**로만 쓰는 규칙이다. 예: 4 / 8 / 16 / 24 / 32 / 48px.",
          whenToUse: "같은 카드 화면을 \"제각각 여백\"과 \"8px 단위 Spacing Scale\"로 전환한다. 여백 시각화(margin·padding에 색 띠)를 켜고 끌 수 있다.",
          request: "간격은 Spacing Scale 4·8·16·24·32·48px만 사용, 카드 안쪽 16, 카드 사이 24.",
          implementation: "Tailwind spacing(`p-4` = 16px 등, 기본 4px 단위), CSS 변수로 단계 고정",
          relations: [],
          related: {
            names: ["Grid Layout", "Bento Grid"],
            description: "UI · Layout 카드(Grid Layout, Bento Grid)의 `gap`이 이 단계를 따른다. 배치 패턴이 아니라 수치 체계라서 Style에 둔다. `AGENTS.md` \"여백 정리\"",
          },
        },
      ],
    },
  ],
} satisfies TermSection
