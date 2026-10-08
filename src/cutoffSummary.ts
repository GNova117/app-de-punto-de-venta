import type { Sale } from './types'

export function summarizeSales(sales: Sale[]) {
  const totalCash = sales.reduce((sum, s) => sum + s.cashAmount, 0)
  const totalTransfer = sales.reduce((sum, s) => sum + s.transferAmount, 0)
  const total = totalCash + totalTransfer
  const totalCost = sales.reduce(
    (sum, s) => sum + s.items.reduce((isum, it) => isum + (it.cost ?? 0) * it.quantity, 0),
    0,
  )
  const totalDiscount = sales.reduce((sum, s) => sum + (s.discount ?? 0), 0)
  return {
    totalCash,
    totalTransfer,
    total,
    totalCost,
    totalDiscount,
    totalProfit: total - totalCost,
    count: sales.length,
  }
}
