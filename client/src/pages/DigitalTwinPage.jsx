import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownLeft, Box, ChevronLeft, ChevronRight, HeartPulse, Pause, Play, ShieldAlert, Wind, Zap } from 'lucide-react'
import TwinAnatomy from '../components/TwinAnatomy'
import { Page, Panel } from '../components/WorkspaceUI'
import { buildTwinTimeline, getTwinState, twinTime } from '../lib/twinTelemetry'
import { useWearableFeed } from '../lib/useWearableFeed'
import { wearableDrills } from '../lib/wearableSimulation'

const DigitalTwin3D = lazy(() => import('../components/DigitalTwin3D'))

function formatReading(value, unit) {
  return value == null ? 'Unavailable' : `${value.toLocaleString('en-IN')} ${unit}`
}

const layers = [
  { id: 'pulse', label: 'Heartbeat', Icon: HeartPulse, color: 'text-rose-300', key: 'pulse', unit: 'bpm',
    explanation: 'The heart marker beats at the displayed pulse rate.' },
  { id: 'oxygen', label: 'Blood oxygen', Icon: Wind, color: 'text-cyan-300', key: 'oxygen', unit: '% SpO₂',
    explanation: 'The chest overlay is tinted by measured oxygen saturation.' },
  { id: 'activity', label: 'Movement', Icon: Activity, color: 'text-emerald-300', key: 'steps', unit: 'steps today',
    explanation: 'The model moves with the activity signal. Replay estimates movement from consecutive demo step totals.' },
  { id: 'stress', label: 'Stress signal', Icon: Zap, color: 'text-violet-300', key: 'stress', unit: '/ 100',
    explanation: 'The purple ring changes intensity with the reported stress score.' },
]

function Timeline({ entries, index, choose, replaying, playing, togglePlayback }) {
  return (
    <Panel title="Reading timeline">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-semibold" htmlFor="twin-reading">
          {replaying ? 'Replay reading' : 'Latest reading'}
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="workspace-button workspace-primary" disabled={entries.length < 2} onClick={togglePlayback}>
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}{playing ? 'Pause replay' : 'Play history'}
          </button>
          <button type="button" className="workspace-button" disabled={!replaying} onClick={() => choose(null)}>Return to live</button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" className="workspace-button" aria-label="Previous reading" disabled={index <= 0} onClick={() => choose(entries[index - 1].recordedAt)}><ChevronLeft className="size-4" /></button>
        <input id="twin-reading" className="min-w-0 flex-1 accent-indigo-400" type="range" min={0} max={Math.max(0, entries.length - 1)}
          value={Math.max(0, index)} disabled={entries.length < 2}
          aria-valuetext={entries[index] ? twinTime.format(new Date(entries[index].recordedAt)) : 'No sample'}
          onChange={event => choose(entries[Number(event.target.value)].recordedAt)} />
        <button type="button" className="workspace-button" aria-label="Next reading" disabled={index < 0 || index >= entries.length - 1} onClick={() => choose(entries[index + 1].recordedAt)}><ChevronRight className="size-4" /></button>
      </div>
      <div className="mt-2 flex justify-between gap-2 text-xs text-text-secondary">
        <span>{entries.length ? twinTime.format(new Date(entries[0].recordedAt)) : 'Waiting for history'}</span>
        <span>{entries.length} {entries.length === 1 ? 'sample' : 'samples'}</span>
        {entries.length > 0 && <span>{twinTime.format(new Date(entries.at(-1).recordedAt))}</span>}
      </div>
    </Panel>
  )
}

