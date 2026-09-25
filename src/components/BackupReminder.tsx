import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useLocation } from 'react-router-dom'
import { useLastBackupAt } from '../backup'
import { db } from '../db'
import { formatDateTime } from '../utils/format'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export default function BackupReminder() {
  const { pathname } = useLocation()
  const lastBackupAt = useLastBackupAt()
  const needsBackup = useLiveQuery(async () => {
    const [lastSale, lastMovement] = await Promise.all([
      db.sales.orderBy('date').last(),
      db.stockMovements.orderBy('date').last(),
    ])
    const saleDate = lastSale?.date ?? ''
    const movementDate = lastMovement?.date ?? ''
    const lastChange = saleDate > movementDate ? saleDate : movementDate
    if (!lastChange) return false
    if (!lastBackupAt) return true
    const isOld = Date.now() - new Date(lastBackupAt).getTime() > ONE_DAY_MS
    return lastChange > lastBackupAt && isOld
  }, [lastBackupAt])

  if (pathname === '/respaldo' || !needsBackup) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-amber-800">
        <span>
          💾 Tienes ventas o movimientos sin respaldar
          {lastBackupAt ? ` (último respaldo: ${formatDateTime(lastBackupAt)})` : ''}.
        </span>
        <Link
          to="/respaldo"
          className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
        >
          Hacer respaldo
        </Link>
      </div>
    </div>
  )
}
