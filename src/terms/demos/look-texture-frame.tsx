import { useRef, useState } from 'react'
import { DualSceneComposer } from '@terms/components/scene/DualSceneComposer'
import { DEFAULT_LOOK_POST_EFFECT, type LookPostEffect } from '@terms/components/scene/look-post'
import { SharedScene } from '@terms/components/scene/SharedScene'
import { ViewportCanvas } from '@terms/components/scene/ViewportCanvas'
import { LookStage } from '@terms/components/stages/LookStage'

export function FilmGrainDemo() {
  const [intensity, setIntensity] = useState(55)
  const [splitPercent, setSplitPercent] = useState(50)
  const splitRef = useRef(0.5)
  const fxRef = useRef<LookPostEffect>({ ...DEFAULT_LOOK_POST_EFFECT, grainAmount: 0.55 })

  function updateSplit(next: number) {
    splitRef.current = next / 100
    setSplitPercent(next)
  }

  function updateIntensity(next: number) {
    setIntensity(next)
    fxRef.current = { ...DEFAULT_LOOK_POST_EFFECT, grainAmount: next / 100 }
  }

  return (
    <LookStage
      splitPercent={splitPercent}
      onSplitChange={updateSplit}
      beforeLabel="디지털 원본"
      afterLabel="Film Grain"
      viewport={
        <ViewportCanvas label="노을 3D 공유 장면의 Film Grain 전/후 비교" placeholderTone="sunset">
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
        <label className="grid w-full grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
          <span className="font-medium text-slate-700">강도</span>
          <span className="tabular-nums text-slate-600">{intensity}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            aria-label="강도"
            aria-valuetext={`${intensity}%`}
            onChange={(event) => updateIntensity(event.currentTarget.valueAsNumber)}
            className="col-span-2 w-full accent-indigo-700"
          />
        </label>
      }
    />
  )
}

type AspectPreset = '16:9' | '1.85:1' | '2.39:1'

const ASPECT_OPTIONS: { key: AspectPreset; label: string; bar: number }[] = [
  { key: '16:9', label: '16:9 (표준)', bar: 0 },
  { key: '1.85:1', label: '1.85:1', bar: 0.068 },
  { key: '2.39:1', label: '2.39:1 (Letterbox)', bar: 0.165 },
]

export function LetterboxDemo() {
  const [ratio, setRatio] = useState<AspectPreset>('2.39:1')
  const [splitPercent, setSplitPercent] = useState(50)
  const splitRef = useRef(0.5)
  const fxRef = useRef<LookPostEffect>({ ...DEFAULT_LOOK_POST_EFFECT, letterboxBar: 0.165 })

  function updateSplit(next: number) {
    splitRef.current = next / 100
    setSplitPercent(next)
  }

  function selectRatio(option: (typeof ASPECT_OPTIONS)[number]) {
    setRatio(option.key)
    fxRef.current = { ...DEFAULT_LOOK_POST_EFFECT, letterboxBar: option.bar }
  }

  return (
    <LookStage
      splitPercent={splitPercent}
      onSplitChange={updateSplit}
      beforeLabel="16:9 원본"
      afterLabel={ratio}
      viewport={
        <ViewportCanvas label="3D 공유 장면의 Letterbox 화면비 전/후 비교" placeholderTone="day">
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
        <fieldset className="m-0 flex flex-wrap items-center gap-1.5 border-0 p-0">
          <legend className="sr-only">화면비 선택</legend>
          {ASPECT_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={ratio === option.key}
              onClick={() => selectRatio(option)}
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

export function VignetteDemo() {
  const [amount, setAmount] = useState(65)
  const [feather, setFeather] = useState(55)
  const [splitPercent, setSplitPercent] = useState(50)
  const splitRef = useRef(0.5)
  const fxRef = useRef<LookPostEffect>({
    ...DEFAULT_LOOK_POST_EFFECT,
    vignetteAmount: 0.65,
    vignetteFeather: 0.55,
  })

  function updateSplit(next: number) {
    splitRef.current = next / 100
    setSplitPercent(next)
  }

  function syncVignette(nextAmount: number, nextFeather: number) {
    fxRef.current = {
      ...DEFAULT_LOOK_POST_EFFECT,
      vignetteAmount: nextAmount / 100,
      vignetteFeather: nextFeather / 100,
    }
  }

  return (
    <LookStage
      splitPercent={splitPercent}
      onSplitChange={updateSplit}
      beforeLabel="원본"
      afterLabel="Vignette"
      viewport={
        <ViewportCanvas label="3D 공유 장면의 Vignette 전/후 비교" placeholderTone="day">
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
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <label className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
            <span className="font-medium text-slate-700">강도(Amount)</span>
            <span className="tabular-nums text-slate-600">{amount}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={amount}
              aria-label="강도(Amount)"
              aria-valuetext={`${amount}%`}
              onChange={(event) => {
                const next = event.currentTarget.valueAsNumber
                setAmount(next)
                syncVignette(next, feather)
              }}
              className="col-span-2 w-full accent-indigo-700"
            />
          </label>
          <label className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
            <span className="font-medium text-slate-700">부드러움(Feather)</span>
            <span className="tabular-nums text-slate-600">{feather}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={feather}
              aria-label="부드러움(Feather)"
              aria-valuetext={`${feather}%`}
              onChange={(event) => {
                const next = event.currentTarget.valueAsNumber
                setFeather(next)
                syncVignette(amount, next)
              }}
              className="col-span-2 w-full accent-indigo-700"
            />
          </label>
        </div>
      }
    />
  )
}
