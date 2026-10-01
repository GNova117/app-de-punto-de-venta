import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { downloadBackup } from '../backup'
import { getDailyCutoff } from '../repo'
import { formatDate, formatDateTime, formatMoney, todayInputValue } from '../utils/format'

export default function DailyCutoffPage() {
  const [date, setDate] = useState(todayInputValue())
  const cutoff = useLiveQuery(() => getDailyCutoff(date), [date])

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

      <div className="mb-6 print:hidden">
        <input
          type="date"
          value={date}
          max={todayInputValue()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

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

          <p className="mb-3 text-sm text-stone-500">
            {cutoff.count} transacción(es) registrada(s)
          </p>

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
                    <td className="px-4 py-2 font-medium text-stone-800">#{s.id}</td>
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
        </>
      )}
    </div>
  )
}
