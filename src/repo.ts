import { summarizeSales } from './cutoffSummary'
import { db, todayRange } from './db'
import type {
  AppliedPromotion,
  CashCutoff,
  Category,
  MovementType,
  PaymentMethod,
  Product,
  Promotion,
  Sale,
  SaleItem,
  StockMovement,
} from './types'

// ---------- Categorías ----------

export async function listCategories(): Promise<Category[]> {
  return db.categories.orderBy('name').toArray()
}

export async function findCategoryByName(name: string): Promise<Category | undefined> {
  return db.categories.where('name').equalsIgnoreCase(name.trim()).first()
}

type SaveCategoryResult = { ok: true; id: number } | { ok: false; error: string }

export async function saveCategory(input: {
  id?: number
  name: string
  color: string
}): Promise<SaveCategoryResult> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'El nombre de la categoría es obligatorio' }

  const existing = await findCategoryByName(name)
  if (existing && existing.id !== input.id) {
    return { ok: false, error: `Ya existe la categoría "${existing.name}".` }
  }

  if (input.id) {
    await db.categories.update(input.id, { name, color: input.color })
    return { ok: true, id: input.id }
  }
  const id = await db.categories.add({ name, color: input.color, createdAt: new Date().toISOString() })
  return { ok: true, id: id as number }
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
  discount?: number
  appliedPromotions?: AppliedPromotion[]
}): Promise<{ ok: boolean; error?: string; saleId?: number }> {
  if (input.items.length === 0) {
    return { ok: false, error: 'El carrito está vacío' }
  }

  const subtotal = input.items.reduce((sum, it) => sum + it.price * it.quantity, 0)
  const discount = input.discount ?? 0
  const total = Math.max(0, subtotal - discount)

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
      discount,
      appliedPromotions: input.appliedPromotions ?? [],
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
  return {
    date: dateStr ?? new Date().toISOString(),
    sales,
    ...summarizeSales(sales),
  }
}

// ---------- Corte de caja (cierre persistido) ----------

export async function getCashCutoffByDate(dateStr: string): Promise<CashCutoff | undefined> {
  return db.cashCutoffs.where('date').equals(dateStr).first()
}

export async function listCashCutoffs(): Promise<CashCutoff[]> {
  return db.cashCutoffs.orderBy('date').reverse().toArray()
}

export async function closeCashCutoff(
  dateStr: string,
): Promise<{ ok: true; cutoff: CashCutoff } | { ok: false; error: string }> {
  const existing = await getCashCutoffByDate(dateStr)
  if (existing) {
    return { ok: false, error: 'Este día ya tiene un corte cerrado.' }
  }

  const summary = await getDailyCutoff(dateStr)
  if (summary.count === 0) {
    return { ok: false, error: 'No hay ventas registradas en esta fecha para cerrar el corte.' }
  }

  const record: Omit<CashCutoff, 'id'> = {
    date: dateStr,
    closedAt: new Date().toISOString(),
    totalCash: summary.totalCash,
    totalTransfer: summary.totalTransfer,
    total: summary.total,
    totalCost: summary.totalCost,
    totalProfit: summary.totalProfit,
    salesCount: summary.count,
  }

  let id = 0
  try {
    id = (await db.cashCutoffs.add(record)) as number
  } catch {
    return { ok: false, error: 'Este día ya tiene un corte cerrado.' }
  }
  return { ok: true, cutoff: { ...record, id } }
}

// ---------- Promociones ----------

export async function listPromotions(): Promise<Promotion[]> {
  return db.promotions.orderBy('id').toArray()
}

export async function savePromotion(input: {
  id?: number
  name: string
  productIds: number[]
  bundleQuantity: number
  bundlePrice: number
  active: boolean
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const name = input.name.trim()
  if (!name) return { ok: false, error: 'El nombre de la promoción es obligatorio' }
  if (input.productIds.length === 0) {
    return { ok: false, error: 'Selecciona al menos un producto para la promoción' }
  }
  if (!Number.isInteger(input.bundleQuantity) || input.bundleQuantity < 2) {
    return { ok: false, error: 'La cantidad de la promoción debe ser un entero de al menos 2' }
  }
  if (!(input.bundlePrice >= 0)) {
    return { ok: false, error: 'El precio de la promoción no es válido' }
  }

  const now = new Date().toISOString()
  if (input.id) {
    await db.promotions.update(input.id, {
      name,
      productIds: input.productIds,
      bundleQuantity: input.bundleQuantity,
      bundlePrice: input.bundlePrice,
      active: input.active,
      updatedAt: now,
    })
    return { ok: true, id: input.id }
  }

  const id = await db.promotions.add({
    name,
    productIds: input.productIds,
    bundleQuantity: input.bundleQuantity,
    bundlePrice: input.bundlePrice,
    active: input.active,
    createdAt: now,
    updatedAt: now,
  })
  return { ok: true, id: id as number }
}

export async function deletePromotion(id: number): Promise<void> {
  await db.promotions.delete(id)
}

// ---------- Ganancias ----------

export interface ProductProfitSummary {
  productId: number
  name: string
  barcode: string
  cost: number
  price: number
  unitProfit: number
  marginPct: number
  stock: number
  stockProfitPotential: number
}

export async function getCatalogProfitSummary(): Promise<ProductProfitSummary[]> {
  const products = await db.products.toArray()
  return products
    .map((p) => {
      const unitProfit = p.price - p.cost
      const marginPct = p.price > 0 ? (unitProfit / p.price) * 100 : 0
      return {
        productId: p.id!,
        name: p.name,
        barcode: p.barcode,
        cost: p.cost,
        price: p.price,
        unitProfit,
        marginPct,
        stock: p.stock,
        stockProfitPotential: unitProfit * p.stock,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export interface SalesProfitRow {
  productId: number
  name: string
  quantitySold: number
  revenue: number
  cost: number
  profit: number
}

export interface SalesProfitReport {
  from: string
  to: string
  rows: SalesProfitRow[]
  totalRevenue: number
  totalCost: number
  totalDiscount: number
  totalProfit: number
  salesCount: number
}

export async function getSalesProfitReport(
  fromDateStr: string,
  toDateStr: string,
): Promise<SalesProfitReport> {
  const { start } = todayRange(fromDateStr)
  const { end } = todayRange(toDateStr)
  const sales = await db.sales.where('date').between(start, end, true, true).toArray()

  const rowsMap = new Map<number, SalesProfitRow>()
  let totalDiscount = 0

  for (const sale of sales) {
    totalDiscount += sale.discount ?? 0
    for (const item of sale.items) {
      const row = rowsMap.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      }
      const revenue = item.price * item.quantity
      const cost = (item.cost ?? 0) * item.quantity
      row.quantitySold += item.quantity
      row.revenue += revenue
      row.cost += cost
      row.profit += revenue - cost
      rowsMap.set(item.productId, row)
    }
  }

  const rows = Array.from(rowsMap.values()).sort((a, b) => b.profit - a.profit)
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalCost = rows.reduce((sum, r) => sum + r.cost, 0)
  const totalProfit = totalRevenue - totalCost

  return {
    from: fromDateStr,
    to: toDateStr,
    rows,
    totalRevenue,
    totalCost,
    totalDiscount,
    totalProfit,
    salesCount: sales.length,
  }
}
