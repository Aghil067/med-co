export const MINUTE_MS = 60_000

export const wearableDrills = [
  { label: 'Simulate fall', overrides: { fallDetected: 1 } },
  { label: 'Simulate low oxygen', overrides: { oxygenLevel: 88 } },
  { label: 'Simulate low pulse', overrides: { heartRate: 45 } },
  { label: 'Clear drill', overrides: null },
]

const HISTORY_MINUTES = 60
const TIME_ZONE = 'Asia/Kolkata'
const dayClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE, hourCycle: 'h23', hour: '2-digit', minute: '2-digit',
})
const displayClock = new Intl.DateTimeFormat('en-IN', {
  timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
})

const METRICS = [
  ['heartRate', 'heart_rate', 'bpm'],
  ['oxygenLevel', 'oxygen_saturation', '%'],
  ['stressScore', 'stress_level', 'points'],
  ['steps', 'steps', 'steps'],
  ['fallDetected', 'fall_detected', 'status'],
]

export function minuteBucket(now = Date.now()) {
  return Math.floor(now / MINUTE_MS) * MINUTE_MS
}

function random(seed, index) {
  let number = Math.imul((index ^ seed) >>> 0, 0x45d9f3b)
  number = Math.imul(number ^ (number >>> 16), 0x45d9f3b)
  return ((number ^ (number >>> 16)) >>> 0) / 2 ** 32
}

function activityAt(seed, minute) {
  const cycle = Math.floor(minute / 24)
  const offset = minute % 24
  const duration = 4 + Math.floor(random(seed, cycle) * 6)
  return Math.max(0, Math.min(offset - 8, 8 + duration - offset, 3)) / 3
}

function stepsThisMinute(seed, minute, minuteOfDay) {
  const hour = minuteOfDay / 60
  if (hour < 6 || hour >= 23) return 0
  const activity = activityAt(seed, minute)
  const movement = random(seed ^ 0x43b, minute)
  return activity > 0 ? Math.round(activity * (25 + movement * 50)) : Math.round(movement * 6)
}

function buildSample(seed, bucket) {
  const minute = bucket / MINUTE_MS
  const [hour, minutes] = dayClock.format(bucket).split(':').map(Number)
  const minuteOfDay = hour * 60 + minutes
  const activity = hour >= 6 && hour < 23 ? activityAt(seed, minute) : 0
  const restingRate = 66 + Math.round(random(seed, 11) * 10)
  const stressScore = Math.round(34 + 12 * Math.sin(minute / 11 + random(seed, 12) * Math.PI) + 12 * activity + random(seed ^ 0x26, minute) * 8)
  let steps = 0
  for (let index = 0; index <= minuteOfDay; index++) {
    steps += stepsThisMinute(seed, minute - minuteOfDay + index, index)
  }
  const recordedAt = new Date(bucket).toISOString()
  return {
    heartRate: Math.round(restingRate + activity * 22 + (stressScore - 35) / 5 + (random(seed ^ 0x79, minute) - 0.5) * 10),
    oxygenLevel: Math.round(98.3 + (random(seed ^ 0x31, minute) - 0.5) * 2.5 - activity * 0.6),
    stressScore,
    steps,
    fallDetected: 0,
    activity: hour < 6 || hour >= 23 ? 'Resting' : activity > 0 ? 'Moving' : 'Light activity',
    source: 'Demo wearable',
    simulated: true,
    recordedAt,
    lastSynced: displayClock.format(bucket),
  }
}

export function stressLabel(score) {
  return score == null ? 'Unavailable' : score >= 60 ? 'High' : score >= 40 ? 'Moderate' : 'Low'
}

export function buildSimulationFeed(seed, now, drillSamples = {}) {
  const bucket = minuteBucket(now)
  const samples = Array.from({ length: HISTORY_MINUTES }, (_, index) => {
    const time = bucket - index * MINUTE_MS
    const sample = { ...buildSample(seed, time), ...drillSamples[time] }
    return { ...sample, stressLevel: stressLabel(sample.stressScore) }
  })
  return {
    latest: samples[0],
    readings: samples.flatMap(sample => METRICS.map(([key, metricType, unit]) => ({
      metricType, value: sample[key], unit, recordedAt: sample.recordedAt, source: sample.source,
    }))),
  }
}
