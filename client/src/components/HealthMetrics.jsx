import { Heart, Wind, Activity, Calendar, Footprints, TrendingUp } from 'lucide-react'
import { useWearableFeed } from '../lib/useWearableFeed'

function MiniSparkline({ color, points = [] }) {
  const width = 80
  const height = 30

  if (points.length < 2) {
    return <div className="h-[30px] mt-1 text-[10px] text-text-muted font-medium">Waiting for readings</div>
  }

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1

  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width
      const y = height - ((p - min) / range) * height
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="mt-1.5">
      <defs>
        <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#sparkGrad-${color})`}
      />
      <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HealthMetrics() {
  const { latest, readings: history, isDemo, connection } = useWearableFeed()
  const metricsData = {
    ...latest,
    heartRate: latest.heartRate ?? 'NIL',
    oxygenLevel: latest.oxygenLevel ?? 'NIL',
    steps: latest.steps ?? 'NIL',
    stressLevel: latest.stressLevel ?? 'NIL',
    lastSynced: latest.recordedAt ? latest.lastSynced : 'NIL',
  }

  const metricPoints = (metricType) => history
    .filter((reading) => reading.metricType === metricType && typeof reading.value === 'number')
    .slice()
    .reverse()
    .map((reading) => reading.value)

  const heartRateValue = Number(metricsData.heartRate)
  const oxygenValue = Number(metricsData.oxygenLevel)

  const metrics = [
    {
      icon: Heart,
      iconBg: 'bg-[#00E676]/10',
      iconColor: 'text-[#00E676]',
      label: 'Heart Rate',
      value: metricsData.heartRate,
      suffix: metricsData.heartRate === 'NIL' ? '' : 'bpm',
      status: Number.isFinite(heartRateValue) ? (heartRateValue < 50 ? 'Low' : heartRateValue > 100 ? 'Elevated' : 'In range') : 'NIL',
      statusColor: Number.isFinite(heartRateValue) ? (heartRateValue < 50 || heartRateValue > 100 ? 'text-warning' : 'text-success') : 'text-text-muted',
      statusBg: Number.isFinite(heartRateValue) ? (heartRateValue < 50 || heartRateValue > 100 ? 'bg-amber-500/10' : 'bg-emerald-500/10') : 'bg-white/5',
      sparkline: metricsData.heartRate !== 'NIL',
      sparkColor: '#00E676',
      sparkPoints: metricPoints('heart_rate'),
      accentBorder: 'border-l-[#00E676]',
    },
    {
      icon: Wind,
      iconBg: 'bg-[#00D2FF]/10',
      iconColor: 'text-[#00D2FF]',
      label: 'Blood Oxygen',
      value: metricsData.oxygenLevel,
      suffix: metricsData.oxygenLevel === 'NIL' ? '' : '%',
      status: Number.isFinite(oxygenValue) ? (oxygenValue < 95 ? 'Low' : 'Optimal') : 'NIL',
      statusColor: Number.isFinite(oxygenValue) ? (oxygenValue < 95 ? 'text-warning' : 'text-success') : 'text-text-muted',
      statusBg: Number.isFinite(oxygenValue) ? (oxygenValue < 95 ? 'bg-amber-500/10' : 'bg-emerald-500/10') : 'bg-white/5',
      sparkline: metricsData.oxygenLevel !== 'NIL',
      sparkColor: '#00D2FF',
      sparkPoints: metricPoints('oxygen_saturation'),
      accentBorder: 'border-l-[#00D2FF]',
    },
    {
      icon: Activity,
      iconBg: 'bg-[#8B5CF6]/10',
      iconColor: 'text-[#8B5CF6]',
      label: 'Stress Level',
      value: metricsData.stressLevel,
      valueSize: 'text-[22px]',
      valueColor: metricsData.stressLevel === 'High' ? 'text-danger' : 'text-text-primary',
      subtitle: latest.stressScore == null ? '' : `${latest.stressScore}/100`,
      sparkline: latest.stressScore != null,
      sparkColor: '#8B5CF6',
      sparkPoints: metricPoints('stress_level'),
      subtitleColor: 'text-text-muted',
      accentBorder: 'border-l-[#8B5CF6]',
    },
    {
      icon: Footprints,
      iconBg: 'bg-[#00E676]/10',
      iconColor: 'text-[#00E676]',
      label: 'Daily Steps',
      value: metricsData.steps,
      suffix: '',
      status: latest.activity ?? '',
      statusColor: metricsData.steps !== 'NIL' ? 'text-success' : 'text-text-muted',
      statusBg: metricsData.steps !== 'NIL' ? 'bg-emerald-500/10' : 'bg-white/5',
      sparkline: metricsData.steps !== 'NIL',
      sparkColor: '#00E676',
      sparkPoints: metricPoints('steps'),
      accentBorder: 'border-l-[#00E676]',
    },
    {
      icon: Calendar,
      iconBg: 'bg-white/5',
      iconColor: 'text-text-secondary',
      label: 'Last Reading',
      value: metricsData.lastSynced,
      valueSize: 'text-base',
      subtitle: metricsData.lastSynced !== 'NIL' ? `Via ${metricsData.source || 'Health Connect'}` : 'NIL',
      subtitleColor: 'text-text-muted',
      accentBorder: 'border-l-border',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-bold text-text-primary">{isDemo ? 'Demo Vitals' : 'Wearable Vitals'}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-primary-light bg-primary-50 border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse-purple"></span>
          {isDemo ? 'Updates every minute' : connection}
        </span>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3.5">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className={`bg-bg-card rounded-2xl p-4 border border-border border-l-[3px] ${metric.accentBorder} shadow-[var(--shadow-card)] card-premium animate-fade-in animate-fade-in-delay-${index + 1}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${metric.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-[18px] h-[18px] ${metric.iconColor}`} />
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mb-1 font-semibold uppercase tracking-wide">{metric.label}</p>
              <div className="flex items-baseline gap-1">
                <span className={`${metric.valueSize || 'text-[22px]'} font-extrabold ${metric.valueColor || 'text-text-primary'} tracking-tight`}>
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </span>
                {metric.suffix && (
                  <span className="text-[12px] text-text-muted font-semibold">{metric.suffix}</span>
                )}
              </div>
              {metric.status && (
                <span className={`inline-block text-[10px] font-bold mt-1.5 px-2 py-0.5 rounded-full ${metric.statusColor} ${metric.statusBg}`}>{metric.status}</span>
              )}
              {metric.subtitle && (
                <p className={`text-[10px] mt-1.5 font-medium ${metric.subtitleColor}`}>{metric.subtitle}</p>
              )}
              {metric.sparkline && <MiniSparkline color={metric.sparkColor} points={metric.sparkPoints} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
