import { useState } from 'react'
import { useAdmin } from '../admin-session'
import { hasAdminPin, verifyAdminPin } from '../auth'
import { cancelSale } from '../repo'
import type { Sale } from '../types'
import { formatDateTime, formatMoney } from '../utils/format'

const REASONS = ['Devolución del cliente', 'Error al cobrar', 'Cambio de producto', 'Otro']

interface Props {
  sale: Sale
  onClose: () => void
}

export default function CancelSaleDialog({ sale, onClose }: Props) {
  const { unlocked } = useAdmin()
  const [needsPin] = useState(() => hasAdminPin() && !unlocked)
  const [reason, setReason] = useState(REASONS[0])
  const [detail, setDetail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function confirmCancel() {
    setError('')
    setBusy(true)
    if (needsPin && !(await verifyAdminPin(pin))) {
      setBusy(false)
      setError('Contraseña de administrador incorrecta.')
      setPin('')
      return
    }
    const result = await cancelSale(sale.id!, detail.trim() ? `${reason}: ${detail.trim()}` : reason)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-stone-800">Cancelar venta #{sale.id}</h3>
        <p className="mb-4 text-sm text-stone-500">
          Vendida el {formatDateTime(sale.date)} · {formatMoney(sale.total)}
        </p>

        <p className="mb-1 text-xs font-medium text-stone-600">Regresan al inventario</p>
        <ul className="mb-4 space-y-0.5 text-sm text-stone-700">
          {sale.items.map((item) => (
            <li key={item.productId}>
              {item.quantity} × {item.name}
            </li>
          ))}
        </ul>

        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">Devuelve al cliente {formatMoney(sale.total)}</p>
          {sale.cashAmount > 0 && <p>💵 Efectivo: {formatMoney(sale.cashAmount)}</p>}
          {sale.transferAmount > 0 && <p>🏦 Transferencia: {formatMoney(sale.transferAmount)}</p>}
          <p className="mt-1 text-xs text-red-700">Se resta del corte de hoy.</p>
        </div>

        <label className="mb-1 block text-xs font-medium text-stone-600">Motivo</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        >
          {REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <input
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Detalle (opcional)"
          className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />

        {needsPin ? (
          <>
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Contraseña de administrador
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mb-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </>
        ) : (
          !hasAdminPin() && (
            <p className="mb-3 text-xs text-stone-500">
              Crea una contraseña en Administración para que solo ustedes puedan cancelar ventas.
            </p>
          )
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-lg border border-stone-300 py-2 text-sm text-stone-600 hover:bg-stone-50"
          >
            Volver
          </button>
          <button
            onClick={confirmCancel}
            disabled={busy || (needsPin && !pin)}
            className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Cancelando...' : 'Cancelar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}
