import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
const PointsContext = createContext(null)

function PointsProvider({ email, children }) {
  const [points, setPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastAwardMessage, setLastAwardMessage] = useState('')

  const loadPoints = useCallback(async () => {
    if (!email) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/points/${encodeURIComponent(email)}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load points.')
      }

      setPoints(Number(payload.points || 0))
    } catch {
      // Keep UI responsive even if this request fails.
    } finally {
      setIsLoading(false)
    }
  }, [email])

  useEffect(() => {
    loadPoints()
  }, [loadPoints])

  const addPoints = useCallback(
    async (pointsToAdd) => {
      if (!email || !Number.isInteger(pointsToAdd) || pointsToAdd <= 0) {
        return { ok: false, error: 'Invalid points request.' }
      }

      // Optimistic UI: immediately reflect progress in the persistent navbar badge.
      setPoints((current) => current + pointsToAdd)

      try {
        const response = await fetch(`${API_BASE_URL}/api/points/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email, pointsToAdd }),
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Point update failed.')
        }

        setPoints(Number(payload.totalPoints || 0))
        setLastAwardMessage(`+${pointsToAdd} Points Awarded!`)
        return { ok: true, totalPoints: Number(payload.totalPoints || 0) }
      } catch (error) {
        // Roll back optimistic update on failure.
        setPoints((current) => Math.max(0, current - pointsToAdd))
        return { ok: false, error: error.message }
      }
    },
    [email],
  )

  const value = useMemo(
    () => ({
      email,
      points,
      isLoading,
      addPoints,
      lastAwardMessage,
      clearAwardMessage: () => setLastAwardMessage(''),
      reloadPoints: loadPoints,
    }),
    [addPoints, email, isLoading, lastAwardMessage, loadPoints, points],
  )

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
}

function usePoints() {
  const context = useContext(PointsContext)

  if (!context) {
    throw new Error('usePoints must be used inside a PointsProvider.')
  }

  return context
}

export { PointsProvider, usePoints }