import { indiaDate } from './useWorkspaceData.js'

export const DOSE_GRACE_MINUTES = 15

export function pendingDoseReminders(medications, now = Date.now()) {
  const today = indiaDate(new Date(now))
  const yesterday = indiaDate(new Date(now - 86_400_000))
  return medications.flatMap(item => [yesterday, today].flatMap(date => {
    if (item.start > date || item.log?.[date]) return []
    const scheduled = Date.parse(`${date}T${item.time}:00+05:30`)
    const due = scheduled + DOSE_GRACE_MINUTES * 60_000
    if (!Number.isFinite(due) || now < due || now - due >= 12 * 60 * 60_000) return []
    return [{ id: `${item.id}:${date}`, name: item.name, date, time: item.time }]
  }))
}
