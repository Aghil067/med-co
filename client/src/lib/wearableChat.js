import { DEMO_STEP_GOAL, getAlerts, getMetricTrend, getScenarioScore } from './healthSignals.js'

const metrics = [
  { key: 'heartRate', type: 'heart_rate', label: 'Heart rate', unit: 'bpm' },
  { key: 'oxygenLevel', type: 'oxygen_saturation', label: 'SpO₂', unit: '%' },
  { key: 'stressScore', type: 'stress_level', label: 'Stress score', unit: 'points' },
  { key: 'steps', type: 'steps', label: 'Daily steps', unit: 'steps' },
]

export function makeWearableContext({ latest, readings }, profileName, isDemo, stepGoal = DEMO_STEP_GOAL) {
  const simulated = isDemo || latest.simulated === true
  return {
    profileName,
    stepGoal,
    source: simulated ? 'Demo wearable' : 'Wearable feed',
    simulated,
    recordedAt: latest.recordedAt ?? null,
    displayTime: latest.recordedAt ? latest.lastSynced : null,
    activity: latest.activity ?? null,
    stressLevel: latest.stressLevel ?? null,
    metrics: metrics.map(({ key, type, label, unit }) => ({
      label, unit, latest: latest[key] ?? null,
      trends: Object.fromEntries([15, 30, 60].map(size => [size, getMetricTrend(readings, type, size)])),
      samples: readings.filter(reading => reading.metricType === type && typeof reading.value === 'number')
        .slice(0, 60).reverse().map(({ recordedAt, value, source }) => ({ recordedAt, value, source })),
    })),
    fallDetected: latest.fallDetected == null ? null : Number(latest.fallDetected) > 0,
    recentFalls: readings.filter(reading => reading.metricType === 'fall_detected' && Number(reading.value) > 0)
      .slice(0, 60).map(({ recordedAt, source }) => ({ recordedAt, source })),
    alerts: getAlerts(latest).map(alert => alert.message),
    ...(simulated ? { demoScenarioIndex: getScenarioScore(latest, { stepGoal }) } : {}),
  }
}

export function wearableAnswer(question, context, { quick = false } = {}) {
  const query = question.toLowerCase().trim()
  const overview = /^(?:summarize |show (?:me )?)?(?:my )?(?:latest |current )?vitals\??$/.test(query)
  const pulseTrend = quick && query === 'how has my heart rate changed?'
  const activeAlerts = /^(?:are there any )?(?:active )?alerts\??$/.test(query)
  const stepProgress = /^(?:how many steps (?:have i taken|did i take) today|(?:my )?(?:daily )?steps(?: today)?)\??$/.test(query)
  const pulse = /^(?:(?:what(?:'s| is) )?(?:my )?(?:current |latest )?(?:heart rate|pulse)(?: now)?|heart rate now)\??$/.test(query)
  const oxygen = /^(?:what(?:'s| is) )?(?:my )?(?:current |latest )?(?:spo[₂2]|blood oxygen|oxygen level)\??$/.test(query)
  const stress = /^(?:what(?:'s| is) )?(?:my )?(?:current |latest )?stress(?: score| level)?\??$/.test(query)
  if (![overview, pulseTrend, activeAlerts, stepProgress, pulse, oxygen, stress].some(Boolean)) return null

  const { profileName, recordedAt, displayTime, simulated, alerts } = context
  const source = simulated ? 'Demo' : 'Wearable'
  if (!recordedAt) return `${profileName}, your ${source.toLowerCase()} feed has no readings yet.`
  const header = `${profileName} · ${source} reading · ${displayTime || recordedAt}`
  const [heartRate, bloodOxygen, stressScore, steps] = context.metrics
  const print = metric => `${metric.label} · ${metric.latest == null ? 'Unavailable' : `${metric.latest.toLocaleString()} ${metric.unit}`}`
  if (overview) return [header, ...context.metrics.map(print)].join('\n')
  if (activeAlerts) return [header, ...(alerts.length ? alerts : ['No active alerts in this sample.'])].join('\n')
  if (stepProgress) {
    const goal = steps.latest != null ? `\nDaily goal · ${Math.round(steps.latest / context.stepGoal * 100)}% of ${context.stepGoal.toLocaleString()} steps` : ''
    return `${header}\n${print(steps)}${goal}`
  }
  if (pulseTrend) {
    const trend = heartRate.trends[15]
    if (!trend || trend.count < 2) return `${header}\nAt least two pulse readings are needed for a trend.`
    return `${header}\nOver ${trend.minutes} minutes, pulse went from ${trend.first} to ${trend.last} bpm. Average ${trend.average} bpm, range ${trend.min}–${trend.max} bpm.`
  }
  return `${header}\n${print(pulse ? heartRate : oxygen ? bloodOxygen : stressScore)}`
}
