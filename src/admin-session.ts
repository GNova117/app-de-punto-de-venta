import { createContext, useContext } from 'react'

export interface AdminSession {
  unlocked: boolean
  unlock: () => void
  lock: () => void
}

export const AdminContext = createContext<AdminSession | null>(null)

export function useAdmin(): AdminSession {
  const session = useContext(AdminContext)
  if (!session) throw new Error('useAdmin debe usarse dentro de <AdminProvider>')
  return session
}
