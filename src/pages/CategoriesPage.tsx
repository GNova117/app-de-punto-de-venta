import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db'
import { createCategory, deleteCategory, updateCategory } from '../repo'

const COLOR_OPTIONS = [
  '#2563eb',
  '#db2777',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#4b5563',
]

export default function CategoriesPage() {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), [])
  const productCounts = useLiveQuery(async () => {
    const products = await db.products.toArray()
    const counts = new Map<number, number>()
    for (const p of products) {
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1)
    }
    return counts
  }, [])

  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio')
      return
    }
    if (editingId) {
      await updateCategory(editingId, { name: name.trim(), color })
    } else {
      await createCategory(name, color)
    }
    setName('')
    setColor(COLOR_OPTIONS[0])
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta categoría?')) return
    const result = await deleteCategory(id)
    if (!result.ok) {
      alert(result.reason)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Categorías de productos</h1>
      <p className="mb-6 text-sm text-gray-500">
        Clasifica tus productos al ingresarlos: por ejemplo <strong>Ropa</strong>,{' '}
        <strong>Cosméticos</strong> o <strong>Gorras</strong>. Puedes agregar las que necesites.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Nombre de la categoría
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ropa, Cosméticos, Gorras..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Color</label>
          <div className="flex gap-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-7 w-7 rounded-full border-2 ${
                  color === c ? 'border-gray-800' : 'border-transparent'
                }`}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {editingId ? 'Guardar cambios' : 'Agregar categoría'}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setName('')
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories?.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <div>
                <p className="font-medium text-gray-800">{cat.name}</p>
                <p className="text-xs text-gray-500">
                  {productCounts?.get(cat.id!) ?? 0} producto(s)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(cat.id!)
                  setName(cat.name)
                  setColor(cat.color)
                }}
                className="rounded-lg px-2 py-1 text-sm text-blue-600 hover:bg-blue-50"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(cat.id!)}
                className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {categories?.length === 0 && (
          <p className="text-sm text-gray-500">Aún no hay categorías.</p>
        )}
      </div>
    </div>
  )
}
