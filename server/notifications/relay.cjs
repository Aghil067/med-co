const { createServer } = require('node:http')
const { join } = require('node:path')
const openStore = require('./store.cjs')
const webPush = require('web-push')
const serveFrontend = require('./frontend.cjs')

const hostFrontend = process.env.MED_CO_HOST_FRONTEND === '1' || process.env.RENDER === 'true'
const frontend = hostFrontend ? serveFrontend(join(__dirname, '..', '..', 'client', 'dist')) : null

const stateDir = process.env.MED_CO_PUSH_STATE || join(__dirname, '..', 'instance', 'notifications')
const kinds = new Set(['anomaly', 'simulation', 'medication', 'test'])
const contact = process.env.MED_CO_PUSH_CONTACT || 'mailto:med-co-demo@example.com'

function validSubscription(subscription) {
  try {
    const url = new URL(subscription.endpoint)
    const allowed = url.hostname === 'fcm.googleapis.com' || url.hostname === 'updates.push.services.mozilla.com'
      || url.hostname.endsWith('.push.apple.com') || url.hostname.endsWith('.notify.windows.com')
    return allowed && url.protocol === 'https:' && !url.port && !url.username && !url.password
      && /^[\w-]{87}$/.test(subscription.keys?.p256dh ?? '') && /^[\w-]{22}$/.test(subscription.keys?.auth ?? '')
  } catch {
    return false
  }
}

async function bodyOf(request) {
  const chunks = []
  let length = 0
  for await (const chunk of request) {
    length += chunk.length
    if (length > 8192) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks))
}

async function handle(request, response, { query, get, keys }) {
  const reply = (status, data) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
    response.end(JSON.stringify(data))
  }
  const path = new URL(request.url, 'http://localhost').pathname
  if (request.method === 'GET' && path === '/healthz') {
    await query('SELECT 1')
    return reply(200, { status: 'ok' })
  }
  if (request.method === 'GET' && path === '/api/notifications/key') return reply(200, { publicKey: keys.publicKey })
  if (frontend && await frontend(request, response, path)) return
  if (request.method !== 'POST' || request.headers['sec-fetch-site'] === 'cross-site') return reply(404, {})
  let data
  try {
    data = await bodyOf(request)
  } catch {
    return reply(400, { error: 'Invalid request.' })
  }
  if (!data || typeof data.channel !== 'string' || !/^[a-f0-9]{48}$/.test(data.channel)) {
    return reply(400, { error: 'Invalid notification channel.' })
  }
  const { channel, subscription } = data
  if (path === '/api/notifications/subscribe') {
    if (!validSubscription(subscription)) return reply(400, { error: 'Unsupported browser push subscription.' })
    const existing = await get('SELECT channel FROM devices WHERE endpoint = ?', subscription.endpoint)
    const count = (await get('SELECT COUNT(*) AS count FROM devices WHERE channel = ?', channel)).count
    if (existing?.channel === channel) return reply(200, { subscribed: true })
    if (count >= 5) return reply(409, { error: 'This alert channel already has five devices.' })
    await query('INSERT INTO devices VALUES (?, ?, ?) ON CONFLICT (endpoint) DO UPDATE SET channel = excluded.channel, subscription = excluded.subscription', subscription.endpoint, channel, JSON.stringify(subscription))
    return reply(200, { subscribed: true })
  }
  if (path === '/api/notifications/unsubscribe') {
    if (typeof data.endpoint !== 'string') return reply(400, { error: 'Missing device endpoint.' })
    await query('DELETE FROM devices WHERE endpoint = ? AND channel = ?', data.endpoint, channel)
    return reply(200, { subscribed: false })
  }
  if (path !== '/api/notifications/send') return reply(404, {})
  const { kind, event } = data
  if (!kinds.has(kind) || typeof event !== 'string' || !/^[\w:.-]{1,180}$/.test(event)) {
    return reply(400, { error: 'Invalid notification event.' })
  }
  const devices = (await query('SELECT * FROM devices WHERE channel = ?', channel)).rows
  if (!devices.length) return reply(200, { sent: 0, devices: 0 })
  const now = Date.now()
  await query('DELETE FROM deliveries WHERE created < ?', now - 172_800_000)
  const recent = (await get('SELECT COUNT(*) AS count FROM deliveries WHERE channel = ? AND created > ?', channel, now - 60_000)).count
  if (recent >= 10) return reply(429, { error: 'Too many recent notifications. Try again shortly.' })
  const eventKey = kind + ':' + event
  const claim = await query('INSERT INTO deliveries VALUES (?, ?, ?) ON CONFLICT (channel, event) DO NOTHING', channel, eventKey, now)
  if (!claim.rowCount) return reply(200, { duplicate: true, devices: devices.length })
  let sent = 0
  await Promise.all(devices.map(async device => {
    try {
      await webPush.sendNotification(JSON.parse(device.subscription), JSON.stringify({ kind }), {
        TTL: 300, timeout: 5000, vapidDetails: { subject: contact, ...keys },
      })
      sent++
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await query('DELETE FROM devices WHERE endpoint = ? AND channel = ?', device.endpoint, channel)
      }
    }
  }))
  if (!sent) {
    await query('DELETE FROM deliveries WHERE channel = ? AND event = ?', channel, eventKey)
    return reply(502, { error: 'Push unavailable. Check the device subscription and try again.' })
  }
  return reply(200, { sent, devices: devices.length })
}

async function start() {
  const store = await openStore({ stateDir, databaseUrl: process.env.DATABASE_URL })
  const server = createServer((request, response) => {
    handle(request, response, store).catch(error => {
      console.error('Notification relay request failed:', error.code || error.name)
      if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Notification relay error.' }))
    })
  })
  const port = Number(process.env.PORT || process.env.MED_CO_PUSH_PORT || 8012)
  const host = process.env.MED_CO_PUSH_HOST || (hostFrontend ? '0.0.0.0' : '127.0.0.1')
  server.listen(port, host, () => console.log('Med-Co notification relay listening'))
}

start().catch(error => {
  console.error('Notification relay startup failed:', error.code || error.name)
  process.exitCode = 1
})
