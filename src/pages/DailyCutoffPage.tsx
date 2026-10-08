import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { downloadBackup } from '../backup'
import { closeCashCutoff, getCashCutoffByDate, getDailyCutoff } from '../repo'
import { formatDate, formatDateTime, formatMoney, todayInputValue } from '../utils/format'

export default function DailyCutoffPage() {
  const [date, setDate] = useState(todayInputValue())
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')

  const cutoff = useLiveQuery(() => getDailyCutoff(date), [date])
  const closedCutoff = useLiveQuery(() => getCashCutoffByDate(date), [date])

  async function handleClose() {
    setError('')
    if (
      !confirm(
        '¿Cerrar el corte de este día? Quedará guardado como definitivo y no se podrá cerrar de nuevo.',
      )
    ) {
      return
    }
    setClosing(true)
    const result = await closeCashCutoff(date)
    setClosing(false)
    if (!result.ok) {
      setError(result.error)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-full">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-stone-800">Corte del día</h1>
          <p className="text-sm text-stone-500">
            Resumen de pagos en efectivo y transferencia para cerrar caja.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => downloadBackup()}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50"
          >
            💾 Descargar respaldo
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <input
          type="date"
          value={date}
          max={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />

        {closedCutoff ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            🔒 Corte cerrado el {formatDateTime(closedCutoff.closedAt)}
          </span>
        ) : (
          <button
            onClick={handleClose}
            disabled={closing || !cutoff || cutoff.count === 0}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {closing ? 'Cerrando...' : '🔒 Cerrar corte'}
          </button>
        )}
      </div>
      {error && <p className="mb-4 text-sm text-red-600 print:hidden">{error}</p>}

      {cutoff && (
        <>
          <p className="mb-4 text-center text-lg font-medium text-stone-700 capitalize">
            {formatDate(cutoff.date)}
          </p>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
              <p className="text-xs text-stone-500">💵 Efectivo</p>
              <p className="mt-1 text-2xl font-bold text-green-700">
                {formatMoney(cutoff.totalCash)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
              <p className="text-xs text-stone-500">🏦 Transferencia</p>
              <p className="mt-1 text-2xl font-bold text-brand-700">
                {formatMoney(cutoff.totalTransfer)}
              </p>
            </div>
            <div className="rounded-xl border border-brand-700 bg-brand-600 p-4 text-center">
              <p className="text-xs text-brand-100">Total del día</p>
              <p className="mt-1 text-2xl font-bold text-white">{formatMoney(cutoff.total)}</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
              <p className="text-xs text-stone-500">Costo de lo vendido</p>
              <p className="mt-1 text-lg font-semibold text-stone-700">
                {formatMoney(cutoff.totalCost)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
              <p className="text-xs text-stone-500">Descuentos por promoción</p>
              <p className="mt-1 text-lg font-semibold text-stone-700">
                {formatMoney(cutoff.totalDiscount)}
              </p>
            </div>
            <div className="rounded-xl border border-green-600 bg-green-50 p-3 text-center">
              <p className="text-xs text-green-700">Ganancia del día</p>
              <p className="mt-1 text-lg font-bold text-green-700">
                {formatMoney(cutoff.totalProfit)}
              </p>
            </div>
          </div>

          {cutoff.refundsCount > 0 && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              Los totales ya descuentan {cutoff.refundsCount} cancelación(es) de hoy por{' '}
              <strong>-{formatMoney(cutoff.refundsTotal)}</strong>.
            </p>
          )}

          <p className="mb-3 text-sm text-stone-500">{cutoff.count} venta(s) registrada(s)</p>

          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-2">Hora</th>
                  <th className="px-4 py-2">Venta</th>
                  <th className="px-4 py-2">Método</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {cutoff.sales.map((s) => (
                  <tr key={s.id} className="border-t border-stone-100">
                    <td className="px-4 py-2 text-stone-500">{formatDateTime(s.date)}</td>
                    <td className="px-4 py-2 font-medium text-stone-800">
                      #{s.id}
                      {s.cancelledAt && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Cancelada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 capitalize text-stone-600">{s.paymentMethod}</td>
                    <td className="px-4 py-2 text-right font-medium text-stone-800">
                      {formatMoney(s.total)}
                    </td>
                  </tr>
                ))}
                {cutoff.sales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-stone-400">
                      No hay ventas registradas en esta fecha.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {cutoff.refunds.length > 0 && (
            <>
              <h2 className="mt-6 mb-3 text-sm font-semibold text-stone-700">
                Cancelaciones del día
              </h2>
              <div className="overflow-hidden rounded-xl border border-red-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-50 text-xs text-red-700">
                    <tr>
                      <th className="px-4 py-2">Cancelada</th>
                      <th className="px-4 py-2">Venta</th>
                      <th className="px-4 py-2">Método</th>
                      <th className="px-4 py-2 text-right">Devuelto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cutoff.refunds.map((s) => (
                      <tr key={s.id} className="border-t border-red-100">
                        <td className="px-4 py-2 text-stone-500">{formatDateTime(s.cancelledAt!)}</td>
                        <td className="px-4 py-2 text-stone-800">
                          <span className="font-medium">#{s.id}</span>
                          <span className="block text-xs text-stone-400">
                            vendida {formatDateTime(s.date)}
                          </span>
                        </td>
                        <td className="px-4 py-2 capitalize text-stone-600">{s.paymentMethod}</td>
                        <td className="px-4 py-2 text-right font-medium text-red-700">
                          -{formatMoney(s.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
