import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AdminContext } from '../admin-session'

const IDLE_LIMIT_MS = 10 * 60 * 1000

export default function AdminProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const lastActivity = useRef(0)

  const lock = useCallback(() => setUnlocked(false), [])
  const unlock = useCallback(() => {
    lastActivity.current = Date.now()
    setUnlocked(true)
  }, [])

  useEffect(() => {
    if (!unlocked) return
    const expired = () => Date.now() - lastActivity.current > IDLE_LIMIT_MS
    const lockIfExpired = () => {
      if (expired()) setUnlocked(false)
    }
    // Al volver tras mucho tiempo, la primera interacción bloquea en vez de renovar la sesión.
    const onActivity = () => {
      if (expired()) setUnlocked(false)
      else lastActivity.current = Date.now()
    }

    const timer = setInterval(lockIfExpired, 30_000)
    window.addEventListener('pointerdown', onActivity, true)
    window.addEventListener('keydown', onActivity, true)
    document.addEventListener('visibilitychange', lockIfExpired)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pointerdown', onActivity, true)
      window.removeEventListener('keydown', onActivity, true)
      document.removeEventListener('visibilitychange', lockIfExpired)
    }
  }, [unlocked])

  const session = useMemo(() => ({ unlocked, unlock, lock }), [unlocked, unlock, lock])
  return <AdminContext.Provider value={session}>{children}</AdminContext.Provider>
}
