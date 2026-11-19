import { Sparkles } from 'lucide-react'
import { getMetricTrend } from '../lib/healthSignals'
import { useWearableFeed } from '../lib/useWearableFeed'

export default function AIHealthInsights() {
  const { latest, readings, stepGoal } = useWearableFeed()
  const pulse = getMetricTrend(readings, 'heart_rate')
  const stress = getMetricTrend(readings, 'stress_level')
  const describe = (trend, unit) => {
    if (!trend || trend.count < 2) return 'Waiting for more readings'
    const change = trend.delta === 0 ? 'held steady' : `${trend.delta > 0 ? 'rose' : 'fell'} by ${Math.abs(trend.delta)} ${unit}`
    return `${change} over ${trend.minutes} min · ${trend.min}–${trend.max} ${unit}`
  }
  const activity = latest.steps == null ? 'Waiting for steps' : `${latest.steps.toLocaleString()} / ${stepGoal.toLocaleString()} steps`
  const insights = [
    ['Heart rate', describe(pulse, 'bpm')],
    ['Stress', describe(stress, 'points')],
    ['Daily activity', activity],
  ]

  return (
    <section className="bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)]">
      <div className="p-4 border-b border-border/60 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary-light" />
        <h3 className="text-[13px] font-bold">Wearable Insights</h3>
      </div>
      <dl className="p-4 grid gap-3 sm:grid-cols-3">
        {insights.map(([label, detail]) => (
          <div key={label} className="p-3 rounded-xl border border-border bg-bg-subtle">
            <dt className="text-[11px] font-bold">{label}</dt>
            <dd className="mt-1 text-[11px] text-text-secondary">{detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
