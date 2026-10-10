import { useEffect, useState } from 'react'

/**
 * useState that is saved to localStorage, so data survives closing the app
 * and needs no network. Falls back to the initial value if nothing is stored
 * or the stored JSON is unreadable.
 */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : JSON.parse(raw)
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [key, value])

  return [value, setValue]
}
