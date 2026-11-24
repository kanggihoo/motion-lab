# 용어 대시보드의 Camera·Edit·Look 데모는 Three.js 3D 공유 장면 하나로 그린다

AGENTS.md는 접근성 때문에 렌더링 기본값을 SVG로 두고 Canvas·WebGL을 피하며, 에세이에서는 3D를 범위 밖으로 둔다. 그런데도 용어 대시보드의 Camera·Edit·Look 섹션은 `three` + `@react-three/fiber`로 만든 3D 장면 하나를 모든 데모가 함께 쓰기로 했다(2026-11-24, 사용자 결정). Dolly Zoom, Arc Shot, Bird's-eye View처럼 카메라의 위치와 각도가 핵심인 카드를 2D로 그리면 근사와 예외 처리가 늘어난다. 같은 장면에서 차이만 바꿔 보여야 카드끼리 비교가 읽힌다.

## Considered Options

- **깊이별 SVG 판 + 투영 공식(2.5D)**: Dolly·Zoom·Pan은 정확하다. 하지만 Arc Shot·Bird's-eye View·High/Low Angle은 각도별 인물 그림과 CSS `perspective`로 근사해야 한다. 사용자는 이 방식이 3D를 쓰는 것보다 복잡하다고 판단했다.
- **카드마다 문서에 적힌 장면(시장, 숲, 공원)을 따로 그리기**: 장면이 카드마다 달라 효과의 차이만 비교할 수 없고, 그리는 비용이 카드 수만큼 든다.
- **생성 이미지**: 대시보드에는 배경 이미지가 없다는 AGENTS.md 규칙과 맞지 않고, 카메라 이동을 보여 줄 수 없다.
- **glTF 모델 파일**: 모델을 구하거나 만드는 비용이 따로 든다. 장면은 기본 도형으로 조립한다.
- **`three`만 사용**: R3F를 쓰면 unmount할 때 자원이 해제되어 범주를 옮겨도 장면이 남지 않는다.
- **`@react-three/drei`의 `View`로 페이지 전체 canvas 하나에 카드별 영역 그리기**: drei는 AGENTS.md 조건부 표에 없어 쓰지 않는다.

## Consequences

- 한 범주에 카드가 최대 11장(Camera · Movement) 나오므로, 카드 하나는 canvas를 최대 1개만 가지고 viewport 안이나 그 가까이에 있을 때만 띄운다. 이렇게 해야 브라우저의 동시 WebGL context 한도에 걸리지 않는다.
- WebGL 화면은 스크린리더가 읽지 못한다. 카드의 정의와 데모 설명이 DOM에 있어서 내용은 전달되며, canvas별 상태 설명 텍스트는 요구하지 않았다.
- 영상 3섹션 53장이 이 장면 위에 만들어진다. 나중에 SVG로 바꾸려면 무대와 데모를 전부 다시 만들어야 한다.
- 에세이(`src/connection-pool/`)의 3D 금지는 바뀌지 않는다.
