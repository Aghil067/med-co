self.addEventListener('push', event => {
  const messages = {
    anomaly: ['Med-Co wearable alert', 'An unusual reading was detected. Open Med-Co to review.', '/risk'],
    simulation: ['Med-Co demo alert', 'A demo wearable anomaly was detected.', '/risk'],
    medication: ['Med-Co medication reminder', 'A scheduled dose is still unlogged. Open Med-Co to review.', '/medications'],
    test: ['Med-Co test notification', 'This device can receive Med-Co notifications.', '/settings'],
  }
  let kind
  try {
    kind = event.data.json().kind
  } catch {
    return
  }
  if (!Object.hasOwn(messages, kind)) return
  const [title, body, url] = messages[kind]
  event.waitUntil(self.registration.showNotification(title, { body, tag: `med-co-${kind}`, data: { url }, icon: '/favicon.svg' }))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find(client => client.url.startsWith(self.location.origin + '/'))
    if (existing) {
      const updated = await existing.navigate(url)
      if (updated) return updated.focus()
    }
    return self.clients.openWindow(url)
  })())
})
