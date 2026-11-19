import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import TwinAnatomy from './TwinAnatomy'
import { getTwinState } from '../lib/twinTelemetry'
import { useWearableFeed } from '../lib/useWearableFeed'

export default function DigitalTwin() {
  const { latest, isDemo } = useWearableFeed()
  const signal = getTwinState(latest)
  const values = [
    ['Heart rate', signal.pulse == null ? '—' : `${signal.pulse} bpm`],
    ['Blood oxygen', signal.oxygen == null ? '—' : `${signal.oxygen}%`],
    ['Movement', signal.fall ? 'Fall pose' : signal.activity ?? 'Unavailable'],
  ]

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-bg-card">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <h3 className="text-sm font-bold">Your Digital Twin</h3>
        <span className="text-[10px] text-text-secondary">{isDemo ? 'Simulation' : 'Wearable'}</span>
      </div>
      <div className="twin-stage min-h-40"><TwinAnatomy signal={signal} compact /></div>
      <dl className="grid gap-2 px-4 py-3 text-xs">
        {values.map(([label, value]) => <div key={label} className="flex justify-between gap-2">
          <dt className="text-text-secondary">{label}</dt><dd className="font-bold">{value}</dd>
        </div>)}
      </dl>
      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        <span className="text-[10px] text-text-secondary">{latest.recordedAt ? latest.lastSynced : 'Waiting for readings'}</span>
        <Link to="/digital-twin" className="workspace-button">Open twin <ArrowUpRight className="size-3.5" /></Link>
      </div>
    </section>
  )
}
