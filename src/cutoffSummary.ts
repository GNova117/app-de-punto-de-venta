import type { Sale } from './types'

function saleCost(sale: Sale): number {
  return sale.items.reduce((sum, it) => sum + (it.cost ?? 0) * it.quantity, 0)
}

const sum = (sales: Sale[], pick: (s: Sale) => number) => sales.reduce((acc, s) => acc + pick(s), 0)

export interface CostBreakdownRow {
  productId: number
  name: string
  quantity: number
  unitCost: number
  totalCost: number
}

/**
 * Desglose por producto del "costo de lo vendido", con el mismo criterio que
 * `totalCost` (ventas del período menos devoluciones), para poder ver de qué
 * productos viene el total.
 */
function costBreakdown(sales: Sale[], refunds: Sale[]): CostBreakdownRow[] {
  const rows = new Map<number, CostBreakdownRow>()
  const apply = (saleList: Sale[], sign: 1 | -1) => {
    for (const sale of saleList) {
      for (const it of sale.items) {
        const unitCost = it.cost ?? 0
        const row = rows.get(it.productId) ?? {
          productId: it.productId,
          name: it.name,
          quantity: 0,
          unitCost,
          totalCost: 0,
        }
        row.quantity += sign * it.quantity
        row.totalCost += sign * unitCost * it.quantity
        row.unitCost = unitCost
        rows.set(it.productId, row)
      }
    }
  }
  apply(sales, 1)
  apply(refunds, -1)
  return Array.from(rows.values())
    .filter((r) => r.quantity !== 0 || r.totalCost !== 0)
    .sort((a, b) => b.totalCost - a.totalCost)
}

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
    costBreakdown: costBreakdown(sales, refunds),
  }
}
