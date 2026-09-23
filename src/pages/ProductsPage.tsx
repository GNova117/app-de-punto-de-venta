import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import BarcodeField from '../components/BarcodeField'
import ImagePicker from '../components/ImagePicker'
import { db } from '../db'
import { createProduct, deleteProduct, getProductByBarcode, updateProduct } from '../repo'
import type { Product } from '../types'
import { formatMoney } from '../utils/format'

const emptyForm = {
  barcode: '',
  name: '',
  categoryId: '',
  price: '',
  cost: '',
  stock: '',
  minStock: '3',
  imageDataUrl: undefined as string | undefined,
}

export default function ProductsPage() {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), [])
  const products = useLiveQuery(() => db.products.orderBy('name').toArray(), [])

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('todas')
  const [search, setSearch] = useState('')

  const categoryById = useMemo(() => {
    const map = new Map<number, { name: string; color: string }>()
    categories?.forEach((c) => map.set(c.id!, { name: c.name, color: c.color }))
    return map
  }, [categories])

  const filteredProducts = useMemo(() => {
    return (products ?? []).filter((p) => {
      const matchesCategory =
        filterCategory === 'todas' || p.categoryId === Number(filterCategory)
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
      return matchesCategory && matchesSearch
    })
  }, [products, filterCategory, search])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  async function handleBarcodeSubmit(code: string) {
    if (!code.trim() || editingId) return
    const existing = await getProductByBarcode(code.trim())
    if (existing) {
      setError('Ya existe un producto con este código de barras. Puedes editarlo abajo.')
      setEditingId(existing.id!)
      setForm({
        barcode: existing.barcode,
        name: existing.name,
        categoryId: String(existing.categoryId),
        price: String(existing.price),
        cost: String(existing.cost),
        stock: String(existing.stock),
        minStock: String(existing.minStock),
        imageDataUrl: existing.imageDataUrl,
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.barcode.trim()) return setError('El código de barras es obligatorio')
    if (!form.name.trim()) return setError('El nombre del producto es obligatorio')
    if (!form.categoryId) return setError('Selecciona una categoría')
    const price = Number(form.price)
    if (Number.isNaN(price) || price < 0) return setError('El precio no es válido')
    const cost = Number(form.cost || 0)
    const stock = Number(form.stock || 0)
    const minStock = Number(form.minStock || 0)

    if (!editingId) {
      const existing = await getProductByBarcode(form.barcode.trim())
      if (existing) return setError('Ya existe un producto con este código de barras')
    }

    const payload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
      barcode: form.barcode.trim(),
      name: form.name.trim(),
      categoryId: Number(form.categoryId),
      price,
      cost,
      stock,
      minStock,
      imageDataUrl: form.imageDataUrl,
    }

    if (editingId) {
      const { stock: _omit, ...changes } = payload
      await updateProduct(editingId, changes)
    } else {
      await createProduct(payload)
    }
    resetForm()
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este producto? Se perderá su historial de movimientos.')) return
    await deleteProduct(id)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Productos</h1>
      <p className="mb-6 text-sm text-gray-500">
        Registra tus productos escaneando su código de barras, asígnales una categoría y agrega
        una foto para identificarlos fácilmente.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Código de barras
          </label>
          <BarcodeField
            value={form.barcode}
            onChange={(v) => setForm((f) => ({ ...f, barcode: v }))}
            onSubmit={handleBarcodeSubmit}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Foto del producto</label>
          <ImagePicker
            value={form.imageDataUrl}
            onChange={(v) => setForm((f) => ({ ...f, imageDataUrl: v }))}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ej. Playera azul talla M"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Categoría</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Selecciona...</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Precio de venta
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Costo (opcional)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Stock inicial {editingId && '(usa Entradas/Salidas para ajustar)'}
          </label>
          <input
            type="number"
            min="0"
            value={form.stock}
            disabled={!!editingId}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Stock mínimo (alerta)
          </label>
          <input
            type="number"
            min="0"
            value={form.minStock}
            onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editingId ? 'Guardar cambios' : 'Agregar producto'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="todas">Todas las categorías</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((p) => {
          const cat = categoryById.get(p.categoryId)
          const lowStock = p.stock <= p.minStock
          return (
            <div
              key={p.id}
              className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                {p.imageDataUrl ? (
                  <img src={p.imageDataUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl text-gray-300">
                    📦
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-800">{p.name}</p>
                <p className="truncate text-xs text-gray-500">#{p.barcode}</p>
                {cat && (
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name}
                  </span>
                )}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {formatMoney(p.price)}
                  </span>
                  <span
                    className={`text-xs font-medium ${lowStock ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    Stock: {p.stock}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(p.id!)
                      setForm({
                        barcode: p.barcode,
                        name: p.name,
                        categoryId: String(p.categoryId),
                        price: String(p.price),
                        cost: String(p.cost),
                        stock: String(p.stock),
                        minStock: String(p.minStock),
                        imageDataUrl: p.imageDataUrl,
                      })
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id!)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filteredProducts.length === 0 && (
          <p className="text-sm text-gray-500">No hay productos que coincidan.</p>
        )}
      </div>
    </div>
  )
}
