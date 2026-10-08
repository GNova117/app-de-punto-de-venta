export interface Category {
  id?: number
  name: string
  color: string
  createdAt: string
}

export interface Product {
  id?: number
  barcode: string
  name: string
  categoryId: number
  price: number
  cost: number
  stock: number
  minStock: number
  imageDataUrl?: string
  createdAt: string
  updatedAt: string
}

export type MovementType = 'entrada' | 'salida'

export interface StockMovement {
  id?: number
  productId: number
  type: MovementType
  quantity: number
  reason: string
  note?: string
  date: string
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'mixto'

export interface SaleItem {
  productId: number
  name: string
  barcode: string
  price: number
  /** Costo del producto al momento de la venta (para calcular ganancias históricas). */
  cost: number
  quantity: number
}

export interface AppliedPromotion {
  promotionId: number
  name: string
  groups: number
  unitsUsed: number
  discount: number
}

export interface Sale {
  id?: number
  date: string
  items: SaleItem[]
  /** Total final cobrado (ya con el descuento de promociones aplicado). */
  total: number
  /** Descuento total aplicado por promociones. */
  discount: number
  appliedPromotions: AppliedPromotion[]
  paymentMethod: PaymentMethod
  cashAmount: number
  transferAmount: number
}

// ---------- Promociones ----------

/**
 * Promoción de "lleva N y paga P": si en el carrito hay al menos `bundleQuantity`
 * unidades de productos marcados en `productIds` (mezclando productos distintos),
 * ese grupo se cobra en `bundlePrice` en lugar de la suma de precios normales.
 */
export interface Promotion {
  id?: number
  name: string
  productIds: number[]
  bundleQuantity: number
  bundlePrice: number
  active: boolean
  createdAt: string
  updatedAt: string
}

// ---------- Corte de caja ----------

export interface CashCutoff {
  id?: number
  /** Fecha del corte en formato YYYY-MM-DD. */
  date: string
  closedAt: string
  totalCash: number
  totalTransfer: number
  total: number
  totalCost: number
  totalProfit: number
  salesCount: number
}