export default function DigitalTwinPage() {
  const { latest, readings, isDemo, setDrill } = useWearableFeed()
  const [selectedTime, setSelectedTime] = useState(null)
  const [playUntil, setPlayUntil] = useState(null)
  const [selected, setSelected] = useState('pulse')
  const [view, setView] = useState('3d')
  const timeline = useMemo(() => buildTwinTimeline(readings, latest), [readings, latest])
  const pinnedIndex = selectedTime === null ? -1 : timeline.findIndex(sample => sample.recordedAt === selectedTime)
  const replaying = pinnedIndex >= 0
  const index = replaying ? pinnedIndex : timeline.length - 1
  const nextSampleTime = timeline[index + 1]?.recordedAt
  const playing = replaying && !!playUntil && !!nextSampleTime && nextSampleTime <= playUntil
  const sample = replaying ? timeline[pinnedIndex] : latest
  const sampleTime = Date.parse(sample.recordedAt)
  const previous = timeline.findLast(entry => Date.parse(entry.recordedAt) < sampleTime)
  const signal = getTwinState(sample, previous)
  const sampleLabel = Number.isFinite(sampleTime) ? twinTime.format(new Date(sampleTime)) : 'Waiting for a reading'
  const activeLayer = layers.find(layer => layer.id === selected)
  const anatomy = <TwinAnatomy signal={signal} selected={selected} />
  const fallback = <div className="grid h-full w-full place-items-center gap-1 p-3">
    {anatomy}
    <p className="pb-7 text-center text-xs text-text-secondary">3D rendering is unavailable in this browser. Showing the anatomy view.</p>
  </div>

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setSelectedTime(nextSampleTime), 650)
    return () => window.clearTimeout(timer)
  }, [playing, nextSampleTime])

  function chooseReading(time) {
    setPlayUntil(null)
    setSelectedTime(time)
  }

  function togglePlayback() {
    if (playing) {
      setPlayUntil(null)
      return
    }
    if (timeline.length < 2) return
    if (!replaying || index >= timeline.length - 1) setSelectedTime(timeline[0].recordedAt)
    setPlayUntil(timeline.at(-1).recordedAt)
  }

  function runDrill(overrides) {
    chooseReading(null)
    setDrill(overrides)
  }

  return (
    <Page title="Human Digital Twin" description="See how wearable readings change the model, then replay an earlier sample."
      action={<div className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2 text-xs">
        <span className={`size-2 rounded-full ${replaying ? 'bg-amber-400' : 'bg-cyan-400'}`} />
        <strong>{replaying ? 'Replay' : isDemo || sample.simulated ? 'Live demo' : 'Live wearable'}</strong>
        <time dateTime={sample.recordedAt} className="text-text-secondary">{sampleLabel}</time>
      </div>}>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section aria-label="Twin model" className="overflow-hidden rounded-2xl border border-border bg-bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold">Body model</h2>
            <div className="flex gap-2" role="group" aria-label="Model view">
              {[['3d', '3D model', Box], ['anatomy', '2D anatomy', ArrowDownLeft]].map(([mode, label, Icon]) => (
                <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}
                  className={`workspace-button ${view === mode ? 'workspace-primary' : ''}`}><Icon className="size-4" />{label}</button>
              ))}
            </div>
          </div>
          <div className="twin-stage min-h-72 sm:min-h-[420px]">
            {view === '3d' ? <Suspense fallback={<p role="status" className="text-sm text-text-secondary">Loading 3D model…</p>}>
              <DigitalTwin3D signal={signal} selected={selected} onSelect={setSelected} fallback={fallback} />
            </Suspense> : anatomy}
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-bg-dark/85 px-2 py-1 text-[11px] text-text-secondary">
              {signal.fall ? 'Fall pose' : signal.activity ?? 'Activity unavailable'}
            </div>
          </div>
          <p className="border-t border-border px-4 py-3 text-xs text-text-secondary">
            {view === '3d' ? 'Select a hotspot to explore a reading. Drag to rotate or pinch to zoom.' : 'Animations visualize the readings for the selected sample.'}
          </p>
        </section>

        <div className="space-y-4">
          <Panel title="Signal layers">
            <div className="grid grid-cols-2 gap-2">
              {layers.map(({ id, label, Icon, color, key, unit }) => (
                <button key={id} type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}
                  className={`min-w-0 rounded-xl border p-3 text-left ${selected === id ? 'border-indigo-400 bg-primary-50' : 'border-border bg-bg-subtle hover:border-indigo-400/60'}`}>
                  <Icon className={`mb-2 size-4 ${color}`} />
                  <span className="block text-xs text-text-secondary">{label}</span>
                  <span className="mt-1 block text-sm font-extrabold tabular-nums">{formatReading(signal[key], unit)}</span>
                </button>
              ))}
            </div>
            <div aria-live={playing ? 'off' : 'polite'} className="mt-3 rounded-lg border border-border bg-bg-dark px-3 py-2">
              <p className={`text-xs font-bold ${activeLayer.color}`}>{activeLayer.label} · {formatReading(signal[activeLayer.key], activeLayer.unit)}</p>
              <p className="mt-1 text-xs text-text-secondary">{activeLayer.explanation}</p>
            </div>
            {signal.stepDelta != null && <p className="mt-1 text-xs text-text-secondary">{signal.stepDelta} steps since the previous minute</p>}
          </Panel>
          <Panel title="Sample alerts">
            <div role="status" className="flex items-start gap-2 text-sm">
              <ShieldAlert className={`mt-0.5 size-4 shrink-0 ${signal.alerts.length ? 'text-amber-300' : 'text-cyan-300'}`} />
              {!Number.isFinite(sampleTime) ? <p>Waiting for wearable readings.</p> : signal.alerts.length > 0
                ? <ul className="space-y-1">{signal.alerts.map(alert => <li key={alert.type}>{alert.message}</li>)}</ul>
                : <p>No active alerts in this sample.</p>}
            </div>
            {isDemo && <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              {wearableDrills.map(({ label, overrides }) => <button type="button" key={label} className="workspace-button" onClick={() => runDrill(overrides)}>{label}</button>)}
            </div>}
          </Panel>
        </div>
      </div>
      <Timeline entries={timeline} index={index} choose={chooseReading} replaying={replaying} playing={playing} togglePlayback={togglePlayback} />
      {selectedTime !== null && !replaying && <p role="status" className="text-xs text-text-secondary">That sample left the available history. Showing the latest reading.</p>}
    </Page>
  )
}
