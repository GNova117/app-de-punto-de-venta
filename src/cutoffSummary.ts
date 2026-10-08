import type { Sale } from './types'

function saleCost(sale: Sale): number {
  return sale.items.reduce((sum, it) => sum + (it.cost ?? 0) * it.quantity, 0)
}

const sum = (sales: Sale[], pick: (s: Sale) => number) => sales.reduce((acc, s) => acc + pick(s), 0)

/**
 * Totales de caja de un día: las ventas hechas ese día menos las devoluciones (ventas
 * canceladas ese día, sin importar cuándo se vendieron). Así un corte ya cerrado no cambia
 * si después se cancela una de sus ventas.
 */
export function summarizeSales(sales: Sale[], refunds: Sale[] = []) {
  const totalCash = sum(sales, (s) => s.cashAmount) - sum(refunds, (s) => s.cashAmount)
  const totalTransfer = sum(sales, (s) => s.transferAmount) - sum(refunds, (s) => s.transferAmount)
  const total = totalCash + totalTransfer
  const totalCost = sum(sales, saleCost) - sum(refunds, saleCost)
  return {
    totalCash,
    totalTransfer,
    total,
    totalCost,
    totalDiscount: sum(sales, (s) => s.discount ?? 0) - sum(refunds, (s) => s.discount ?? 0),
    totalProfit: total - totalCost,
    count: sales.length,
    refundsCount: refunds.length,
    refundsTotal: sum(refunds, (s) => s.total),
  }
}
