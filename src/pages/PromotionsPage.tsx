import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../db'
import { deletePromotion, savePromotion } from '../repo'
import type { PromotionKind } from '../types'
import { formatMoney } from '../utils/format'

const emptyForm = {
  name: '',
  kind: 'bundle' as PromotionKind,
  bundleQuantity: '2',
  bundlePrice: '',
  secondUnitDiscountPercent: '50',
  active: true,
  productIds: [] as number[],
}

export default function PromotionsPage() {
  const products = useLiveQuery(() => db.products.orderBy('name').toArray(), [])
  const promotions = useLiveQuery(() => db.promotions.orderBy('id').toArray(), [])

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const productById = useMemo(() => {
    const map = new Map<number, string>()
    products?.forEach((p) => map.set(p.id!, p.name))
    return map
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products ?? []
    return (products ?? []).filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  function toggleProduct(id: number) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((p) => p !== id)
        : [...f.productIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const result = await savePromotion({
      id: editingId ?? undefined,
      name: form.name,
      productIds: form.productIds,
      kind: form.kind,
      bundleQuantity: Number(form.bundleQuantity),
      bundlePrice: Number(form.bundlePrice),
      secondUnitDiscountPercent: Number(form.secondUnitDiscountPercent),
      active: form.active,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    resetForm()
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta promoción?')) return
    await deletePromotion(id)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-stone-800">Promociones</h1>
      <p className="mb-6 text-sm text-stone-500">
        Crea promociones de "lleva N y paga P" o de "2da unidad con descuento". Marca qué
        productos entran en cada promoción (por ejemplo, solo una marca de calcetines); los
        demás productos conservan su precio normal.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-stone-600">
            Nombre de la promoción
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej. 2 pares de calcetines por $150"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-stone-600">
            Tipo de promoción
          </label>
          <div className="flex gap-4 text-sm text-stone-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="kind"
                checked={form.kind === 'bundle'}
                onChange={() => setForm((f) => ({ ...f, kind: 'bundle' }))}
              />
              Lleva N y paga P
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="kind"
                checked={form.kind === 'secondUnitDiscount'}
                onChange={() => setForm((f) => ({ ...f, kind: 'secondUnitDiscount' }))}
              />
              2da unidad con descuento
            </label>
          </div>
        </div>

        {form.kind === 'bundle' ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Lleva esta cantidad
              </label>
              <input
                type="number"
                min={2}
                step={1}
                value={form.bundleQuantity}
                onChange={(e) => setForm((f) => ({ ...f, bundleQuantity: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Paga en total
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.bundlePrice}
                onChange={(e) => setForm((f) => ({ ...f, bundlePrice: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-stone-600">
              Descuento en la 2da unidad (%, 100 = gratis)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={form.secondUnitDiscountPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, secondUnitDiscountPercent: e.target.value }))
                }
                className="w-32 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, secondUnitDiscountPercent: '50' }))}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
              >
                Mitad de precio
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, secondUnitDiscountPercent: '100' }))}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
              >
                Gratis
              </button>
            </div>
            <p className="mt-1 text-xs text-stone-400">
              Por cada 2 unidades elegibles en el carrito, la más barata de las dos recibe este
              descuento.
            </p>
          </div>
        )}

        <div className="sm:col-span-2">
          <label className="mb-1 flex items-center gap-2 text-xs font-medium text-stone-600">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Promoción activa
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-stone-600">
            Productos que entran en la promoción ({form.productIds.length} seleccionado(s))
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200 p-2">
            {filteredProducts.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={form.productIds.includes(p.id!)}
                  onChange={() => toggleProduct(p.id!)}
                />
                <span className="flex-1 text-stone-700">{p.name}</span>
                <span className="text-xs text-stone-400">{formatMoney(p.price)}</span>
              </label>
            ))}
            {filteredProducts.length === 0 && (
              <p className="px-2 py-1 text-sm text-stone-400">No hay productos que coincidan.</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {editingId ? 'Guardar cambios' : 'Agregar promoción'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {promotions?.map((promo) => (
          <div
            key={promo.id}
            className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-stone-800">{promo.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    promo.active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {promo.active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <p className="text-sm text-stone-600">
                {promo.kind === 'secondUnitDiscount'
                  ? promo.secondUnitDiscountPercent === 100
                    ? '2da unidad gratis'
                    : `2da unidad con ${promo.secondUnitDiscountPercent}% de descuento`
                  : `Lleva ${promo.bundleQuantity}, paga ${formatMoney(promo.bundlePrice!)}`}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {promo.productIds.map((id) => productById.get(id) ?? '—').join(', ')}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => {
                  setEditingId(promo.id!)
                  setForm({
                    name: promo.name,
                    kind: promo.kind ?? 'bundle',
                    bundleQuantity: String(promo.bundleQuantity ?? 2),
                    bundlePrice: String(promo.bundlePrice ?? ''),
                    secondUnitDiscountPercent: String(promo.secondUnitDiscountPercent ?? 50),
                    active: promo.active,
                    productIds: promo.productIds,
                  })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(promo.id!)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {promotions?.length === 0 && (
          <p className="text-sm text-stone-500">Aún no hay promociones.</p>
        )}
      </div>
    </div>
  )
}
