import { useRef, useState } from 'react'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import { DEFAULT_LOOK_POST_EFFECT, type LookPostEffect } from '@terms/components/scene/look-post'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { LookStage } from '@terms/components/stages/LookStage'

const MODE_PRESETS = [
  { label: '원본 컬러', value: 100 },
  { label: '전/후 비교', value: 50 },
  { label: 'Selective Color', value: 0 },
] as const

export function SelectiveColorDemo() {
  const [splitPercent, setSplitPercent] = useState(50)
  const splitRef = useRef(0.5)

  function updateSplit(next: number) {
    splitRef.current = next / 100
    setSplitPercent(next)
  }

  return (
    <LookStage
      splitPercent={splitPercent}
      onSplitChange={updateSplit}
      beforeLabel="원본 컬러"
      afterLabel="Selective Color"
      viewport={
        <ViewportCanvas label="원본 컬러와 주황 주인공만 남긴 Selective Color 3D 비교" placeholderTone="day">
          <DualSceneComposer
            mode="split"
            progressRef={splitRef}
            sceneA={<SharedScene timeOfDay="day" selectiveHero={false} />}
            sceneB={<SharedScene timeOfDay="day" selectiveHero />}
          />
        </ViewportCanvas>
      }
      controls={
        <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
          <legend className="sr-only">비교 모드 선택</legend>
          {MODE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              aria-pressed={splitPercent === preset.value}
              onClick={() => updateSplit(preset.value)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
            >
              {preset.label}
            </button>
          ))}
        </fieldset>
      }
    />
  )
}

type GradeKey = 'original' | 'teal-orange' | 'cool-blue' | 'warm-film'

const GRADE_OPTIONS: { key: GradeKey; label: string; code: 0 | 1 | 2 | 3 }[] = [
  { key: 'original', label: '원본', code: 0 },
  { key: 'teal-orange', label: 'Teal & Orange', code: 1 },
  { key: 'cool-blue', label: '차가운 블루', code: 2 },
  { key: 'warm-film', label: '따뜻한 필름', code: 3 },
]

export function ColorGradingDemo() {
  const [grade, setGrade] = useState<GradeKey>('teal-orange')
  const [splitPercent, setSplitPercent] = useState(50)
  const splitRef = useRef(0.5)
  const fxRef = useRef<LookPostEffect>({ ...DEFAULT_LOOK_POST_EFFECT, gradePreset: 1 })

  function updateSplit(next: number) {
    splitRef.current = next / 100
    setSplitPercent(next)
  }

  function selectGrade(option: (typeof GRADE_OPTIONS)[number]) {
    setGrade(option.key)
    if (option.key === 'original') {
      fxRef.current = { ...DEFAULT_LOOK_POST_EFFECT, gradePreset: 0 }
      updateSplit(100)
      return
    }
    fxRef.current = { ...DEFAULT_LOOK_POST_EFFECT, gradePreset: option.code }
    if (splitPercent === 100) {
      updateSplit(50)
    }
  }

  const activeLabel = GRADE_OPTIONS.find((item) => item.key === grade)?.label ?? '보정'

  return (
    <LookStage
      splitPercent={splitPercent}
      onSplitChange={updateSplit}
      beforeLabel="원본"
      afterLabel={grade === 'original' ? '원본' : activeLabel}
      viewport={
        <ViewportCanvas label="노을 3D 공유 장면의 Color Grading 전/후 비교" placeholderTone="sunset">
          <DualSceneComposer
            mode="split"
            progressRef={splitRef}
            postEffectRef={fxRef}
            sceneA={<SharedScene timeOfDay="sunset" />}
            sceneB={<SharedScene timeOfDay="sunset" />}
          />
        </ViewportCanvas>
      }
      controls={
        <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
          <legend className="sr-only">색보정 프리셋 선택</legend>
          {GRADE_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={grade === option.key}
              onClick={() => selectGrade(option)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 aria-pressed:border-indigo-700 aria-pressed:bg-indigo-50 aria-pressed:font-semibold aria-pressed:text-indigo-900"
            >
              {option.label}
            </button>
          ))}
        </fieldset>
      }
    />
  )
}

