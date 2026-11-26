import * as THREE from 'three'

export interface LookPostEffect {
  gradePreset: 0 | 1 | 2 | 3 // 0: none, 1: teal-orange, 2: cool-blue, 3: warm-film
  dfnDarken: number // 0 or 1
  dfnBlue: number // 0 or 1
  dfnSkyDarken: number // 0 or 1
  grainAmount: number // 0..1
  letterboxBar: number // 0..0.3
  vignetteAmount: number // 0..1
  vignetteFeather: number // 0..1
}

export const DEFAULT_LOOK_POST_EFFECT: LookPostEffect = {
  gradePreset: 0,
  dfnDarken: 0,
  dfnBlue: 0,
  dfnSkyDarken: 0,
  grainAmount: 0,
  letterboxBar: 0,
  vignetteAmount: 0,
  vignetteFeather: 0.55,
}

export const COMPOSER_MODES = { dissolve: 0, split: 1, wipe: 2 } as const
export type ComposerMode = keyof typeof COMPOSER_MODES
export const WIPE_SHAPES = { horizontal: 0, diagonal: 1, circle: 2 } as const
export type WipeShape = keyof typeof WIPE_SHAPES

/** 렌즈·초점 후처리(Camera · Lens & Focus). mode가 있으면 장면 A에만 적용하고 합성 모드는 건너뛴다. */
export const LENS_MODES = { dof: 1, tilt: 2, fisheye: 3, flare: 4, motion: 5 } as const

/** 길이 값은 화면 높이 비율, 좌표는 uv(y 위) */
export type LensPostEffect =
  /** 깊이 기반 흐림. 반지름 = clamp(cocScale * |d - focus| / d - cocDead, 0, maxRadius). highlight는 흐린 밝은 점의 강조 */
  | { mode: 'dof'; focus: number; cocScale: number; cocDead: number; maxRadius: number; highlight?: number }
  /** 높이 center에서 ±half 띠만 선명 */
  | { mode: 'tilt'; center: number; half: number; maxRadius: number }
  /** sourceFov(세로, 도)로 렌더한 장면 A를 등거리 어안으로 편다. amount 0이면 그대로. grid는 직선 격자 간격(tan 단위, 0이면 없음) */
  | { mode: 'fisheye'; amount: 0 | 1; sourceFov: number; grid: number; renderScale: number }
  /** ghosts: t = 해(0)에서 화면 중심(1)을 지나는 축 위의 위치 */
  | {
      mode: 'flare'
      sun: [number, number]
      strength: number
      ghosts: { t: number; radius: number; alpha: number; ring: boolean }[]
    }
  /** 위는 흐림 없이, 아래는 장면 B(투명 배경의 움직이는 물체)를 가로 length(너비 비율)만큼 흐려 A 위에 얹는다 */
  | { mode: 'motion'; length: number }

