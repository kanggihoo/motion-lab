#!/usr/bin/env bash
# 커넥션 풀 편 배경 생성. 프롬프트 = 공간 + 구도 + 조명 + 색온도 + 질감 + 금지 (AGENTS.md)
# 후보끼리는 [공간]만, 장면끼리는 [조명]·[색온도]만 바꾼다.
#   ./gen-bg.sh <이름> "<공간>" ["<조명>"] ["<색온도>"]
# 결과: <이름>.png, 옆의 <이름>.png.json 에 프롬프트·백엔드·생성 시각 (ego-image가 기록)
set -euo pipefail
cd "$(dirname "$0")"
name=$1
space=$2
light=${3:-calm, even and neutral, a soft glow far in the distance}
palette=${4:-cool teal and blue-green, desaturated}
prompt="$space. Photographic, 35 mm film look: matte, soft focus, low contrast, fine grain, very dark overall. \
Wide symmetrical view at eye level; the centre of the frame is open, dark and hazy, with the architecture kept to the left and right edges. \
Light: $light. Palette: $palette. No text, signage, logos, people, screens or equipment. Landscape 16:9."
"${EGO_IMAGE:-$HOME/.claude/skills/ego-image/ego-image}" "$prompt" -o "$name.png"
