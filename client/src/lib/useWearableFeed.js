import { createContext, useContext } from 'react'

export const WearableFeedContext = createContext(null)

export function useWearableFeed() {
  return useContext(WearableFeedContext)
}
