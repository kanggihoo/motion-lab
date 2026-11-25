import type { TermSection } from './types'

export default {
  id: 'motion',
  name: 'Motion',
  categories: [
    {
      id: 'scroll',
      name: 'Scroll',
      loadDemos: async () => {
        const demo = await import('@terms/demos/motion-scroll')
        return {
          'scroll-scrub': demo.ScrollScrubDemo,
        }
      },
      terms: [
        {
          id: 'scroll-scrub',
          name: 'Scroll Scrub',
          aliases: ['Scrub'],
          definition: '스크롤 위치가 애니메이션의 **진행률**이 된다. 멈추면 멈추고, 거꾸로 스크롤하면 되감긴다.',
          whenToUse: '진행률 숫자(0~100%)를 같이 보여 주는 도형 변화. 스크롤 위치와 애니메이션 진행이 일치하는 것을 확인한다. scrub 값 0(즉시) / 0.5 / 2(관성)를 비교한다.',
          request: '이 구간의 애니메이션을 Scroll Scrub으로, 스크롤 진행률과 재생 위치를 일치시키고 역스크롤 시 되감기.',
          implementation: 'GSAP ScrollTrigger `scrub: true | 숫자`, CSS `animation-timeline: scroll()`',
          repoExample: '`src/connection-pool/Scrolly.tsx:136`. `AGENTS.md` 모션 어휘 1번 "스크럽"이다',
          relations: [],
        },
      ],
    },
  ],
} satisfies TermSection
