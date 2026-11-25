import type { TermSection } from './types'

export default {
  id: 'look',
  name: 'Look',
  categories: [
    {
      id: 'color-light',
      name: 'Color & Light',
      loadDemos: async () => {
        const demo = await import('@terms/demos/look-color-light')
        return {
          'color-grading': demo.ColorGradingDemo,
          'selective-color': demo.SelectiveColorDemo,
          'day-for-night': demo.DayForNightDemo,
          'volumetric-light': demo.VolumetricLightDemo,
        }
      },
      terms: [
        {
          id: 'color-grading',
          name: 'Color Grading',
          aliases: ['Color Correction', 'Teal & Orange'],
          definition: '영상의 색감·명암·대비를 의도적으로 조율해 특정 분위기(따뜻함·차가움·시네마틱)를 만드는 후반 작업이다. 촬영 원본의 화이트밸런스·노출을 정상으로 맞추는 **Color Correction**과 구분한다.',
          whenToUse: '노을 3D 공유 장면에 `원본 / Teal & Orange / 차가운 블루 / 따뜻한 필름` 프리셋 전환과 전/후 분할 슬라이더를 둔다.',
          request: '노을 지는 들판 장면을 오렌지와 틸 대비가 살아 있는 시네마틱 Color Grading으로.',
          filmmaking: 'DaVinci Resolve / Premiere Lumetri Color(LUT, Lift/Gamma/Gain, 색바퀴)',
          implementation: '단일 `WebGLRenderTarget` 장면에 `ShaderMaterial` 색분할 톤 매핑과 대비 보정을 적용해 전/후 분할 비교',
          relations: [
            { kind: 'variant', target: 'Selective Color', description: '특정 색만 남기고 나머지를 흑백으로 만드는 특수 변형이다.' },
            { kind: 'variant', target: 'Day for Night', description: '낮 장면을 밤처럼 누르는 특수 변형이다.' },
          ],
        },
        {
          id: 'selective-color',
          name: 'Selective Color',
          aliases: ['Color Splash', 'Color Isolation'],
          definition: '화면 전체를 흑백으로 만들고 강조할 단 하나의 색만 남기는 기법이다. 시청자의 시선을 남은 색의 피사체로 즉각 집중시킨다(예: *쉰들러 리스트*의 빨간 코트).',
          whenToUse: '3D 공유 장면에서 `원본 컬러`와 `Selective Color(주황 주인공만 유지)`를 전/후 분할 슬라이더와 토글로 비교한다.',
          request: '장면 전체를 흑백으로 바꾸고 주황 주인공의 색만 남기는 Selective Color 적용.',
          filmmaking: 'HSL Secondary 색 분리 + 나머지 채도 0%',
          implementation: '원본/선택 컬러 두 3D 장면을 `WebGLRenderTarget`으로 렌더링해 분할 `ShaderMaterial`로 비교',
          relations: [],
        },
        {
          id: 'day-for-night',
          name: 'Day for Night',
          aliases: ['American Night', 'nuit américaine'],
          definition: '낮에 촬영한 장면을 후반 색보정으로 어둡고 푸르게 눌러 달빛 아래 밤 장면처럼 보이게 만드는 기법이다. 전체 어둡게 → 푸른 톤 → 하늘 더 어둡게의 3단계로 만든다.',
          whenToUse: '낮 3D 공유 장면에 3단계 체크박스(`1. 전체 어둡게 / 2. 푸른 톤 / 3. 하늘 어둡게`)와 전/후 분할 슬라이더를 두어 밤 장면으로 변하는 과정을 확인한다.',
          request: '맑은 낮 들판 장면을 어둡고 푸른 Day for Night 효과로 달빛 밤처럼.',
          filmmaking: '노출 하향, 색온도 냉색 이동, 하늘 파워 윈도우/그라데이션 감광',
          implementation: '낮 3D 장면에 `ShaderMaterial` 노출 하향·청색 톤·상단 하늘 감광 3단계를 단계별로 적용해 전/후 분할 비교',
          relations: [],
        },
        {
          id: 'volumetric-light',
          name: 'Volumetric Light',
          aliases: ['God Rays', 'Light Shafts', 'Crepuscular Rays'],
          definition: '공기 중의 안개·먼지·습기에 강한 빛이 부딪히며 빛줄기(광선 기둥)의 형태가 눈에 보이는 대기광 효과다. 숲·창가 장면에 신비롭고 입체적인 공간감을 준다.',
          whenToUse: '노을 3D 공유 장면의 나무 사이에서 `안개/먼지 농도` 슬라이더를 올리면 사선 빛줄기가 드러나는 모습을 전/후 분할로 비교한다.',
          request: '노을 진 나무 사이로 햇빛이 쏟아지는 Volumetric Light 추가.',
          filmmaking: '현장 헤이저(hazer)·스모그 + 강한 역광, CG 볼류메트릭 셰이더',
          implementation: '3D 공유 장면 나무 사이에 반투명 사선 광선 평면을 배치하고 농도 슬라이더와 전/후 분할로 비교',
          relations: [],
        },
      ],
    },
    {
      id: 'texture-frame',
      name: 'Texture & Frame',
      loadDemos: async () => {
        const demo = await import('@terms/demos/look-texture-frame')
        return {
          'film-grain': demo.FilmGrainDemo,
          letterbox: demo.LetterboxDemo,
          vignette: demo.VignetteDemo,
        }
      },
      terms: [
        {
          id: 'film-grain',
          name: 'Film Grain',
          aliases: ['Grain', 'Noise'],
          definition: '아날로그 필름 고유의 미세한 은염 입자 질감을 디지털 화면에 더해 고전 영화 같은 따뜻함과 유기적 질감을 준다.',
          whenToUse: '노을 그네 3D 공유 장면에서 `강도` 슬라이더를 조절하며 디지털 원본과 정적 Film Grain 질감을 전/후 분할로 비교한다.',
          request: '노을 지는 그네 장면에 옛날 영화 같은 거친 Film Grain 질감 추가.',
          filmmaking: '실제 필름 스캔 그레인 오버레이 또는 편집 툴 Film Grain 효과',
          implementation: '`ShaderMaterial`의 정적 해시 노이즈를 `후` 영역에 합성해 `LookStage` 전/후 분할로 비교',
          relations: [],
        },
        {
          id: 'letterbox',
          name: 'Letterbox',
          aliases: ['Pillarbox', '2.39:1'],
          definition: '영화용 와이드 화면비(`2.39:1` 등)를 표준 `16:9` 화면에 맞춰 담을 때 위아래에 생기는 검은 띠(마스킹)다. 촬영 기법 자체가 아니라 출력 화면비 포맷에서 비롯되며, 영화 같은 인상을 주는 연출로도 쓰인다.',
          whenToUse: '낮 3D 공유 장면을 `16:9 (표준) / 1.85:1 / 2.39:1 (Letterbox)` 버튼으로 전환해 `16:9` 원본(`전`)과 상하 검은 띠(`후`)의 구도 밀도 차이를 비교한다.',
          request: '화면 위아래에 검은 띠를 넣어 2.39:1 영화 비율의 Letterbox 효과 적용.',
          filmmaking: '시퀀스/출력 Aspect Ratio 설정 또는 상하 2.39:1 크롭 매트',
          implementation: '선택한 화면비에 따른 상하 검은 띠를 `ShaderMaterial` `후` 영역에 마스킹해 16:9 원본과 분할 비교',
          relations: [],
        },
        {
          id: 'vignette',
          name: 'Vignette',
          aliases: [],
          definition: '화면 네 모서리와 가장자리를 자연스럽게 어둡게(또는 흐리게) 눌러 시청자의 시선을 화면 중앙 피사체로 모으는 처리다.',
          whenToUse: '낮 3D 공유 장면에서 `강도(Amount)`와 `부드러움(Feather)` 슬라이더를 조절해 원본과 시선 집중도를 전/후 분할로 비교한다.',
          request: '주황 주인공에게 시선이 모이도록 화면 가장자리를 은은하게 어둡게 누르는 Vignette 추가.',
          filmmaking: 'Adobe Premiere Pro Lumetri Color `Vignette`(Amount·Midpoint·Roundness·Feather) 또는 대구경 렌즈 주변광량 저하',
          implementation: '`ShaderMaterial`에서 중심 거리 기반 방사형 감광(`smoothstep`)을 적용해 `LookStage` 전/후 분할로 비교',
          relations: [],
        },
      ],
    },
  ],
} satisfies TermSection
