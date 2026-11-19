import { Activity, Heart, ShieldAlert, Wind } from 'lucide-react'
import { getSignalScores } from '../lib/healthSignals'
import { useWearableFeed } from '../lib/useWearableFeed'

export default function DiseaseRiskSummary() {
  const { latest } = useWearableFeed()
  const scores = getSignalScores(latest)
  const signals = [
    { label: 'Pulse variation from demo reference', score: scores.pulse, color: '#A78BFA', Icon: Heart },
    { label: 'Oxygen shift from demo reference', score: scores.oxygen, color: '#22D3EE', Icon: Wind },
    { label: 'Stress score', score: scores.stress, color: '#FBBF24', Icon: Activity },
  ]

  return (
    <section className="bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)]">
      <div className="p-4 flex items-center gap-2 border-b border-border/60">
        <ShieldAlert className="w-4 h-4 text-primary-light" />
        <h3 className="text-[13px] font-bold">Wearable Signals</h3>
      </div>
      <div className="p-4 space-y-4">
        {signals.map(({ label, score, color, Icon }) => (
          <div key={label} className="flex items-center gap-3">
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <div className="flex-1">
              <div className="flex justify-between gap-2 text-[11px] mb-1.5">
                <span>{label}</span>
                <span className="font-bold whitespace-nowrap">{score == null ? '—' : `${score}/100`}</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${score ?? 0}%`, backgroundColor: color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="px-4 pb-4 text-[10px] text-text-muted">Illustrative scores for the digital twin demo.</p>
    </section>
  )
}
