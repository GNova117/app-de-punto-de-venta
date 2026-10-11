import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { db } from '../db'
import { saleChange, ticketText, whatsappUrl } from '../ticket'
import { formatMoney } from '../utils/format'
import Ticket from './Ticket'

interface Props {
  saleId: number
  heading: string
  closeLabel: string
  onClose: () => void
}

const PRINT_CLASS = 'printing-ticket'

export default function TicketDialog({ saleId, heading, closeLabel, onClose }: Props) {
  const sale = useLiveQuery(() => db.sales.get(saleId), [saleId])
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => () => document.body.classList.remove(PRINT_CLASS), [])

  function printTicket() {
    // El CSS de impresión oculta toda la app y deja solo #ticket-print-root.
    document.body.classList.add(PRINT_CLASS)
    window.addEventListener('afterprint', () => document.body.classList.remove(PRINT_CLASS), {
      once: true,
    })
    window.print()
  }

  function sendWhatsapp() {
    if (!sale) return
    setError('')
    const url = whatsappUrl(ticketText(sale), phone)
    if (!url) {
      setError('Escribe el número a 10 dígitos (o déjalo vacío para elegir el contacto).')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const change = sale ? saleChange(sale) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-xl bg-white p-5 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-stone-800">{heading}</h3>
        {change != null && change > 0 && (
          <p className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-center text-green-800">
            Cambio: <strong className="text-xl">{formatMoney(change)}</strong>
          </p>
        )}

        <div className="mb-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-100 p-2">
          {sale && <Ticket sale={sale} />}
        </div>

        <label className="mb-1 block text-xs font-medium text-stone-600">
          WhatsApp del cliente (opcional)
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10 dígitos"
          className="mb-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

        <div className="mb-2 grid grid-cols-2 gap-2">
          <button
            onClick={printTicket}
            disabled={!sale}
            className="rounded-lg border border-stone-300 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={sendWhatsapp}
            disabled={!sale}
            className="rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            📲 WhatsApp
          </button>
        </div>
        <button
          autoFocus
          onClick={onClose}
          className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {closeLabel}
        </button>
      </div>

      {sale &&
        createPortal(
          <div id="ticket-print-root">
            <Ticket sale={sale} />
          </div>,
          document.body,
        )}
    </div>
  )
}
