import { useState } from 'react'
import { CATEGORY_COLORS, firstUnusedColor } from '../categoryColors'
import { findCategoryByName, saveCategory } from '../repo'

interface Props {
  usedColors: string[]
  onDone: (categoryId: number) => void
  onCancel: () => void
}

// Va dentro del formulario de producto, así que no puede ser un <form> propio.
export default function QuickCategoryForm({ usedColors, onDone, onCancel }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => firstUnusedColor(usedColors))
  const [error, setError] = useState('')

  async function create() {
    setError('')
    const existing = await findCategoryByName(name)
    if (existing) {
      onDone(existing.id!)
      return
    }
    const result = await saveCategory({ name, color })
    if (result.ok) onDone(result.id)
    else setError(result.error)
  }

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            create()
          }
        }}
        placeholder="Nombre de la nueva categoría"
        className="mb-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      <div className="mb-2 flex flex-wrap gap-1">
        {CATEGORY_COLORS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-stone-800' : 'border-transparent'}`}
            aria-label={c}
          />
        ))}
      </div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={create}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          Crear y usar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
