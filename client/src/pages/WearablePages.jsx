import { useState } from 'react'
import { Link } from 'react-router-dom'
import AIHealthInsights from '../components/AIHealthInsights'
import CaretakerAlertPanel from '../components/CaretakerAlertPanel'
import DiseaseRiskSummary from '../components/DiseaseRiskSummary'
import HealthTrends from '../components/HealthTrends'
import WhatIfSimulator from '../components/WhatIfSimulator'
import { Empty, Field, Page, Panel } from '../components/WorkspaceUI'
import { getMetricTrend, getScenarioScore } from '../lib/healthSignals'
import { downloadCsv, readingCsv, readingNames } from '../lib/reportCsv'
import { indiaDate } from '../lib/useWorkspaceData'
import { useWearableFeed } from '../lib/useWearableFeed'

const localTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
})

function timeLabel(value) {
  return Number.isFinite(Date.parse(value)) ? localTime.format(new Date(value)) + ' IST' : 'Waiting for a reading'
}

export function RiskAnalysis() {
  const { latest, readings, isDemo, stepGoal } = useWearableFeed()
  const score = getScenarioScore(latest, { stepGoal })
  return (
    <Page title="Risk Analysis" description="Explore changes in your wearable signals and review the alerts they triggered."
      action={<Link className="workspace-button" to="/simulator">Open What-If Simulator</Link>}>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-5">
          <Panel title="Wearable scenario index">
            <p className="text-3xl font-extrabold tabular-nums">{score ?? '—'}<span className="text-sm text-text-secondary"> / 100</span></p>
            <p className="mt-2 text-xs text-text-secondary">{isDemo ? 'Demo inputs' : 'Wearable inputs'} · {timeLabel(latest.recordedAt)}</p>
            <p className="mt-2 text-xs text-text-secondary">Illustrative index based on available pulse, oxygen, stress, and activity signals.</p>
          </Panel>
          <DiseaseRiskSummary />
          <CaretakerAlertPanel />
        </div>
        <div className="space-y-5">
          <HealthTrends />
          <Panel title="Recent signal ranges">
            <dl className="grid gap-3 sm:grid-cols-3">
              {['heart_rate', 'oxygen_saturation', 'stress_level'].map(type => {
                const trend = getMetricTrend(readings, type)
                return <div key={type} className="rounded-xl border border-border bg-bg-subtle p-3"><dt className="text-xs text-text-secondary">{readingNames[type]}</dt><dd className="mt-1 font-bold">{trend ? `${trend.min}–${trend.max}` : '—'}</dd><dd className="mt-1 text-xs text-text-secondary">{trend ? `${trend.count} samples` : 'Waiting for data'}</dd></div>
              })}
            </dl>
          </Panel>
        </div>
      </div>
    </Page>
  )
}

export function SimulatorPage() {
  return (
    <Page title="What-If Simulator" description="Compare a hypothetical activity and stress scenario with your current wearable baseline.">
      <WhatIfSimulator />
      <AIHealthInsights />
    </Page>
  )
}

export function Recommendations() {
  const { latest, readings, stepGoal } = useWearableFeed()
  const remaining = latest.steps == null ? null : Math.max(0, stepGoal - latest.steps)
  const pulse = getMetricTrend(readings, 'heart_rate')
  const suggestions = [
    ['Daily activity goal', remaining === null ? 'Step progress appears when the feed supplies a count.' : remaining === 0 ? 'You reached the step goal set in this workspace.' : `${remaining.toLocaleString()} steps remain toward your workspace goal of ${stepGoal.toLocaleString()}.`, '/settings', 'Edit step goal'],
    ['Review recent changes', pulse && pulse.count > 1 ? `The last ${pulse.minutes} minutes of pulse samples ranged from ${pulse.min} to ${pulse.max} bpm.` : 'A pulse comparison will be available after the feed receives more readings.', '/risk', 'View trends'],
    ['Add context to your readings', 'Record what you were doing or how you felt so you can compare your notes with wearable trends.', '/records?new=1', 'Add an observation'],
  ]
  return (
    <Page title="Recommendations" description="See next steps based on your latest readings and the goals you set.">
      <AIHealthInsights />
      <div className="grid gap-4 lg:grid-cols-3">{suggestions.map(([title, detail, path, label]) => (
        <Panel key={title} title={title}><p className="mb-4 text-sm text-text-secondary">{detail}</p><Link to={path} className="workspace-button">{label}</Link></Panel>
      ))}</div>
    </Page>
  )
}

