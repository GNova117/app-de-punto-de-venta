import { db, todayRange } from './db'
import type {
  Category,
  MovementType,
  PaymentMethod,
  Product,
  Sale,
  SaleItem,
  StockMovement,
} from './types'

// ---------- Categorías ----------

export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('name').toArray()
}

export async function createCategory(name: string, color: string): Promise<number> {
  const id = await db.categories.add({
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
  })
  return id as number
}

export async function updateCategory(id: number, changes: Partial<Category>): Promise<void> {
  await db.categories.update(id, changes)
}

export async function deleteCategory(id: number): Promise<{ ok: boolean; reason?: string }> {
  const inUse = await db.products.where('categoryId').equals(id).count()
  if (inUse > 0) {
    return { ok: false, reason: `Hay ${inUse} producto(s) usando esta categoría.` }
  }
  await db.categories.delete(id)
  return { ok: true }
}

// ---------- Productos ----------

export async function listProducts(): Promise<Product[]> {
  return db.products.orderBy('name').toArray()
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  return db.products.where('barcode').equals(barcode).first()
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const now = new Date().toISOString()
  const id = await db.products.add({
    ...data,
    createdAt: now,
    updatedAt: now,
  })
  if (data.stock > 0) {
    await db.stockMovements.add({
      productId: id as number,
      type: 'entrada',
      quantity: data.stock,
      reason: 'Alta inicial',
      date: now,
    })
  }
  return id as number
}

export async function updateProduct(id: number, changes: Partial<Product>): Promise<void> {
  await db.products.update(id, { ...changes, updatedAt: new Date().toISOString() })
}

export async function deleteProduct(id: number): Promise<void> {
  await db.products.delete(id)
  await db.stockMovements.where('productId').equals(id).delete()
}

// ---------- Movimientos de stock (entradas / salidas) ----------

export async function registerStockMovement(input: {
  productId: number
  type: MovementType
  quantity: number
  reason: string
  note?: string
}): Promise<{ ok: boolean; error?: string }> {
  const product = await db.products.get(input.productId)
  if (!product) return { ok: false, error: 'Producto no encontrado' }

  if (input.type === 'salida' && product.stock < input.quantity) {
    return { ok: false, error: 'No hay suficiente stock disponible' }
  }

  const newStock =
    input.type === 'entrada' ? product.stock + input.quantity : product.stock - input.quantity

  await db.transaction('rw', db.products, db.stockMovements, async () => {
    await db.products.update(input.productId, {
      stock: newStock,
      updatedAt: new Date().toISOString(),
    })
    await db.stockMovements.add({
      productId: input.productId,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
      note: input.note,
      date: new Date().toISOString(),
    })
  })

  return { ok: true }
}

export async function listStockMovements(): Promise<Array<StockMovement & { product?: Product }>> {
  const movements = await db.stockMovements.orderBy('date').reverse().toArray()
  const products = await db.products.toArray()
  const byId = new Map(products.map((p) => [p.id, p]))
  return movements.map((m) => ({ ...m, product: byId.get(m.productId) }))
}

// ---------- Ventas ----------

export async function createSale(input: {
  items: SaleItem[]
  paymentMethod: PaymentMethod
  cashAmount: number
  transferAmount: number
}): Promise<{ ok: boolean; error?: string; saleId?: number }> {
  if (input.items.length === 0) {
    return { ok: false, error: 'El carrito está vacío' }
  }

  const total = input.items.reduce((sum, it) => sum + it.price * it.quantity, 0)

  // Validar stock disponible
  for (const item of input.items) {
    const product = await db.products.get(item.productId)
    if (!product || product.stock < item.quantity) {
      return { ok: false, error: `Stock insuficiente para "${item.name}"` }
    }
  }

  let saleId = 0
  await db.transaction('rw', db.products, db.stockMovements, db.sales, async () => {
    const now = new Date().toISOString()
    saleId = (await db.sales.add({
      date: now,
      items: input.items,
      total,
      paymentMethod: input.paymentMethod,
      cashAmount: input.cashAmount,
      transferAmount: input.transferAmount,
    })) as number

    for (const item of input.items) {
      const product = await db.products.get(item.productId)
      if (!product) continue
      await db.products.update(item.productId, {
        stock: product.stock - item.quantity,
        updatedAt: now,
      })
      await db.stockMovements.add({
        productId: item.productId,
        type: 'salida',
        quantity: item.quantity,
        reason: 'Venta',
        note: `Venta #${saleId}`,
        date: now,
      })
    }
  })

  return { ok: true, saleId }
}

export async function listSalesByDate(dateStr?: string): Promise<Sale[]> {
  const { start, end } = todayRange(dateStr)
  return db.sales
    .where('date')
    .between(start, end, true, true)
    .reverse()
    .sortBy('date')
}

export async function getDailyCutoff(dateStr?: string) {
  const sales = await listSalesByDate(dateStr)
  const totalCash = sales.reduce((sum, s) => sum + s.cashAmount, 0)
  const totalTransfer = sales.reduce((sum, s) => sum + s.transferAmount, 0)
  const total = totalCash + totalTransfer
  return {
    date: dateStr ?? new Date().toISOString(),
    sales,
    totalCash,
    totalTransfer,
    total,
    count: sales.length,
  }
}
