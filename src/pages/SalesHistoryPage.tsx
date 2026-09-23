import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { listSalesByDate } from '../repo'
import { formatDateTime, formatMoney, todayInputValue } from '../utils/format'

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
}

export default function SalesHistoryPage() {
  const [date, setDate] = useState(todayInputValue())
  const sales = useLiveQuery(() => listSalesByDate(date), [date])
  const [expanded, setExpanded] = useState<number | null>(null)

  const total = sales?.reduce((sum, s) => sum + s.total, 0) ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Historial de ventas</h1>
      <p className="mb-6 text-sm text-gray-500">
        Consulta las ventas realizadas en el día. Cambia la fecha para ver días anteriores.
      </p>

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="date"
          value={date}
          max={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="text-right">
          <p className="text-xs text-gray-500">{sales?.length ?? 0} venta(s)</p>
          <p className="text-lg font-bold text-gray-900">{formatMoney(total)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {sales?.map((s) => (
          <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id!)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="font-medium text-gray-800">Venta #{s.id}</p>
                <p className="text-xs text-gray-500">{formatDateTime(s.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {PAYMENT_LABELS[s.paymentMethod]}
                </span>
                <span className="font-semibold text-gray-900">{formatMoney(s.total)}</span>
                <span className="text-gray-400">{expanded === s.id ? '▲' : '▼'}</span>
              </div>
            </button>
            {expanded === s.id && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <table className="w-full text-sm">
                  <tbody>
                    {s.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 text-gray-700">
                          {item.name} <span className="text-gray-400">x{item.quantity}</span>
                        </td>
                        <td className="py-1 text-right text-gray-800">
                          {formatMoney(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {s.paymentMethod === 'mixto' && (
                  <p className="mt-2 text-xs text-gray-500">
                    Efectivo: {formatMoney(s.cashAmount)} · Transferencia:{' '}
                    {formatMoney(s.transferAmount)}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {sales?.length === 0 && (
          <p className="text-sm text-gray-500">No hay ventas registradas en esta fecha.</p>
        )}
      </div>
    </div>
  )
}
