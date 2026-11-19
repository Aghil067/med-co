import { createContext, useContext } from 'react'

export const WorkspaceContext = createContext(null)
export const useWorkspaceData = () => useContext(WorkspaceContext)

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })

export function indiaDate(value = new Date()) {
  const parts = Object.fromEntries(dayFormatter.formatToParts(value).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function makeEntry(fields) {
  return { ...fields, id: Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'), createdAt: new Date().toISOString() }
}