export function Reports() {
  const { readings, isDemo } = useWearableFeed()
  const [type, setType] = useState('all')
  const [page, setPage] = useState(0)
  const rows = readings.filter(row => type === 'all' || row.metricType === type)
  const lastPage = Math.max(0, Math.ceil(rows.length / 15) - 1)
  const current = Math.min(page, lastPage)
  return (
    <Page title="Reports" description="Review recent wearable samples and export the selected readings."
      action={<button className="workspace-button workspace-primary" type="button" disabled={!rows.length}
        onClick={() => downloadCsv(`med-co-readings-${indiaDate()}.csv`, readingCsv(rows))}>Download CSV</button>}>
      <Panel title={isDemo ? 'Demo wearable history' : 'Wearable history'}>
        <div className="workspace-form mb-4 flex flex-wrap items-end justify-between gap-3">
          <Field label="Metric"><select value={type} onChange={event => { setType(event.target.value); setPage(0) }}>
            <option value="all">All metrics</option>{Object.entries(readingNames).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select></Field>
          <span className="text-xs text-text-secondary">{rows.length} samples in export</span>
        </div>
        {rows.length ? <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-bg-subtle text-xs text-text-secondary"><tr>{['Time', 'Metric', 'Value', 'Source'].map(column => <th key={column} scope="col" className="p-3 font-semibold">{column}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">{rows.slice(current * 15, current * 15 + 15).map((row, index) => <tr key={`${row.recordedAt}-${row.metricType}-${index}`}>
                <td className="p-3 whitespace-nowrap"><time dateTime={row.recordedAt}>{timeLabel(row.recordedAt)}</time></td><td className="p-3">{readingNames[row.metricType] || row.metricType}</td>
                <td className="p-3 tabular-nums">{row.metricType === 'fall_detected' ? Number(row.value) > 0 ? 'Detected' : 'Clear' : `${row.value ?? '—'} ${row.unit || ''}`}</td><td className="p-3 text-text-secondary">{row.source || 'Wearable'}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button className="workspace-button" type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</button>
            <span className="px-1 text-xs text-text-secondary">Page {current + 1} of {lastPage + 1}</span>
            <button className="workspace-button" type="button" disabled={current >= lastPage} onClick={() => setPage(current + 1)}>Next</button>
          </div>
        </> : <Empty>No samples available for this metric.</Empty>}
      </Panel>
    </Page>
  )
}

export function Devices() {
  const { latest, readings, isDemo, connection, syncNow } = useWearableFeed()
  const [message, setMessage] = useState('')
  return (
    <Page title="Devices & Sync" description="Check what is feeding your digital twin and when it last updated.">
      <Panel title="Wearable data source">
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ['Source', isDemo ? 'Demo wearable' : latest.source || 'Watch backend'],
            ['Status', isDemo ? 'Running · one sample per minute' : connection],
            ['Latest reading', timeLabel(latest.recordedAt)],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-bg-subtle p-4"><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 text-sm font-bold">{value}</dd></div>)}
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="workspace-button workspace-primary" onClick={() => { syncNow(); setMessage(isDemo ? 'Checked the current simulation minute.' : 'Wearable refresh requested. Watch status updates here.') }}>Refresh feed</button>
          <Link to="/reports" className="workspace-button">View {readings.length} samples</Link>
          <span role="status" className="text-xs text-text-secondary">{message}</span>
        </div>
        {isDemo && <p className="mt-4 text-sm text-text-secondary">Synthetic readings power the demo. A configured watch backend is required for physical device data.</p>}
      </Panel>
    </Page>
  )
}
