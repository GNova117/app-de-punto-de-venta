import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { getCashFloat, setCashFloat } from '../repo'
import { formatMoney } from '../utils/format'

export default function CashFloatPage() {
  const current = useLiveQuery(() => getCashFloat())
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (current !== undefined) setAmount(String(current))
  }, [current])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    const value = Number(amount)
    if (Number.isNaN(value) || value < 0) {
      setMessage('Ingresa un monto válido.')
      return
    }
    await setCashFloat(value)
    setMessage('Fondo de caja actualizado.')
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-stone-800">Fondo de caja</h1>
      <p className="mb-6 text-sm text-stone-500">
        Efectivo que se deja en caja para operar el día siguiente (no se cuenta como venta). Se
        mantiene igual día con día hasta que lo cambies aquí. Si el corte de un día ya está
        cerrado, conserva el fondo que tenía al cerrarse.
      </p>
      {current !== undefined && (
        <p className="mb-4 text-sm text-stone-600">
          Fondo actual: <span className="font-semibold text-stone-800">{formatMoney(current)}</span>
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Nuevo monto</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        {message && <p className="text-sm text-green-600">{message}</p>}
        <button
          type="submit"
          className="rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Guardar fondo de caja
        </button>
      </form>
    </div>
  )
}
