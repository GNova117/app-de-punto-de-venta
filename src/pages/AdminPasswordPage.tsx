import { useState } from 'react'
import { MIN_PIN_LENGTH, setAdminPin, verifyAdminPin } from '../auth'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

export default function AdminPasswordPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmNext, setConfirmNext] = useState('')
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!(await verifyAdminPin(current))) {
      setMessage({ kind: 'error', text: 'La contraseña actual es incorrecta.' })
      return
    }
    if (next.length < MIN_PIN_LENGTH) {
      setMessage({
        kind: 'error',
        text: `La nueva contraseña debe tener al menos ${MIN_PIN_LENGTH} caracteres.`,
      })
      return
    }
    if (next !== confirmNext) {
      setMessage({ kind: 'error', text: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    await setAdminPin(next)
    setCurrent('')
    setNext('')
    setConfirmNext('')
    setMessage({ kind: 'ok', text: 'Contraseña actualizada.' })
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Cambiar contraseña</h1>
      <p className="mb-6 text-sm text-gray-500">
        Cámbiala si alguien más la conoce. La sesión de administración se cierra sola tras 10
        minutos sin usarla.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Contraseña actual</label>
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nueva contraseña</label>
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Repite la nueva contraseña
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmNext}
            onChange={(e) => setConfirmNext(e.target.value)}
            className={inputClass}
          />
        </div>
        {message && (
          <p className={`text-sm ${message.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          className="rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Guardar contraseña
        </button>
      </form>
    </div>
  )
}
