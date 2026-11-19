import { createContext, useContext } from 'react'

export const NotificationsContext = createContext(null)
export const useNotifications = () => useContext(NotificationsContext)

export async function notificationRequest(action, data) {
  const response = await fetch(`/api/notifications/${action}`, data ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  } : undefined)
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'The notification relay is unavailable.')
  return result
}

export function supportedNotifications() {
  return window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}