export function DayForNightDemo() {
  const [darken, setDarken] = useState(true)
  const [blueTint, setBlueTint] = useState(true)
  const [skyDarken, setSkyDarken] = useState(true)
  const [splitPercent, setSplitPercent] = useState(50)

  const splitRef = useRef(0.5)
  const fxRef = useRef<LookPostEffect>({
    ...DEFAULT_LOOK_POST_EFFECT,
    dfnDarken: 1,
    dfnBlue: 1,
    dfnSkyDarken: 1,
  })

  function updateSplit(next: number) {
    splitRef.current = next / 100
    setSplitPercent(next)
  }

  function syncSteps(nextDarken: boolean, nextBlue: boolean, nextSky: boolean) {
    fxRef.current = {
      ...DEFAULT_LOOK_POST_EFFECT,
      dfnDarken: nextDarken ? 1 : 0,
      dfnBlue: nextBlue ? 1 : 0,
      dfnSkyDarken: nextSky ? 1 : 0,
    }
  }

  return (
    <LookStage
      splitPercent={splitPercent}
      onSplitChange={updateSplit}
      beforeLabel="낮 촬영 원본"
      afterLabel="Day for Night"
      viewport={
        <ViewportCanvas label="낮 3D 공유 장면을 밤처럼 보정하는 Day for Night 전/후 비교" placeholderTone="day">
          <DualSceneComposer
            mode="split"
            progressRef={splitRef}
            postEffectRef={fxRef}
            sceneA={<SharedScene timeOfDay="day" />}
            sceneB={<SharedScene timeOfDay="day" />}
          />
        </ViewportCanvas>
      }
      controls={
        <fieldset className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-0 p-0 text-xs text-slate-700">
          <legend className="sr-only">Day for Night 3단계 보정</legend>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={darken}
              onChange={(event) => {
                const next = event.currentTarget.checked
                setDarken(next)
                syncSteps(next, blueTint, skyDarken)
              }}
            />
            1. 전체 어둡게
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={blueTint}
              onChange={(event) => {
                const next = event.currentTarget.checked
                setBlueTint(next)
                syncSteps(darken, next, skyDarken)
              }}
            />
            2. 푸른 톤
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={skyDarken}
              onChange={(event) => {
                const next = event.currentTarget.checked
                setSkyDarken(next)
                syncSteps(darken, blueTint, next)
              }}
            />
            3. 하늘 어둡게
          </label>
        </fieldset>
      }
    />
  )
}

export function VolumetricLightDemo() {
  const [density, setDensity] = useState(65)
  const [splitPercent, setSplitPercent] = useState(50)
  const splitRef = useRef(0.5)

  function updateSplit(next: number) {
    splitRef.current = next / 100
    setSplitPercent(next)
  }

  return (
    <LookStage
      splitPercent={splitPercent}
      onSplitChange={updateSplit}
      beforeLabel="맑은 공기"
      afterLabel="Volumetric Light"
      viewport={
        <ViewportCanvas label="나무 사이로 빛줄기가 비치는 Volumetric Light 3D 비교" placeholderTone="sunset">
          <DualSceneComposer
            mode="split"
            progressRef={splitRef}
            sceneA={<SharedScene timeOfDay="sunset" volumetricDensity={0} />}
            sceneB={<SharedScene timeOfDay="sunset" volumetricDensity={density / 100} />}
          />
        </ViewportCanvas>
      }
      controls={
        <label className="grid w-full grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
          <span className="font-medium text-slate-700">안개/먼지 농도</span>
          <span className="tabular-nums text-slate-600">{density}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={density}
            aria-label="안개/먼지 농도"
            aria-valuetext={`${density}%`}
            onChange={(event) => setDensity(event.currentTarget.valueAsNumber)}
            className="col-span-2 w-full accent-indigo-700"
          />
        </label>
      }
    />
  )
}
