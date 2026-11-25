import type { TermSection } from './types'

export default {
  id: 'camera',
  name: 'Camera',
  categories: [
    {
      id: 'movement',
      name: 'Movement',
      loadDemos: async () => {
        const demo = await import('@terms/demos/camera-movement')
        return {
          'dolly-zoom': demo.DollyZoomDemo,
        }
      },
      terms: [
        {
          id: 'dolly-zoom',
          name: 'Dolly Zoom',
          aliases: ['Vertigo Effect', 'Zolly'],
          definition: '카메라 이동(Dolly)과 렌즈 확대/축소(Zoom)를 **반대 방향**으로 동시에 걸어, 인물의 크기는 유지한 채 배경의 원근감만 급격히 다가오거나 멀어지게 만든다. (후진 + 줌인, 전진 + 줌아웃 모두 해당)',
          whenToUse: '평면도에서 3D 카메라가 뒤로 물러나는 동시에 화각이 좁아진다. 카메라 화면에서는 주황 주인공의 크기가 고정된 채 전경(그네·울타리)과 원경(언덕·나무)의 원근감만 밀려온다. `후진+줌인 / 전진+줌아웃` 방향 전환 토글을 둔다.',
          request: '놀라는 순간을 주황 주인공은 같은 크기로 두고 배경 언덕과 나무만 다가오는 Dolly Zoom으로.',
          filmmaking: '돌리 이동과 초점거리 변화를 반대 방향으로 동기화',
          implementation: '`three` + `@react-three/fiber` `PerspectiveCamera`의 `position.z`와 `fov`를 반대 방향으로 동기화, GSAP `to()`',
          relations: [],
        },
      ],
    },
  ],
} satisfies TermSection
