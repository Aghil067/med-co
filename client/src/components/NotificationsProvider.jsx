import { useEffect, useMemo, useRef, useState } from 'react'
import { getAlerts } from '../lib/healthSignals'
import { pendingDoseReminders } from '../lib/reminders'
import { NotificationsContext, notificationRequest } from '../lib/useNotifications'
import { useWearableFeed } from '../lib/useWearableFeed'
import { useWorkspaceData } from '../lib/useWorkspaceData'

const channelKey = 'med-co.notifications.channel'
const enabledKey = 'med-co.notifications.enabled'
const validChannel = value => /^[a-f0-9]{48}$/.test(value ?? '')

function readKey(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export default function NotificationsProvider({ children }) {
  const { latest, isDemo } = useWearableFeed()
  const { data: { medications } } = useWorkspaceData()
  const [channel, setChannel] = useState(() => readKey(channelKey))
  const [enabled, setEnabled] = useState(() => readKey(enabledKey) === 'true')
  const [clock, setClock] = useState(Date.now)
  const previousTypes = useRef(new Map())
  const delivered = useRef(new Set())
  const inFlight = useRef(new Set())
  const reminders = useMemo(() => pendingDoseReminders(medications, clock), [medications, clock])

  useEffect(() => {
    const refresh = () => setClock(Date.now())
    const timer = window.setInterval(refresh, 15_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  useEffect(() => {
    if (!enabled || !channel) return
    const current = new Map()
    const alerts = getAlerts(latest)
    for (const alert of alerts) {
      if (!latest.recordedAt) continue
      const id = previousTypes.current.get(alert.type) || `${Date.parse(latest.recordedAt)}:${alert.type}`
      current.set(alert.type, id)
    }
    previousTypes.current = current
    const overdue = reminders.map(item => ['medication', item.id])
    const anomalies = [...current.values()].map(id => [isDemo || latest.simulated ? 'simulation' : 'anomaly', id])
    const events = [...anomalies, ...overdue]
    const liveKeys = new Set(events.map(([kind, id]) => `${channel}:${kind}:${id}`))
    for (const key of delivered.current) {
      if (!liveKeys.has(key)) delivered.current.delete(key)
    }
    for (const [kind, event] of events) {
      const key = `${channel}:${kind}:${event}`
      if (delivered.current.has(key) || inFlight.current.has(key)) continue
      inFlight.current.add(key)
      notificationRequest('send', { channel, kind, event })
        .then(result => {
          if (result.sent || result.duplicate) delivered.current.add(key)
        })
        .catch(() => {})
        .finally(() => inFlight.current.delete(key))
    }
  }, [clock, reminders, latest, isDemo, channel, enabled])

  function saveChannel(value) {
    if (!validChannel(value)) throw new Error('Invalid pairing link.')
    localStorage.setItem(channelKey, value)
    setChannel(value)
  }

  function changeEnabled(value) {
    localStorage.setItem(enabledKey, String(value))
    setEnabled(value)
  }

  return <NotificationsContext.Provider value={{ reminders, channel, enabled, saveChannel, changeEnabled }}>{children}</NotificationsContext.Provider>
}
