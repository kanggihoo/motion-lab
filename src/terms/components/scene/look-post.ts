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

  void main() {
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

export function createDualComposerResources(initialMode: ComposerMode) {
  const offscreenSceneA = new THREE.Scene()
  const offscreenSceneB = new THREE.Scene()
  const camA = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 100)
  const camB = new THREE.PerspectiveCamera(42, 16 / 10, 0.1, 100)
  const targetA = new THREE.WebGLRenderTarget(320, 200)
  const targetB = new THREE.WebGLRenderTarget(320, 200)
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
      quadGeo.dispose()
      quadMat.dispose()
    },
  }
}
