import type { Sale } from './types'
import { formatDateTime, formatMoney } from './utils/format'

export const PAYMENT_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mixto: 'Mixto',
}

export function saleSubtotal(sale: Sale): number {
  return sale.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
}

export function saleChange(sale: Sale): number | null {
  if (sale.paymentMethod !== 'efectivo' || sale.cashReceived == null) return null
  return Math.max(0, sale.cashReceived - sale.total)
}

export function ticketText(sale: Sale): string {
  const lines = [
    '*Glam Carpe*',
    'Más que productos, tu estilo.',
    '',
    `Venta #${sale.id} · ${formatDateTime(sale.date)}`,
    '',
    ...sale.items.map((it) => `${it.quantity} x ${it.name} — ${formatMoney(it.price * it.quantity)}`),
    '',
  ]
  if (sale.discount > 0) {
    lines.push(`Subtotal: ${formatMoney(saleSubtotal(sale))}`)
    for (const promo of sale.appliedPromotions) {
      lines.push(`${promo.name}: -${formatMoney(promo.discount)}`)
    }
  }
  lines.push(`*Total: ${formatMoney(sale.total)}*`, `Pago: ${PAYMENT_LABELS[sale.paymentMethod]}`)
  if (sale.paymentMethod === 'mixto') {
    lines.push(
      `Efectivo: ${formatMoney(sale.cashAmount)} · Transferencia: ${formatMoney(sale.transferAmount)}`,
    )
  }
  const change = saleChange(sale)
  if (change != null) {
    lines.push(`Recibido: ${formatMoney(sale.cashReceived!)} · Cambio: ${formatMoney(change)}`)
  }
  if (sale.cancelledAt) lines.push('', `*VENTA CANCELADA* (${formatDateTime(sale.cancelledAt)})`)
  lines.push('', '¡Gracias por tu compra!')
  return lines.join('\n')
}

/** Sin número abre WhatsApp para elegir el contacto; 10 dígitos se toman como número de México. */
export function whatsappUrl(text: string, phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  const query = `?text=${encodeURIComponent(text)}`
  if (!digits) return `https://wa.me/${query}`
  if (digits.length === 10) return `https://wa.me/52${digits}${query}`
  if (digits.length >= 11 && digits.length <= 15) return `https://wa.me/${digits}${query}`
  return null
}
