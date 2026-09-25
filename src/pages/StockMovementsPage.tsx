import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import BarcodeField from '../components/BarcodeField'
import { db } from '../db'
import { getProductByBarcode, listStockMovements, registerStockMovement } from '../repo'
import type { MovementType, Product } from '../types'
import { formatDateTime } from '../utils/format'

const ENTRADA_REASONS = ['Compra a proveedor', 'Reabastecimiento', 'Devolución de cliente', 'Ajuste de inventario']
const SALIDA_REASONS = ['Merma / dañado', 'Extravío', 'Uso interno', 'Ajuste de inventario', 'Devolución a proveedor']

export default function StockMovementsPage() {
  const movements = useLiveQuery(() => listStockMovements(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [type, setType] = useState<MovementType>('entrada')
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState(ENTRADA_REASONS[0])
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const categoryById = new Map(categories?.map((c) => [c.id, c]))

  async function handleLookup(code: string) {
    setMessage(null)
    const found = await getProductByBarcode(code.trim())
    setProduct(found ?? null)
    if (!found && code.trim()) {
      setMessage({ kind: 'error', text: 'No se encontró un producto con ese código de barras.' })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!product) {
      setMessage({ kind: 'error', text: 'Escanea o busca un producto primero.' })
      return
    }
    const qty = Number(quantity)
    if (!qty || qty <= 0) {
      setMessage({ kind: 'error', text: 'La cantidad debe ser mayor a cero.' })
      return
    }
    const result = await registerStockMovement({
      productId: product.id!,
      type,
      quantity: qty,
      reason,
      note: note.trim() || undefined,
    })
    if (!result.ok) {
      setMessage({ kind: 'error', text: result.error ?? 'No se pudo registrar el movimiento.' })
      return
    }
    setMessage({
      kind: 'ok',
      text: `${type === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente.`,
    })
    const refreshed = await db.products.get(product.id!)
    setProduct(refreshed ?? null)
    setQuantity('1')
    setNote('')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Entradas y salidas de producto</h1>
      <p className="mb-6 text-sm text-gray-500">
        Registra reabastecimientos (entradas) o mermas/ajustes (salidas) para mantener tu stock
        disponible siempre actualizado.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Código de barras del producto
          </label>
          <BarcodeField
            value={barcode}
            onChange={setBarcode}
            onSubmit={handleLookup}
            autoFocus
          />
        </div>

        {product && (
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white">
              {product.imageDataUrl ? (
                <img
                  src={product.imageDataUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl text-gray-300">
                  📦
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-800">{product.name}</p>
              <p className="text-xs text-gray-500">
                {categoryById.get(product.categoryId)?.name ?? 'Sin categoría'} · Stock actual:{' '}
                <strong>{product.stock}</strong>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Tipo de movimiento
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('entrada')
                  setReason(ENTRADA_REASONS[0])
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  type === 'entrada'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                ⬆️ Entrada
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('salida')
                  setReason(SALIDA_REASONS[0])
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  type === 'salida'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                ⬇️ Salida
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Cantidad</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {(type === 'entrada' ? ENTRADA_REASONS : SALIDA_REASONS).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Nota (opcional)
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. Proveedor Textiles S.A., folio de factura..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          className={`self-start rounded-lg px-4 py-2 text-sm font-medium text-white ${
            type === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          Registrar {type === 'entrada' ? 'entrada' : 'salida'}
        </button>
      </form>

      <h2 className="mb-3 text-lg font-semibold text-gray-800">Historial de movimientos</h2>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {movements?.map((m) => (
              <tr key={m.id} className="border-t border-gray-100">
                <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                  {formatDateTime(m.date)}
                </td>
                <td className="px-4 py-2 font-medium text-gray-800">
                  {m.product?.name ?? 'Producto eliminado'}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.type === 'entrada'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {m.type === 'entrada' ? 'Entrada' : 'Salida'}
                  </span>
                </td>
                <td className="px-4 py-2">{m.quantity}</td>
                <td className="px-4 py-2 text-gray-600">
                  {m.reason}
                  {m.note && <span className="text-gray-400"> · {m.note}</span>}
                </td>
              </tr>
            ))}
            {movements?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Sin movimientos registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
