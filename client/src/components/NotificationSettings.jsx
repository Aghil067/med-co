import { useEffect, useState } from 'react'
import { Panel } from './WorkspaceUI'
import { notificationRequest, supportedNotifications, useNotifications } from '../lib/useNotifications'

const worker = '/med-co-notifications.js'
const makeChannel = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), value => value.toString(16).padStart(2, '0')).join('')
const hasToken = value => /^[a-f0-9]{48}$/.test(value ?? '')

function keyBytes(value) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)), char => char.charCodeAt(0))
}

export default function NotificationSettings() {
  const { channel, enabled, saveChannel, changeEnabled } = useNotifications()
  const [pairing, setPairing] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('pair'))
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const available = supportedNotifications()

  useEffect(() => {
    if (!available) return
    let active = true
    navigator.serviceWorker.getRegistration(worker)
      .then(registration => registration?.pushManager.getSubscription())
      .then(subscription => { if (active) setSubscribed(!!subscription) })
      .catch(() => {})
    return () => { active = false }
  }, [available])

  async function perform(action) {
    setBusy(true)
    setMessage('')
    try {
      await action()
    } catch (error) {
      setMessage(error.message || 'Notification setup failed.')
    } finally {
      setBusy(false)
    }
  }

  async function subscribe() {
    if (pairing && !hasToken(pairing)) throw new Error('The pairing link is invalid.')
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') throw new Error('Allow notifications in this browser to continue.')
    const target = pairing || channel || makeChannel()
    const { publicKey } = await notificationRequest('key')
    await navigator.serviceWorker.register(worker)
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
    await notificationRequest('subscribe', { channel: target, subscription: subscription.toJSON() })
    saveChannel(target)
    if (!pairing) changeEnabled(true)
    else if (channel !== target && enabled) changeEnabled(false)
    setSubscribed(true)
    if (pairing) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      setPairing(null)
    }
    setMessage('This device is subscribed.')
  }

  async function disconnect() {
    const registration = await navigator.serviceWorker.getRegistration(worker)
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription && channel) await notificationRequest('unsubscribe', { channel, endpoint: subscription.endpoint })
    if (subscription) await subscription.unsubscribe()
    setSubscribed(false)
    setMessage('Phone notifications are disabled on this device.')
  }

  function createPairingLink() {
    const target = channel || makeChannel()
    const url = new URL('/settings', window.location.origin)
    url.hash = `pair=${target}`
    saveChannel(target)
    changeEnabled(true)
    setLink(url.href)
    setMessage('Open this private link on the phone, then enable notifications.')
  }

  async function sendTest() {
    const result = await notificationRequest('send', { channel, kind: 'test', event: `test:${crypto.randomUUID()}` })
    setMessage(result.sent ? `Test accepted for ${result.sent} device(s). Check the phone notification tray.` : 'No device is subscribed to this alert channel yet.')
  }

  return (
    <Panel title="Phone notifications">
      <div id="notifications" className="space-y-3">
        <p className="text-sm text-text-secondary">Receive anomaly alerts and reminders 15 minutes after a dose is due if it is still unlogged. Push messages contain no readings or medication names.</p>
        {pairing && !subscribed && <p className="text-sm font-semibold">This link pairs your device with a Med-Co alert channel.</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="workspace-button workspace-primary" disabled={!available || busy}
            onClick={() => perform(subscribed && !pairing ? disconnect : subscribe)}>
            {subscribed && !pairing ? 'Disable on this device' : 'Enable on this device'}
          </button>
          {!pairing && <button type="button" className="workspace-button" disabled={busy} onClick={() => perform(createPairingLink)}>Create phone pairing link</button>}
          <button type="button" className="workspace-button" disabled={!channel || busy} onClick={() => perform(sendTest)}>Send test push</button>
        </div>
        {enabled && <button type="button" className="workspace-button" disabled={busy} onClick={() => perform(() => {
          changeEnabled(false)
          setMessage('Automatic alerts from this browser are paused.')
        })}>Pause alerts from this browser</button>}
        {!enabled && channel && !pairing && <button type="button" className="workspace-button" disabled={busy} onClick={() => perform(() => {
          changeEnabled(true)
          setMessage('Automatic alerts from this browser are active.')
        })}>Resume alerts from this browser</button>}
        {link && <div className="flex gap-2">
          <input aria-label="Private phone pairing link" className="min-w-0 flex-1 rounded bg-bg-subtle px-2 text-xs" readOnly value={link} />
          <button type="button" className="workspace-button" onClick={() => perform(async () => {
            await navigator.clipboard.writeText(link)
            setMessage('Private pairing link copied.')
          })}>Copy link</button>
        </div>}
        {!available && <p className="text-xs text-text-secondary">Phone push requires a supported browser over HTTPS. On iPhone, open Med-Co from its Home Screen app.</p>}
        <p className="text-xs text-text-secondary">Keep the source Med-Co tab running for automatic checks. Cross-device links require a deployed HTTPS URL that the phone can open.</p>
        {message && <p role="status" className="text-sm">{message}</p>}
      </div>
    </Panel>
  )
}
