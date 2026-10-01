import { useState } from 'react'
import { useAdmin } from '../admin-session'
import { hasAdminPin, MIN_PIN_LENGTH, setAdminPin, verifyAdminPin } from '../auth'

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

export default function AdminLogin() {
  const { unlock } = useAdmin()
  const [isSetup] = useState(() => !hasAdminPin())
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (isSetup) {
      if (pin.length < MIN_PIN_LENGTH) {
        setError(`La contraseña debe tener al menos ${MIN_PIN_LENGTH} caracteres.`)
        return
      }
      if (pin !== confirmPin) {
        setError('Las contraseñas no coinciden.')
        return
      }
      setBusy(true)
      try {
        await setAdminPin(pin)
        unlock()
      } catch {
        setError('No se pudo guardar la contraseña en este navegador.')
        setBusy(false)
      }
      return
    }

    setBusy(true)
    const ok = await verifyAdminPin(pin)
    setBusy(false)
    if (ok) {
      unlock()
    } else {
      setError('Contraseña incorrecta.')
      setPin('')
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="mb-2 text-center text-3xl">🔒</p>
        <h1 className="mb-1 text-center text-xl font-bold text-gray-800">Administración</h1>

        {isSetup ? (
          <p className="mb-5 text-center text-sm text-gray-500">
            Crea la contraseña de administrador. Solo quien la conozca podrá dar de alta
            productos, categorías y entradas de mercancía. En la caja se podrá vender, ver el
            historial y hacer el corte sin contraseña.
          </p>
        ) : (
          <p className="mb-5 text-center text-sm text-gray-500">
            Ingresa la contraseña para administrar productos, categorías e inventario.
          </p>
        )}

        <label className="mb-1 block text-xs font-medium text-gray-600">
          {isSetup ? 'Nueva contraseña' : 'Contraseña'}
        </label>
        <input
          type="password"
          autoFocus
          autoComplete={isSetup ? 'new-password' : 'current-password'}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={`${inputClass} mb-3`}
        />

        {isSetup && (
          <>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Repite la contraseña
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className={`${inputClass} mb-3`}
            />
            <p className="mb-3 text-xs text-gray-400">
              Mínimo {MIN_PIN_LENGTH} caracteres. Puede ser un PIN de números.
            </p>
          </>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSetup ? 'Crear contraseña y entrar' : 'Entrar'}
        </button>

        {!isSetup && (
          <details className="mt-4 text-xs text-gray-500">
            <summary className="cursor-pointer">¿Olvidaste la contraseña?</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>En Corte del día, descarga un respaldo.</li>
              <li>
                Borra los datos de este sitio en la configuración del navegador (esto borra la
                contraseña y los datos).
              </li>
              <li>Abre la app, entra a Administración y crea una contraseña nueva.</li>
              <li>En Administración → Respaldo, restaura el archivo que descargaste.</li>
            </ol>
          </details>
        )}
      </form>
    </div>
  )
}
