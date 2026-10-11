import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import BarcodeField from '../components/BarcodeField'
import TicketDialog from '../components/TicketDialog'
import { db } from '../db'
import { computeCartPricing } from '../promotions'
import { createSale, getProductByBarcode } from '../repo'
import type { AppliedPromotion, PaymentMethod, Product, SaleItem } from '../types'
import { formatMoney } from '../utils/format'

interface CartLine extends SaleItem {
  maxStock: number
}

export default function PosPage() {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), [])
  const products = useLiveQuery(() => db.products.orderBy('name').toArray(), [])
  const promotions = useLiveQuery(() => db.promotions.toArray(), [])

  const [barcode, setBarcode] = useState('')
  const [scanError, setScanError] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [categoryFilter, setCategoryFilter] = useState('todas')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [ticketSaleId, setTicketSaleId] = useState<number | null>(null)
  const [salesDone, setSalesDone] = useState(0)

  const pricing = useMemo(
    () => computeCartPricing(cart, promotions ?? []),
    [cart, promotions],
  )
  const total = pricing.total

  const visibleProducts = useMemo(() => {
    return (products ?? []).filter(
      (p) => categoryFilter === 'todas' || p.categoryId === Number(categoryFilter),
    )
  }, [products, categoryFilter])

  function addToCart(product: Product) {
    setScanError('')
    if (product.stock <= 0) {
      setScanError(`"${product.name}" no tiene stock disponible.`)
      return
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id)
      if (existing) {
        if (existing.quantity + 1 > product.stock) {
          setScanError(`Solo hay ${product.stock} unidad(es) de "${product.name}".`)
          return prev
        }
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        )
      }
      return [
        ...prev,
        {
          productId: product.id!,
          name: product.name,
          barcode: product.barcode,
          price: product.price,
          cost: product.cost,
          quantity: 1,
          maxStock: product.stock,
        },
      ]
    })
  }

  async function handleScan(code: string) {
    setScanError('')
    const trimmed = code.trim()
    if (!trimmed) return
    // Limpiar antes de buscar: un lector rápido ya puede estar tecleando el siguiente código.
    setBarcode('')
    const product = await getProductByBarcode(trimmed)
    if (!product) {
      setScanError(`No se encontró ningún producto con el código "${trimmed}".`)
      return
    }
    addToCart(product)
  }

  function updateQuantity(productId: number, quantity: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(0, Math.min(quantity, l.maxStock)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    )
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.productId !== productId))
  }

  function clearCart() {
    setCart([])
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
      <div className="flex-1">
        <h1 className="mb-1 text-2xl font-bold text-stone-800">Vender</h1>
        <p className="mb-4 text-sm text-stone-500">
          Escanea el código de barras del producto o selecciónalo de la lista.
        </p>

        {/* La key cambia al cerrar el ticket para volver a enfocar el campo y seguir escaneando. */}
        <BarcodeField
          key={salesDone}
          value={barcode}
          onChange={setBarcode}
          onSubmit={handleScan}
          autoFocus
        />
        {scanError && <p className="mt-2 text-sm text-red-600">{scanError}</p>}

        <div className="mt-4 mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('todas')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              categoryFilter === 'todas'
                ? 'bg-brand-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todas
          </button>
          {categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(String(c.id))}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                categoryFilter === String(c.id)
                  ? 'text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              style={categoryFilter === String(c.id) ? { backgroundColor: c.color } : undefined}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {visibleProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white p-2 text-center hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-stone-50">
                {p.imageDataUrl ? (
                  <img src={p.imageDataUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl text-stone-300">
                    📦
                  </div>
                )}
              </div>
              <p className="line-clamp-2 text-xs font-medium text-stone-700">{p.name}</p>
              <p className="text-xs font-semibold text-stone-800">{formatMoney(p.price)}</p>
              <p className="text-[10px] text-stone-400">Stock: {p.stock}</p>
            </button>
          ))}
          {visibleProducts.length === 0 && (
            <p className="col-span-full text-sm text-stone-500">
              No hay productos en esta categoría.
            </p>
          )}
        </div>
      </div>

      <div className="w-full shrink-0 lg:w-96">
        <div className="sticky top-20 rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-stone-800">Carrito</h2>
          <div className="max-h-[45vh] space-y-2 overflow-y-auto">
            {cart.map((line) => (
              <div key={line.productId} className="flex items-center gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-stone-800">{line.name}</p>
                  <p className="text-xs text-stone-500">{formatMoney(line.price)} c/u</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={line.maxStock}
                  value={line.quantity}
                  onChange={(e) => updateQuantity(line.productId, Number(e.target.value))}
                  className="w-14 rounded-lg border border-stone-300 px-1 py-1 text-center text-sm"
                />
                <span className="w-16 shrink-0 text-right font-medium text-stone-800">
                  {formatMoney(line.price * line.quantity)}
                </span>
                <button
                  onClick={() => removeLine(line.productId)}
                  className="text-stone-400 hover:text-red-600"
                  aria-label="Quitar"
                >
                  ✕
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-sm text-stone-400">El carrito está vacío.</p>
            )}
          </div>

          <div className="mt-4 border-t border-stone-200 pt-3">
            {pricing.discount > 0 && (
              <>
                <div className="flex items-center justify-between text-sm text-stone-500">
                  <span>Subtotal</span>
                  <span>{formatMoney(pricing.subtotal)}</span>
                </div>
                {pricing.applied.map((promo) => (
                  <div
                    key={promo.promotionId}
                    className="flex items-center justify-between text-sm text-green-700"
                  >
                    <span>
                      🏷️ {promo.name} ({promo.groups}×{promo.unitsUsed / promo.groups})
                    </span>
                    <span>-{formatMoney(promo.discount)}</span>
                  </div>
                ))}
              </>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-base font-semibold text-stone-800">Total</span>
              <span className="text-xl font-bold text-stone-900">{formatMoney(total)}</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="flex-1 rounded-lg border border-stone-300 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-40"
            >
              Vaciar
            </button>
            <button
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              Cobrar
            </button>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          total={total}
          discount={pricing.discount}
          appliedPromotions={pricing.applied}
          items={cart}
          onClose={() => setCheckoutOpen(false)}
          onComplete={(saleId) => {
            setCart([])
            setCheckoutOpen(false)
            setTicketSaleId(saleId)
          }}
        />
      )}

      {ticketSaleId != null && (
        <TicketDialog
          saleId={ticketSaleId}
          heading={`✅ Venta #${ticketSaleId} registrada`}
          closeLabel="Nueva venta"
          onClose={() => {
            setTicketSaleId(null)
            setSalesDone((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}

function CheckoutModal({
  total,
  discount,
  appliedPromotions,
  items,
  onClose,
  onComplete,
}: {
  total: number
  discount: number
  appliedPromotions: AppliedPromotion[]
  items: SaleItem[]
  onClose: () => void
  onComplete: (saleId: number) => void
}) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo')
  const [cashReceived, setCashReceived] = useState(String(total))
  const [cashPortion, setCashPortion] = useState(String(total))
  const [transferPortion, setTransferPortion] = useState('0')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const change = Math.max(0, Number(cashReceived || 0) - total)
  const mixedSum = Number(cashPortion || 0) + Number(transferPortion || 0)

  async function confirm() {
    setError('')
    let cashAmount = 0
    let transferAmount = 0

    if (method === 'efectivo') {
      if (Number(cashReceived) < total) {
        setError('El efectivo recibido es menor al total.')
        return
      }
      cashAmount = total
    } else if (method === 'transferencia') {
      transferAmount = total
    } else {
      if (Math.abs(mixedSum - total) > 0.01) {
        setError('La suma de efectivo + transferencia debe ser igual al total.')
        return
      }
      cashAmount = Number(cashPortion)
      transferAmount = Number(transferPortion)
    }

    setSubmitting(true)
    const result = await createSale({
      items,
      paymentMethod: method,
      cashAmount,
      transferAmount,
      discount,
      appliedPromotions,
      cashReceived: method === 'efectivo' ? Number(cashReceived) : undefined,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error ?? 'No se pudo registrar la venta.')
      return
    }
    onComplete(result.saleId!)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-800">Cobrar</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            ✕
          </button>
        </div>

        <p className="mb-4 text-center text-3xl font-bold text-stone-900">{formatMoney(total)}</p>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {(['efectivo', 'transferencia', 'mixto'] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize ${
                method === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-stone-300 text-stone-600'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {method === 'efectivo' && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Efectivo recibido
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-sm text-stone-500">Cambio: {formatMoney(change)}</p>
          </div>
        )}

        {method === 'transferencia' && (
          <p className="mb-4 text-sm text-stone-500">
            Se registrará el total como pago por transferencia.
          </p>
        )}

        {method === 'mixto' && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Efectivo</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cashPortion}
                onChange={(e) => setCashPortion(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Transferencia
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={transferPortion}
                onChange={(e) => setTransferPortion(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <p
              className={`col-span-2 text-xs ${
                Math.abs(mixedSum - total) > 0.01 ? 'text-red-600' : 'text-stone-500'
              }`}
            >
              Suma: {formatMoney(mixedSum)} / Total: {formatMoney(total)}
            </p>
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={confirm}
          disabled={submitting}
          className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Procesando...' : 'Confirmar venta'}
        </button>
      </div>
    </div>
  )
}
