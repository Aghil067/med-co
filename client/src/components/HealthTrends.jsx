import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Activity } from 'lucide-react'
import { useWearableFeed } from '../lib/useWearableFeed'

const metricConfig = [
  { name: 'Heart Rate', suffix: ' bpm', color: '#8B5CF6', metricType: 'heart_rate', yDomain: [50, 120] },
  { name: 'Blood Oxygen', suffix: '%', color: '#00D2FF', metricType: 'oxygen_saturation', yDomain: [85, 100] },
  { name: 'Daily Steps', suffix: ' steps', color: '#34D399', metricType: 'steps', yDomain: ['auto', 'auto'] },
  { name: 'Stress Level', suffix: '', color: '#F59E0B', metricType: 'stress_level', yDomain: [0, 100] },
]

function formatTime(value, isDemo) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: isDemo ? 'Asia/Kolkata' : undefined })
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value" style={{ color: payload[0].color }}>{payload[0].value}</p>
      </div>
    )
  }
  return null
}

function MiniChart({ data, color, yDomain }) {
  if (data.length < 2) {
    return <div className="h-[50px] text-[10px] text-text-muted flex items-center font-medium">Waiting for readings</div>
  }

  return (
    <div className="h-[50px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
          <YAxis domain={yDomain} hide />
          <XAxis dataKey="time" hide />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '3 3' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function buildSeries(readings, metricType, isDemo) {
  return readings
    .filter((reading) => reading.metricType === metricType && typeof reading.value === 'number')
    .slice()
    .reverse()
    .map((reading) => ({
      time: formatTime(reading.recordedAt, isDemo),
      value: reading.value,
    }))
}

function getLatestValue(series, suffix) {
  if (!series.length) return 'NIL'
  return `${series[series.length - 1].value}${suffix}`
}

export default function HealthTrends() {
  const { readings, isDemo } = useWearableFeed()
  const [windowSize, setWindowSize] = useState(60)

  const metrics = metricConfig.map((metric) => {
    const series = buildSeries(readings, metric.metricType, isDemo).slice(-windowSize)
    return {
      ...metric,
      series,
      value: getLatestValue(series, metric.suffix),
    }
  })

  return (
    <div className="bg-bg-card rounded-2xl border border-border shadow-[var(--shadow-card)] h-full flex flex-col">
      <div className="p-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-light" />
          <h3 className="text-[13px] font-bold text-text-primary tracking-tight">Wearable Trends</h3>
        </div>
        <select aria-label="Trend sample count" value={windowSize} onChange={event => setWindowSize(Number(event.target.value))} className="text-[11px] text-text-secondary bg-bg-subtle border border-border rounded-lg px-3 py-1.5">
          <option value={15}>{isDemo ? 'Last 15 minutes' : 'Last 15 samples'}</option>
          <option value={30}>{isDemo ? 'Last 30 minutes' : 'Last 30 samples'}</option>
          <option value={60}>{isDemo ? 'Last 60 minutes' : 'Last 60 samples'}</option>
        </select>
      </div>

      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        {metrics.map((metric) => (
          <div key={metric.name} className="py-2.5 border-b border-border/40 last:border-0 group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.color }}></span>
                <span className="text-[11px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{metric.name}</span>
              </div>
              <span className="text-[12px] font-extrabold text-text-primary">{metric.value}</span>
            </div>
            <MiniChart data={metric.series} color={metric.color} yDomain={metric.yDomain} />
          </div>
        ))}
      </div>


    </div>
  )
}
