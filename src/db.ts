import Dexie, { type Table } from 'dexie'
import { summarizeSales } from './cutoffSummary'
import type { CashCutoff, Category, Product, Promotion, Sale, StockMovement } from './types'
import { parseLocalDate } from './utils/format'

class PosDatabase extends Dexie {
  categories!: Table<Category, number>
  products!: Table<Product, number>
  stockMovements!: Table<StockMovement, number>
  sales!: Table<Sale, number>
  promotions!: Table<Promotion, number>
  cashCutoffs!: Table<CashCutoff, number>

  constructor() {
    super('pos-db')
    this.version(1).stores({
      categories: '++id, name',
      products: '++id, barcode, categoryId, name',
      stockMovements: '++id, productId, type, date',
      sales: '++id, date, paymentMethod',
    })
    this.version(2).stores({
      categories: '++id, name',
      products: '++id, barcode, categoryId, name',
      stockMovements: '++id, productId, type, date',
      sales: '++id, date, paymentMethod',
      promotions: '++id',
      cashCutoffs: '++id, &date',
    })
    // Los cortes cerrados antes de esta versión pudieron guardar los totales del día anterior.
    this.version(3)
      .stores({
        categories: '++id, name',
        products: '++id, barcode, categoryId, name',
        stockMovements: '++id, productId, type, date',
        sales: '++id, date, paymentMethod',
        promotions: '++id',
        cashCutoffs: '++id, &date',
      })
      .upgrade((tx) => recomputeCutoffs(tx.table('sales'), tx.table('cashCutoffs')))
    this.version(4).stores({
      categories: '++id, name',
      products: '++id, barcode, categoryId, name',
      stockMovements: '++id, productId, type, date',
      sales: '++id, date, paymentMethod, cancelledAt',
      promotions: '++id',
      cashCutoffs: '++id, &date',
    })
  }
}

export async function recomputeCutoffs(
  sales: Table<Sale, number>,
  cashCutoffs: Table<CashCutoff, number>,
): Promise<void> {
  for (const cutoff of await cashCutoffs.toArray()) {
    const { start, end } = todayRange(cutoff.date)
    const summary = summarizeSales(await sales.where('date').between(start, end, true, true).toArray())
    await cashCutoffs.update(cutoff.id!, {
      totalCash: summary.totalCash,
      totalTransfer: summary.totalTransfer,
      total: summary.total,
      totalCost: summary.totalCost,
      totalProfit: summary.totalProfit,
      salesCount: summary.count,
    })
  }
}

export const db = new PosDatabase()

const DEFAULT_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: 'Ropa', color: '#2563eb' },
  { name: 'Cosméticos', color: '#db2777' },
  { name: 'Gorras', color: '#16a34a' },
  { name: 'Accesorios', color: '#d97706' },
  { name: 'Calzado', color: '#7c3aed' },
]

export async function seedDatabase() {
  await db.transaction('rw', db.categories, async () => {
    const count = await db.categories.count()
    if (count === 0) {
      const now = new Date().toISOString()
      await db.categories.bulkAdd(
        DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: now })),
      )
    }
  })
}

export function todayRange(dateStr?: string) {
  const base = dateStr ? parseLocalDate(dateStr) : new Date()
  const start = new Date(base)
  start.setHours(0, 0, 0, 0)
  const end = new Date(base)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}
