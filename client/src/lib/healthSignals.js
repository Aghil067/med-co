export function metricNumber(value) {
  return (typeof value === 'number' || (typeof value === 'string' && value.trim())) && Number.isFinite(Number(value))
    ? Number(value)
    : null
}

export function getAlerts(latest = {}) {
  const heartRate = metricNumber(latest.heartRate)
  const oxygen = metricNumber(latest.oxygenLevel)
  const alerts = []
  if (heartRate !== null && heartRate < 50) alerts.push({ type: 'heart', message: `Low pulse alert · ${heartRate} bpm` })
  if (oxygen !== null && oxygen < 90) alerts.push({ type: 'oxygen', message: `Low oxygen alert · ${oxygen}% SpO₂` })
  if (Number(latest.fallDetected) > 0) alerts.push({ type: 'fall', message: 'Fall detected' })
  return alerts
}

export function getMetricTrend(readings, metricType, limit = 15) {
  const samples = readings
    .filter(reading => reading.metricType === metricType && typeof reading.value === 'number')
    .slice(0, limit)
  if (!samples.length) return null
  const values = samples.map(sample => sample.value)
  const first = samples.at(-1)
  const last = samples[0]
  return {
    count: samples.length,
    minutes: Math.round((Date.parse(last.recordedAt) - Date.parse(first.recordedAt)) / 60_000),
    first: first.value,
    last: last.value,
    delta: last.value - first.value,
    min: Math.min(...values),
    max: Math.max(...values),
    average: Math.round(values.reduce((total, value) => total + value, 0) / values.length),
  }
}

export const DEMO_STEP_GOAL = 8_000

const index = value => Math.min(100, Math.max(0, Math.round(value)))

export function getSignalScores(latest, stepGoal = DEMO_STEP_GOAL) {
  const { heartRate, oxygenLevel, stressScore, steps } = latest
  return {
    pulse: heartRate == null ? null : index(Math.abs(heartRate - 75) * 2),
    oxygen: oxygenLevel == null ? null : index((99 - oxygenLevel) * 10),
    stress: stressScore == null ? null : index(stressScore),
    activity: steps == null ? null : index(steps / stepGoal * 100),
  }
}

export function getScenarioScore(latest, { steps = 0, stress = 0, stepGoal = DEMO_STEP_GOAL } = {}) {
  const signals = getSignalScores({
    ...latest,
    steps: latest.steps == null ? null : Math.max(0, latest.steps + steps),
    stressScore: latest.stressScore == null ? null : index(latest.stressScore + stress),
  }, stepGoal)
  const scores = [signals.pulse == null ? null : 100 - signals.pulse, signals.oxygen == null ? null : 100 - signals.oxygen,
    signals.stress == null ? null : 100 - signals.stress, signals.activity].filter(score => score != null)
  return scores.length ? index(scores.reduce((total, score) => total + score, 0) / scores.length) : null
}
