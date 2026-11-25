import type { TermSection } from './types'

export default {
  id: 'edit',
  name: 'Edit',
  categories: [
    {
      id: 'transition',
      name: 'Transition',
      loadDemos: async () => {
        const demo = await import('@terms/demos/edit-transition')
        return {
          dissolve: demo.DissolveDemo,
        }
      },
      terms: [
        {
          id: 'dissolve',
          name: 'Dissolve',
          aliases: ['Cross Dissolve'],
          definition: '앞 장면이 서서히 투명해지며 사라지는 동시에 다음 장면이 겹쳐지며 나타나는 전환이다. 낮에서 저녁으로 시간이 부드럽게 흘렀음을 알릴 때 쓴다.',
          whenToUse: '낮 장면과 노을 장면 클립이 타임라인에서 겹치는 구간을 표시하고, 겹침 길이(0.3s / 1.0s / 2.0s) 선택으로 두 장면이 겹치는 순간을 확인한다.',
          request: '낮 장면에서 노을 장면으로 겹치며 천천히 넘어가는 Dissolve로 연결.',
          filmmaking: '편집 툴 Cross Dissolve 트랜지션',
          implementation: '두 `WebGLRenderTarget` 장면을 `ShaderMaterial` `mix()`로 교차 합성, GSAP `to()`',
          relations: [],
        },
      ],
    },
  ],
} satisfies TermSection
