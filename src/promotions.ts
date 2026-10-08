import type { AppliedPromotion, Promotion } from './types'

export interface PricingLine {
  productId: number
  price: number
  quantity: number
}

export interface CartPricing {
  subtotal: number
  discount: number
  total: number
  applied: AppliedPromotion[]
}

/**
 * Calcula el total del carrito aplicando promociones de "lleva N y paga P".
 * Las promociones mezclan productos (si varios productos están marcados en la
 * misma promoción, sus unidades se agrupan juntas). Cada unidad solo se usa en
 * una promoción, en el orden en que vienen en `promotions`.
 */
export function computeCartPricing(lines: PricingLine[], promotions: Promotion[]): CartPricing {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)

  const units: Array<{ productId: number; price: number; used: boolean }> = []
  for (const line of lines) {
    for (let i = 0; i < line.quantity; i++) {
      units.push({ productId: line.productId, price: line.price, used: false })
    }
  }

  const applied: AppliedPromotion[] = []
  let discount = 0

  const activePromotions = promotions.filter(
    (p) => p.active && p.bundleQuantity > 1 && p.productIds.length > 0,
  )

  for (const promo of activePromotions) {
    const eligible = new Set(promo.productIds)
    const available = units.filter((u) => !u.used && eligible.has(u.productId))
    const groups = Math.floor(available.length / promo.bundleQuantity)
    if (groups <= 0) continue

    // Las unidades más caras entran primero al grupo, para que el descuento
    // beneficie al cliente con los artículos de mayor precio.
    available.sort((a, b) => b.price - a.price)
    const unitsToUse = available.slice(0, groups * promo.bundleQuantity)
    const normalPrice = unitsToUse.reduce((sum, u) => sum + u.price, 0)
    const promoTotal = groups * promo.bundlePrice
    const promoDiscount = normalPrice - promoTotal
    if (promoDiscount <= 0) continue

    unitsToUse.forEach((u) => {
      u.used = true
    })
    discount += promoDiscount
    applied.push({
      promotionId: promo.id!,
      name: promo.name,
      groups,
      unitsUsed: unitsToUse.length,
      discount: promoDiscount,
    })
  }

  const total = Math.max(0, subtotal - discount)
  return { subtotal, discount, total, applied }
}
