import Dexie, { type Table } from 'dexie'
import type { Category, Product, Sale, StockMovement } from './types'

class PosDatabase extends Dexie {
  categories!: Table<Category, number>
  products!: Table<Product, number>
  stockMovements!: Table<StockMovement, number>
  sales!: Table<Sale, number>

  constructor() {
    super('pos-db')
    this.version(1).stores({
      categories: '++id, name',
      products: '++id, barcode, categoryId, name',
      stockMovements: '++id, productId, type, date',
      sales: '++id, date, paymentMethod',
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
  const base = dateStr ? new Date(dateStr) : new Date()
  const start = new Date(base)
  start.setHours(0, 0, 0, 0)
  const end = new Date(base)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}
