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
  /** Efectivo que entregó el cliente (solo pago en efectivo), para mostrar el cambio en el ticket. */
  cashReceived?: number
  /** Si se canceló: cuándo. La devolución cuenta en el corte de ese día, no en el de la venta. */
  cancelledAt?: string
  cancelReason?: string
}

// ---------- Promociones ----------

/**
 * 'bundle': "lleva N y paga P" (ver `bundleQuantity`/`bundlePrice`).
 * 'secondUnitDiscount': por cada 2 unidades elegibles, la más barata de cada
 * par se cobra con `secondUnitDiscountPercent`% de descuento (100% = gratis).
 */
export type PromotionKind = 'bundle' | 'secondUnitDiscount'

/**
 * Promoción de descuento. `productIds` define qué productos entran: solo esos
 * productos (p. ej. una marca específica) se ven afectados, el resto conserva
 * su precio normal aunque sean del mismo tipo de artículo.
 */
export interface Promotion {
  id?: number
  name: string
  productIds: number[]
  /** Si falta (promociones guardadas antes de este campo), se trata como 'bundle'. */
  kind?: PromotionKind
  /** Solo para kind 'bundle'. */
  bundleQuantity?: number
  bundlePrice?: number
  /** Solo para kind 'secondUnitDiscount'. De 1 a 100. */
  secondUnitDiscountPercent?: number
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
