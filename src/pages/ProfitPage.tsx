import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { getCatalogProfitSummary, getSalesProfitReport } from '../repo'
import { formatMoney, todayInputValue } from '../utils/format'

type Tab = 'catalogo' | 'ventas'

export default function ProfitPage() {
  const [tab, setTab] = useState<Tab>('catalogo')

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-stone-800">Ganancias</h1>
      <p className="mb-6 text-sm text-stone-500">
        Consulta cuánto cuesta cada producto, en cuánto se vende y cuánto se gana, por producto y
        en total.
      </p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab('catalogo')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'catalogo'
              ? 'bg-brand-600 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab('ventas')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'ventas'
              ? 'bg-brand-600 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          Por ventas
        </button>
      </div>

      {tab === 'catalogo' ? <CatalogProfit /> : <SalesProfit />}
    </div>
  )
}

function CatalogProfit() {
  const rows = useLiveQuery(() => getCatalogProfitSummary(), [])

  const totalPotential = rows?.reduce((sum, r) => sum + r.stockProfitPotential, 0) ?? 0

  return (
    <>
      <p className="mb-3 text-sm text-stone-500">
        Ganancia por unidad de cada producto, según su precio de venta y costo registrados.
      </p>

      <div className="mb-4 rounded-xl border border-green-600 bg-green-50 p-4 text-center">
        <p className="text-xs text-green-700">Ganancia potencial si se vende todo el inventario</p>
        <p className="mt-1 text-2xl font-bold text-green-700">{formatMoney(totalPotential)}</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500">
            <tr>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2 text-right">Costo</th>
              <th className="px-4 py-2 text-right">Precio</th>
              <th className="px-4 py-2 text-right">Ganancia/u.</th>
              <th className="px-4 py-2 text-right">Margen</th>
              <th className="px-4 py-2 text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.productId} className="border-t border-stone-100">
                <td className="px-4 py-2 font-medium text-stone-800">{r.name}</td>
                <td className="px-4 py-2 text-right text-stone-600">{formatMoney(r.cost)}</td>
                <td className="px-4 py-2 text-right text-stone-600">{formatMoney(r.price)}</td>
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    r.unitProfit >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}
                >
                  {formatMoney(r.unitProfit)}
                </td>
                <td className="px-4 py-2 text-right text-stone-500">
                  {r.marginPct.toFixed(0)}%
                </td>
                <td className="px-4 py-2 text-right text-stone-500">{r.stock}</td>
              </tr>
            ))}
            {rows?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-stone-400">
                  No hay productos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

function SalesProfit() {
  const [from, setFrom] = useState(todayInputValue())
  const [to, setTo] = useState(todayInputValue())
  const report = useLiveQuery(() => getSalesProfitReport(from, to), [from, to])

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Desde</label>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Hasta</label>
          <input
            type="date"
            value={to}
            min={from}
            max={todayInputValue()}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {report && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
              <p className="text-xs text-stone-500">Ingresos</p>
              <p className="mt-1 text-lg font-semibold text-stone-800">
                {formatMoney(report.totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
              <p className="text-xs text-stone-500">Costo</p>
              <p className="mt-1 text-lg font-semibold text-stone-800">
                {formatMoney(report.totalCost)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center">
              <p className="text-xs text-stone-500">Descuentos</p>
              <p className="mt-1 text-lg font-semibold text-stone-800">
                {formatMoney(report.totalDiscount)}
              </p>
            </div>
            <div className="rounded-xl border border-green-600 bg-green-50 p-3 text-center">
              <p className="text-xs text-green-700">Ganancia total</p>
              <p className="mt-1 text-lg font-bold text-green-700">
                {formatMoney(report.totalProfit)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs text-stone-500">
                <tr>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2 text-right">Unidades</th>
                  <th className="px-4 py-2 text-right">Ingresos</th>
                  <th className="px-4 py-2 text-right">Costo</th>
                  <th className="px-4 py-2 text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.productId} className="border-t border-stone-100">
                    <td className="px-4 py-2 font-medium text-stone-800">{r.name}</td>
                    <td className="px-4 py-2 text-right text-stone-600">{r.quantitySold}</td>
                    <td className="px-4 py-2 text-right text-stone-600">
                      {formatMoney(r.revenue)}
                    </td>
                    <td className="px-4 py-2 text-right text-stone-600">{formatMoney(r.cost)}</td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        r.profit >= 0 ? 'text-green-700' : 'text-red-600'
                      }`}
                    >
                      {formatMoney(r.profit)}
                    </td>
                  </tr>
                ))}
                {report.rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-stone-400">
                      No hay ventas en este rango de fechas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {report.totalDiscount > 0 && (
            <p className="mt-3 text-xs text-stone-400">
              Nota: la ganancia por producto no descuenta las promociones aplicadas a nivel venta;
              la ganancia total sí las incluye.
            </p>
          )}
        </>
      )}
    </>
  )
}