const lensShader = /* glsl */ `
  uniform int uLens;
  uniform sampler2D uDepthA;
  uniform float uAspect;
  uniform float uNear;
  uniform float uFar;
  uniform float uFocus;
  uniform float uCocScale;
  uniform float uCocDead;
  uniform float uMaxRadius;
  uniform float uHighlight;
  uniform float uTiltCenter;
  uniform float uTiltHalf;
  uniform float uFisheye;
  uniform float uSourceTan;
  uniform float uGridStep;
  uniform vec2 uSun;
  uniform float uFlare;
  uniform vec4 uGhosts[5];
  uniform float uMotionLength;

  float viewDistance(vec2 uv) {
    float depth = texture2D(uDepthA, uv).x;
    return uNear * uFar / (uFar - depth * (uFar - uNear));
  }

  float cocRadius(float d) {
    return clamp(uCocScale * abs(d - uFocus) / d - uCocDead, 0.0, uMaxRadius);
  }

  vec2 spiral(int i, float count, float radius) {
    float r = radius * sqrt((float(i) + 0.5) / count);
    float angle = float(i) * 2.399963;
    return vec2(cos(angle) / uAspect, sin(angle)) * r;
  }

  // gather 방식의 심도 흐림. 이웃의 착란원이 이 픽셀까지 닿을 때만 섞는다.
  vec3 depthBlur(vec2 uv) {
    float centerDistance = viewDistance(uv);
    float centerRadius = cocRadius(centerDistance);
    vec3 sum = texture2D(uTexA, uv).rgb;
    float total = 1.0;
    for (int i = 0; i < 128; i++) {
      vec2 offset = spiral(i, 128.0, uMaxRadius);
      float reach = length(offset * vec2(uAspect, 1.0));
      float d = viewDistance(uv + offset);
      float radius = cocRadius(d);
      if (d > centerDistance) radius = min(radius, centerRadius * 2.0);
      float soft = uMaxRadius * 0.08;
      float m = smoothstep(reach - soft, reach + soft, radius);
      vec3 color = texture2D(uTexA, uv + offset).rgb;
      float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color *= 1.0 + uHighlight * smoothstep(0.45, 0.75, lum) * smoothstep(0.0, uMaxRadius * 0.5, radius);
      sum += mix(sum / total, color, m);
      total += 1.0;
    }
    return sum / total;
  }

  vec3 tiltBlur(vec2 uv) {
    float radius = uMaxRadius * smoothstep(uTiltHalf, uTiltHalf + 0.25, abs(uv.y - uTiltCenter));
    if (radius < 0.0005) return texture2D(uTexA, uv).rgb;
    vec3 sum = vec3(0.0);
    for (int i = 0; i < 64; i++) sum += texture2D(uTexA, uv + spiral(i, 64.0, radius)).rgb;
    return sum / 64.0;
  }

  vec3 fisheyeLens(vec2 uv) {
    vec2 aspect = vec2(uAspect, 1.0);
    vec2 p = (uv - 0.5) * 2.0 * aspect;
    vec2 tanPoint = p * uSourceTan;
    float len = length(p);
    if (uFisheye > 0.5 && len > 0.0001) {
      float diagonal = length(aspect);
      tanPoint = p / len * tan(len / diagonal * atan(uSourceTan * diagonal));
    }
    vec3 rgb = texture2D(uTexA, tanPoint / (uSourceTan * aspect) * 0.5 + 0.5).rgb;
    if (uGridStep > 0.0) {
      vec2 cell = tanPoint / uGridStep;
      vec2 line = abs(fract(cell - 0.5) - 0.5) / max(fwidth(cell), vec2(0.0001));
      rgb = mix(rgb, vec3(1.0), (1.0 - clamp(min(line.x, line.y) - 0.2, 0.0, 1.0)) * 0.6);
    }
    return rgb;
  }

  vec3 lensFlare(vec2 uv) {
    vec3 rgb = texture2D(uTexA, uv).rgb;
    vec2 aspect = vec2(uAspect, 1.0);
    vec2 p = (uv - uSun) * aspect;
    float r = length(p);
    vec3 flare = vec3(1.0, 0.72, 0.4) * (exp(-r * r * 90.0) * 0.75 + exp(-r * 6.0) * 0.28);
    flare += vec3(1.0, 0.8, 0.55) * exp(-abs(p.y) * 110.0) * exp(-abs(p.x) * 3.0) * 0.4;
    for (int i = 0; i < 5; i++) {
      vec4 ghost = uGhosts[i];
      vec2 center = uSun + (vec2(0.5) - uSun) * ghost.x;
      float d = length((uv - center) * aspect);
      float disc = 1.0 - smoothstep(ghost.y * 0.8, ghost.y, d);
      float ring = 1.0 - smoothstep(0.004, 0.012, abs(d - ghost.y));
      float shape = mix(disc, ring + disc * 0.15, ghost.w);
      vec3 tint = mod(float(i), 2.0) < 0.5 ? vec3(0.45, 0.8, 1.0) : vec3(1.0, 0.6, 0.35);
      flare += tint * shape * ghost.z;
    }
    return 1.0 - (1.0 - clamp(rgb, 0.0, 1.0)) * (1.0 - clamp(flare * uFlare, 0.0, 1.0));
  }

  vec3 motionStack(vec2 uv) {
    bool top = uv.y > 0.5;
    // 위·아래 칸 모두 원본의 세로 가운데 절반을 보여 준다
    float local = top ? uv.y * 2.0 - 1.0 : uv.y * 2.0;
    vec2 source = vec2(uv.x, 0.25 + local * 0.5);
    float span = top ? 0.0 : uMotionLength;
    vec4 moving = vec4(0.0);
    for (int i = 0; i < 48; i++) moving += texture2D(uTexB, source + vec2(float(i) / 47.0 * span, 0.0));
    moving /= 48.0;
    vec3 rgb = moving.rgb + texture2D(uTexA, source).rgb * (1.0 - moving.a);
    return abs(uv.y - 0.5) < 0.004 ? vec3(1.0) : rgb;
  }

  vec3 applyLens(vec2 uv) {
    if (uLens == 1) return depthBlur(uv);
    if (uLens == 2) return tiltBlur(uv);
    if (uLens == 3) return fisheyeLens(uv);
    if (uLens == 4) return lensFlare(uv);
    return motionStack(uv);
  }
`

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uProgress;
  uniform int uMode;
  uniform int uSplitAxis;
  uniform int uWipeShape;
  uniform float uBlurX;
  uniform int uGradePreset;
  uniform float uDfnDarken;
  uniform float uDfnBlue;
  uniform float uDfnSkyDarken;
  uniform float uGrainAmount;
  uniform float uLetterboxBar;
  uniform float uVignetteAmount;
  uniform float uVignetteFeather;
  varying vec2 vUv;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  vec3 applyLookEffects(vec3 rgb, vec2 uv) {
    if (uGradePreset == 1) {
      float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 teal = vec3(0.06, 0.34, 0.42);
      vec3 orange = vec3(1.12, 0.76, 0.45);
      vec3 splitTint = mix(teal, orange, smoothstep(0.18, 0.82, lum));
      rgb = mix(rgb, rgb * splitTint * 1.35, 0.62);
      rgb = (rgb - 0.5) * 1.14 + 0.5;
    } else if (uGradePreset == 2) {
      rgb = rgb * vec3(0.76, 0.90, 1.24);
      rgb = (rgb - 0.5) * 1.08 + 0.5;
    } else if (uGradePreset == 3) {
      rgb = rgb * vec3(1.16, 1.02, 0.80) + vec3(0.03, 0.015, 0.0);
    }

    if (uDfnDarken > 0.5) {
      rgb = rgb * 0.36;
      rgb = (rgb - 0.18) * 1.12 + 0.18;
    }
    if (uDfnBlue > 0.5) {
      float lum = dot(rgb, vec3(0.2126, 0.7152, 0.0722));
      rgb = mix(vec3(lum), rgb, 0.55) * vec3(0.55, 0.78, 1.35);
    }
    if (uDfnSkyDarken > 0.5) {
      rgb *= mix(1.0, 0.28, smoothstep(0.42, 0.90, uv.y));
    }

    if (uGrainAmount > 0.001) {
      float n = hash12(floor(uv * vec2(320.0, 200.0))) - 0.5;
      rgb += n * (uGrainAmount * 0.32);
    }

    if (uVignetteAmount > 0.001) {
      float d = length((uv - 0.5) * vec2(1.25, 1.0));
      float inner = mix(0.22, 0.48, clamp(uVignetteFeather, 0.0, 1.0));
      float outer = inner + mix(0.12, 0.52, clamp(uVignetteFeather, 0.0, 1.0));
      float vig = smoothstep(inner, outer, d);
      rgb *= 1.0 - vig * clamp(uVignetteAmount, 0.0, 1.0) * 0.88;
    }

    if (uLetterboxBar > 0.001 && (uv.y < uLetterboxBar || uv.y > 1.0 - uLetterboxBar)) {
      rgb = vec3(0.0);
    }

    return clamp(rgb, 0.0, 1.0);
  }

  vec4 sampleBlurX(sampler2D tex, vec2 uv) {
    if (uBlurX < 0.001) return texture2D(tex, uv);
    vec4 sum = vec4(0.0);
    for (int i = 0; i < 32; i++) {
      float offset = (float(i) / 31.0 - 0.5) * uBlurX;
      sum += texture2D(tex, vec2(uv.x + offset, uv.y));
    }
    return sum / 32.0;
  }

  // 0: 경계선이 먼저 지나가는 곳, 1: 마지막으로 지나가는 곳
  float wipeDistance(vec2 uv) {
    if (uWipeShape == 1) return (uv.x + 1.0 - uv.y) * 0.5;
    if (uWipeShape == 2) return length((uv - 0.5) * vec2(1.6, 1.0)) / length(vec2(0.8, 0.5));
    return uv.x;
  }

  ${lensShader}

  void main() {
    if (uLens > 0) {
      gl_FragColor = vec4(applyLens(vUv), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      return;
    }
    vec4 colA = sampleBlurX(uTexA, vUv);
    vec4 colB = sampleBlurX(uTexB, vUv);
    vec4 color;
    if (uMode == 0) {
      color = mix(colA, colB, clamp(uProgress, 0.0, 1.0));
    } else if (uMode == 2) {
      color = wipeDistance(vUv) < uProgress ? colB : colA;
    } else if (uSplitAxis == 1 ? vUv.y > 1.0 - uProgress : vUv.x < uProgress) {
      color = colA;
    } else {
      color = vec4(applyLookEffects(colB.rgb, vUv), colB.a);
    }
    gl_FragColor = color;
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function setLensUniforms(uniforms: ReturnType<typeof createDualComposerResources>['uniforms'], lens: LensPostEffect) {
  uniforms.uLens.value = LENS_MODES[lens.mode]
  if (lens.mode === 'dof') {
    uniforms.uFocus.value = lens.focus
    uniforms.uCocScale.value = lens.cocScale
    uniforms.uCocDead.value = lens.cocDead
    uniforms.uMaxRadius.value = lens.maxRadius
    uniforms.uHighlight.value = lens.highlight ?? 0
  } else if (lens.mode === 'tilt') {
    uniforms.uTiltCenter.value = lens.center
    uniforms.uTiltHalf.value = lens.half
    uniforms.uMaxRadius.value = lens.maxRadius
  } else if (lens.mode === 'fisheye') {
    uniforms.uFisheye.value = lens.amount
    uniforms.uSourceTan.value = Math.tan((lens.sourceFov * Math.PI) / 360)
    uniforms.uGridStep.value = lens.grid
  } else if (lens.mode === 'flare') {
    uniforms.uSun.value.set(...lens.sun)
    uniforms.uFlare.value = lens.strength
    lens.ghosts.forEach((ghost, index) => {
      uniforms.uGhosts.value[index]?.set(ghost.t, ghost.radius, ghost.alpha, ghost.ring ? 1 : 0)
    })
  } else {
    uniforms.uMotionLength.value = lens.length
  }
}

export function createDualComposerResources(initialMode: ComposerMode, withDepth = false) {
  const offscreenSceneA = new THREE.Scene()
  const offscreenSceneB = new THREE.Scene()
  const camA = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 100)
  const camB = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 100)
  const targetA = new THREE.WebGLRenderTarget(320, 200)
  const targetB = new THREE.WebGLRenderTarget(320, 200)
  const depthA = withDepth ? new THREE.DepthTexture(320, 200) : null
  if (depthA) targetA.depthTexture = depthA
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quadGeo = new THREE.PlaneGeometry(2, 2)

  const uniforms = {
    uTexA: { value: targetA.texture },
    uTexB: { value: targetB.texture },
    uProgress: { value: 0 },
    uMode: { value: COMPOSER_MODES[initialMode] as number },
    uSplitAxis: { value: 0 },
    uWipeShape: { value: 0 },
    uBlurX: { value: 0 },
    uGradePreset: { value: 0 },
    uDfnDarken: { value: 0 },
    uDfnBlue: { value: 0 },
    uDfnSkyDarken: { value: 0 },
    uGrainAmount: { value: 0 },
    uLetterboxBar: { value: 0 },
    uVignetteAmount: { value: 0 },
    uVignetteFeather: { value: 0.55 },
    uLens: { value: 0 },
    uDepthA: { value: depthA },
    uAspect: { value: 1.6 },
    uNear: { value: camA.near },
    uFar: { value: camA.far },
    uFocus: { value: 0 },
    uCocScale: { value: 0 },
    uCocDead: { value: 0 },
    uMaxRadius: { value: 0 },
    uHighlight: { value: 0 },
    uTiltCenter: { value: 0 },
    uTiltHalf: { value: 0 },
    uFisheye: { value: 0 },
    uSourceTan: { value: 0 },
    uGridStep: { value: 0 },
    uSun: { value: new THREE.Vector2() },
    uFlare: { value: 0 },
    uGhosts: { value: Array.from({ length: 5 }, () => new THREE.Vector4()) },
    uMotionLength: { value: 0 },
  }

  const quadMat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  })

  const quadScene = new THREE.Scene()
  quadScene.add(new THREE.Mesh(quadGeo, quadMat))

  return {
    offscreenSceneA,
    offscreenSceneB,
    camA,
    camB,
    targetA,
    targetB,
    quadCam,
    quadGeo,
    quadMat,
    quadScene,
    uniforms,
    dispose() {
      targetA.dispose()
      targetB.dispose()
      depthA?.dispose()
      quadGeo.dispose()
      quadMat.dispose()
    },
  }
}
