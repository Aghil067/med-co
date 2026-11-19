import { useEffect, useMemo, useState } from 'react'
import { fetchLatestWearableMetrics, fetchWearableHistory } from '../lib/wearableApi'
import { metricNumber } from '../lib/healthSignals'
import { WearableFeedContext } from '../lib/useWearableFeed'
import { useWorkspaceData } from '../lib/useWorkspaceData'
import { buildSimulationFeed, MINUTE_MS, minuteBucket, stressLabel } from '../lib/wearableSimulation'

const useWatch = import.meta.env.VITE_WEARABLE_MODE === 'watch'
const emptyFeed = { latest: {}, readings: [] }
const seedKey = 'med-co.wearable-profile-seed'

function profileSeed() {
  try {
    const saved = localStorage.getItem(seedKey)
    if (saved !== null && /^\d+$/.test(saved)) return Number(saved)
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]
    localStorage.setItem(seedKey, String(seed))
    return seed
  } catch {
    return crypto.getRandomValues(new Uint32Array(1))[0]
  }
}

function demoSource(source) {
  return source?.replace(/\bsimulated\b/gi, 'Demo')
}

function normalizeWatch(latest, readings) {
  const stressScore = metricNumber(latest.stressLevel)
  return {
    latest: {
      ...latest,
      source: demoSource(latest.source),
      simulated: latest.source === 'simulator',
      heartRate: metricNumber(latest.heartRate),
      oxygenLevel: metricNumber(latest.oxygenLevel),
      steps: metricNumber(latest.steps),
      stressScore,
      stressLevel: stressScore === null ? latest.stressLevel : stressLabel(stressScore),
    },
    readings: readings.map(reading => ({ ...reading, source: demoSource(reading.source) })),
  }
}

export default function WearableFeedProvider({ children }) {
  const { data: { profile } } = useWorkspaceData()
  const [seed] = useState(profileSeed)
  const [bucket, setBucket] = useState(() => minuteBucket())
  const [drills, setDrills] = useState({})
  const [watch, setWatch] = useState(emptyFeed)
  const [connection, setConnection] = useState('Connecting')

  useEffect(() => {
    let active = true
    let inFlight = false
    let timer
    async function refreshWatch() {
      if (inFlight) return
      inFlight = true
      try {
        const [latest, history] = await Promise.all([
          fetchLatestWearableMetrics(), fetchWearableHistory(300),
        ])
        if (!active) return
        setWatch(normalizeWatch(latest, history.readings || []))
        setConnection(latest.recordedAt ? 'Watch feed' : 'Waiting for watch data')
      } catch {
        if (active) setConnection('Watch feed unavailable')
      } finally {
        inFlight = false
      }
    }

    function update() {
      clearTimeout(timer)
      const current = minuteBucket()
      setBucket(current)
      if (useWatch) void refreshWatch()
      timer = setTimeout(update, Math.max(0, current + MINUTE_MS - Date.now()))
    }

    update()
    window.addEventListener('focus', update)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('med-co:refresh-wearables', update)
    return () => {
      active = false
      clearTimeout(timer)
      window.removeEventListener('focus', update)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('med-co:refresh-wearables', update)
    }
  }, [])

  const feed = useMemo(() => useWatch ? watch : buildSimulationFeed(seed, bucket, drills), [bucket, drills, seed, watch])

  function setDrill(overrides) {
    if (useWatch) return
    const current = minuteBucket()
    setBucket(current)
    setDrills(previous => {
      const recent = Object.fromEntries(Object.entries(previous).filter(([time]) => Number(time) > current - 60 * MINUTE_MS))
      if (overrides) recent[current] = overrides
      else delete recent[current]
      return recent
    })
  }

  function getCurrentFeed() {
    const current = minuteBucket()
    if (useWatch || current === bucket) return feed
    setBucket(current)
    return buildSimulationFeed(seed, current, drills)
  }

  function syncNow() {
    window.dispatchEvent(new Event('med-co:refresh-wearables'))
  }

  return (
    <WearableFeedContext.Provider value={{
      ...feed, profileName: profile.name, stepGoal: profile.stepGoal, isDemo: !useWatch, connection, setDrill, getCurrentFeed, syncNow,
    }}>
      {children}
    </WearableFeedContext.Provider>
  )
}
