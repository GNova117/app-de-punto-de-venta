import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import CancelSaleDialog from '../components/CancelSaleDialog'
import TicketDialog from '../components/TicketDialog'
import { listSalesByDate } from '../repo'
import { PAYMENT_LABELS } from '../ticket'
import type { Sale } from '../types'
import { formatDateTime, formatMoney, todayInputValue } from '../utils/format'

export default function SalesHistoryPage() {
  const [date, setDate] = useState(todayInputValue())
  const sales = useLiveQuery(() => listSalesByDate(date), [date])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState<Sale | null>(null)
  const [ticketSaleId, setTicketSaleId] = useState<number | null>(null)

  const activeSales = sales?.filter((s) => !s.cancelledAt) ?? []
  const cancelledCount = (sales?.length ?? 0) - activeSales.length
  const total = activeSales.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-stone-800">Historial de ventas</h1>
      <p className="mb-6 text-sm text-stone-500">
        Consulta las ventas realizadas en el día. Cambia la fecha para ver días anteriores.
      </p>

      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          type="date"
          value={date}
          max={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <div className="text-right">
          <p className="text-xs text-stone-500">
            {activeSales.length} venta(s)
            {cancelledCount > 0 && ` · ${cancelledCount} cancelada(s)`}
          </p>
          <p className="text-lg font-bold text-stone-900">{formatMoney(total)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {sales?.map((s) => (
          <div
            key={s.id}
            className={`rounded-xl border bg-white p-4 ${s.cancelledAt ? 'border-red-200' : 'border-stone-200'}`}
          >
            <button
              onClick={() => setExpanded(expanded === s.id ? null : s.id!)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <p className="font-medium text-stone-800">
                  Venta #{s.id}
                  {s.cancelledAt && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      Cancelada
                    </span>
                  )}
                </p>
                <p className="text-xs text-stone-500">{formatDateTime(s.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  {PAYMENT_LABELS[s.paymentMethod]}
                </span>
                <span
                  className={`font-semibold ${s.cancelledAt ? 'text-stone-400 line-through' : 'text-stone-900'}`}
                >
                  {formatMoney(s.total)}
                </span>
                <span className="text-stone-400">{expanded === s.id ? '▲' : '▼'}</span>
              </div>
            </button>
            {expanded === s.id && (
              <div className="mt-3 border-t border-stone-100 pt-3">
                <table className="w-full text-sm">
                  <tbody>
                    {s.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 text-stone-700">
                          {item.name} <span className="text-stone-400">x{item.quantity}</span>
                        </td>
                        <td className="py-1 text-right text-stone-800">
                          {formatMoney(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {s.paymentMethod === 'mixto' && (
                  <p className="mt-2 text-xs text-stone-500">
                    Efectivo: {formatMoney(s.cashAmount)} · Transferencia:{' '}
                    {formatMoney(s.transferAmount)}
                  </p>
                )}
                {s.discount > 0 && (
                  <p className="mt-2 text-xs text-green-700">
                    🏷️ Descuento por promoción: -{formatMoney(s.discount)}
                  </p>
                )}
                {s.cancelledAt && (
                  <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                    Cancelada el {formatDateTime(s.cancelledAt)}
                    {s.cancelReason && ` · ${s.cancelReason}`}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setTicketSaleId(s.id!)}
                    className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                  >
                    🧾 Ver ticket
                  </button>
                  {!s.cancelledAt && (
                    <button
                      onClick={() => setCancelling(s)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Cancelar venta
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {sales?.length === 0 && (
          <p className="text-sm text-stone-500">No hay ventas registradas en esta fecha.</p>
        )}
      </div>

      {cancelling && <CancelSaleDialog sale={cancelling} onClose={() => setCancelling(null)} />}
      {ticketSaleId != null && (
        <TicketDialog
          saleId={ticketSaleId}
          heading={`Ticket de la venta #${ticketSaleId}`}
          closeLabel="Cerrar"
          onClose={() => setTicketSaleId(null)}
        />
      )}
    </div>
  )
}
