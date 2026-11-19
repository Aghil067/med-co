import { useEffect, useState } from 'react'
import { WorkspaceContext } from '../lib/useWorkspaceData'

const key = 'med-co.workspace.v1'
const defaults = {
  profile: { name: import.meta.env.VITE_PROFILE_NAME?.trim() || 'Abisha', stepGoal: 8000 },
  records: [], medications: [], appointments: [],
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (saved) {
      return {
        profile: { ...defaults.profile, ...saved.profile },
        records: Array.isArray(saved.records) ? saved.records : [],
        medications: Array.isArray(saved.medications) ? saved.medications : [],
        appointments: Array.isArray(saved.appointments) ? saved.appointments : [],
      }
    }
  } catch {
    // Start with an empty workspace if stored data cannot be read.
  }
  return defaults
}

export default function WorkspaceProvider({ children }) {
  const [data, setData] = useState(restore)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      queueMicrotask(() => setStorageError(true))
      return
    }
    queueMicrotask(() => setStorageError(false))
  }, [data])

  function update(section, change) {
    setData(previous => ({ ...previous, [section]: change(previous[section]) }))
  }

  return <WorkspaceContext.Provider value={{ data, update, storageError }}>{children}</WorkspaceContext.Provider>
}
