import { getAlerts, metricNumber } from './healthSignals.js'

const fields = {
  heart_rate: 'heartRate',
  oxygen_saturation: 'oxygenLevel',
  stress_level: 'stressScore',
  steps: 'steps',
  fall_detected: 'fallDetected',
}

export const twinTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
})

export function buildTwinTimeline(readings, latest) {
  const groups = new Map()
  for (const row of readings) {
    const time = Date.parse(row.recordedAt)
    const key = fields[row.metricType]
    if (!key || !Number.isFinite(time)) continue
    const existing = groups.get(time) ?? { recordedAt: new Date(time).toISOString(), source: row.source }
    const simulated = /simulat|^demo wearable$/i.test(row.source ?? '')
    if (existing[key] == null && (simulated === existing.simulated || existing.simulated == null)) {
      existing[key] = metricNumber(row.value)
      existing.simulated = simulated
      groups.set(time, existing)
    }
  }
  const latestTime = Date.parse(latest.recordedAt)
  if (latest.simulated && Number.isFinite(latestTime)) groups.set(latestTime, { ...latest, recordedAt: new Date(latestTime).toISOString() })
  return [...groups.entries()].sort(([a], [b]) => a - b).slice(-60).map(([, sample]) => sample)
}

const localDay = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short' })
const clamp = (value, min, max) => Math.max(min, Math.min(value, max))

export function getTwinState(sample = {}, previous) {
  const pulse = metricNumber(sample.heartRate)
  const oxygen = metricNumber(sample.oxygenLevel)
  const stress = metricNumber(sample.stressScore)
  const steps = metricNumber(sample.steps)
  const lastSteps = metricNumber(previous?.steps)
  const elapsed = (Date.parse(sample.recordedAt) - Date.parse(previous?.recordedAt)) / 60_000
  const compatibleSource = !!previous && !!sample.simulated === !!previous.simulated
  const stepDelta = sample.simulated && compatibleSource && steps != null && lastSteps != null && steps >= lastSteps
    && elapsed === 1 && localDay.format(new Date(sample.recordedAt)) === localDay.format(new Date(previous.recordedAt))
    ? steps - lastSteps : null
  const activity = sample.activity ?? (stepDelta == null ? null : stepDelta === 0 ? 'Still' : stepDelta >= 15 ? 'Moving' : 'Light activity')
  const alerts = getAlerts(sample)
  const has = type => alerts.some(alert => alert.type === type)
  return {
    pulse, oxygen, stress, steps, stepDelta, activity, alerts,
    pulseSeconds: pulse != null && pulse > 0 ? 60 / clamp(pulse, 15, 240) : null,
    oxygenStrength: oxygen == null ? 0 : clamp((oxygen - 80) / 20, 0, 1),
    stressStrength: stress == null ? 0 : clamp(stress / 100, 0, 1),
    motionStrength: activity === 'Moving' ? clamp((stepDelta ?? 22) / 50, .25, 1) : activity === 'Light activity' ? .12 : 0,
    lowPulse: has('heart'), lowOxygen: has('oxygen'), fall: has('fall'),
  }
}
