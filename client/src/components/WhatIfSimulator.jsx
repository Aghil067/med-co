import { useState } from 'react'
import { Beaker } from 'lucide-react'
import { getScenarioScore } from '../lib/healthSignals'
import { useWearableFeed } from '../lib/useWearableFeed'

const controls = [
  { key: 'steps', label: 'Daily steps', min: -2000, max: 4000, step: 100, unit: 'steps' },
  { key: 'stress', label: 'Stress score', min: -25, max: 25, step: 1, unit: 'points' },
]

function signed(value) {
  return value > 0 ? `+${value.toLocaleString()}` : value.toLocaleString()
}

export default function WhatIfSimulator() {
  const { latest, stepGoal } = useWearableFeed()
  const [changes, setChanges] = useState({ steps: 0, stress: 0 })
  const baseline = getScenarioScore(latest, { stepGoal })
  const projected = getScenarioScore(latest, { ...changes, stepGoal })

  return (
    <section className="bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Beaker className="w-4 h-4 text-primary-light" />
        <h3 className="text-[13px] font-bold">What-If Simulator</h3>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-bg-subtle rounded-xl border border-border p-4">
          <h4 className="text-xs font-bold mb-3">Current readings</h4>
          <dl className="space-y-2 text-[11px] text-text-secondary">
            <div className="flex justify-between gap-2"><dt>Pulse</dt><dd>{latest.heartRate == null ? '—' : `${latest.heartRate} bpm`}</dd></div>
            <div className="flex justify-between gap-2"><dt>SpO₂</dt><dd>{latest.oxygenLevel == null ? '—' : `${latest.oxygenLevel}%`}</dd></div>
            <div className="flex justify-between gap-2"><dt>Steps</dt><dd>{latest.steps?.toLocaleString() ?? '—'}</dd></div>
            <div className="flex justify-between gap-2"><dt>Stress</dt><dd>{latest.stressScore ?? '—'}</dd></div>
          </dl>
        </div>
        <div className="space-y-3">
          {controls.map(({ key, label, min, max, step, unit }) => (
            <label key={key} className="block">
              <span className="flex justify-between gap-2 text-[11px] font-semibold">
                {label}<span>{signed(changes[key])} {unit}</span>
              </span>
              <input type="range" min={min} max={max} step={step} value={changes[key]}
                disabled={latest[key === 'stress' ? 'stressScore' : key] == null}
                onChange={event => setChanges(current => ({ ...current, [key]: Number(event.target.value) }))}
                className="w-full accent-indigo-500" />
            </label>
          ))}
          <button type="button" className="text-[11px] font-bold text-primary-light" onClick={() => setChanges({ steps: 0, stress: 0 })}>Reset adjustments</button>
        </div>
        <div className="bg-bg-subtle rounded-xl border border-border p-4 text-center">
          <h4 className="text-xs font-bold">Scenario index</h4>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{projected ?? '—'}<span className="text-xs text-text-muted"> / 100</span></p>
          {baseline != null && <p className="mt-1 text-[11px] text-text-secondary">Baseline {baseline} · {signed(projected - baseline)} points</p>}
        </div>
      </div>
      <p className="mt-3 text-[10px] text-text-muted">The demo index recalculates from the current sample and your adjustments.</p>
    </section>
  )
}
