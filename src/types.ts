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
  quantity: number
}

export interface Sale {
  id?: number
  date: string
  items: SaleItem[]
  total: number
  paymentMethod: PaymentMethod
  cashAmount: number
  transferAmount: number
}
