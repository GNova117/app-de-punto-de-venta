import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import {
  downloadBackup,
  isStoragePersisted,
  parseBackup,
  restoreBackup,
  useLastBackupAt,
  type BackupFile,
} from '../backup'
import { db } from '../db'
import { formatDateTime } from '../utils/format'

export default function BackupPage() {
  const counts = useLiveQuery(async () => {
    const [categories, products, sales, movements] = await Promise.all([
      db.categories.count(),
      db.products.count(),
      db.sales.count(),
      db.stockMovements.count(),
    ])
    return { categories, products, sales, movements }
  }, [])

  const lastBackupAt = useLastBackupAt()
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [downloadMsg, setDownloadMsg] = useState<Message | null>(null)
  const [restoreMsg, setRestoreMsg] = useState<Message | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    isStoragePersisted().then(setPersisted)
  }, [])

  async function handleDownload() {
    setDownloadMsg(null)
    setDownloading(true)
    try {
      await downloadBackup()
      setDownloadMsg({
        kind: 'ok',
        text: 'Respaldo descargado. Guárdalo fuera de este dispositivo (Drive, correo o WhatsApp).',
      })
    } catch {
      setDownloadMsg({ kind: 'error', text: 'No se pudo generar el respaldo. Intenta de nuevo.' })
    } finally {
      setDownloading(false)
    }
  }

  async function handleFile(file: File | undefined) {
    setRestoreMsg(null)
    setPending(null)
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) {
      setRestoreMsg({ kind: 'error', text: result.error })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setPending(result.backup)
  }

  async function handleRestore() {
    if (!pending) return
    setRestoring(true)
    try {
      await restoreBackup(pending)
      setRestoreMsg({ kind: 'ok', text: 'Datos restaurados correctamente.' })
      setPending(null)
    } catch {
      setRestoreMsg({
        kind: 'error',
        text: 'No se pudo restaurar el respaldo. Tus datos actuales no se modificaron.',
      })
    } finally {
      setRestoring(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function cancelRestore() {
    setPending(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Respaldo de datos</h1>
      <p className="mb-6 text-sm text-gray-500">
        Tus productos y ventas se guardan solo en este dispositivo. Descarga un respaldo
        seguido (lo ideal es al hacer el corte del día) y guárdalo en otro lugar, como Google
        Drive, tu correo o WhatsApp.
      </p>

      {persisted === false && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ Este navegador podría borrar los datos de la app si el dispositivo se queda sin
          espacio. Instalar la app ("Instalar aplicación" en el navegador) ayuda a protegerlos,
          pero de todos modos descarga respaldos seguido.
        </div>
      )}

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Descargar respaldo</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Categorías" value={counts?.categories} />
          <Stat label="Productos" value={counts?.products} />
          <Stat label="Ventas" value={counts?.sales} />
          <Stat label="Movimientos" value={counts?.movements} />
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Último respaldo:{' '}
          <strong>{lastBackupAt ? formatDateTime(lastBackupAt) : 'nunca'}</strong>
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {downloading ? 'Generando...' : '⬇️ Descargar respaldo'}
        </button>
        <StatusMessage message={downloadMsg} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Restaurar respaldo</h2>
        <p className="mb-4 text-sm text-gray-500">
          Úsalo si cambias de dispositivo o si se perdieron los datos. Esto{' '}
          <strong>reemplaza todos los datos actuales</strong> de este dispositivo por los del
          archivo.
        </p>
        {/* Sin `accept`: en algunos Android los .json quedan deshabilitados en el selector. */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {!pending && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
          >
            📂 Elegir archivo de respaldo
          </button>
        )}

        {pending && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="mb-2 text-sm font-medium text-gray-800">
              Respaldo del {formatDateTime(pending.exportedAt)}
            </p>
            <p className="mb-4 text-sm text-gray-600">
              Contiene {pending.data.categories.length} categoría(s),{' '}
              {pending.data.products.length} producto(s), {pending.data.sales.length} venta(s) y{' '}
              {pending.data.stockMovements.length} movimiento(s). Se borrarán los datos que tienes
              ahora en este dispositivo.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {restoring ? 'Restaurando...' : 'Reemplazar mis datos con este respaldo'}
              </button>
              <button
                onClick={cancelRestore}
                disabled={restoring}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        <StatusMessage message={restoreMsg} />
      </section>
    </div>
  )
}

interface Message {
  kind: 'ok' | 'error'
  text: string
}

function StatusMessage({ message }: { message: Message | null }) {
  if (!message) return null
  return (
    <p className={`mt-3 text-sm ${message.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
      {message.text}
    </p>
  )
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <p className="text-xl font-bold text-gray-800">{value ?? '–'}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
