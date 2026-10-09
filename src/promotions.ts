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
 * Calcula el total del carrito aplicando promociones de "lleva N y paga P" y
 * de "2da unidad con descuento". Las promociones mezclan productos (si varios
 * productos están marcados en la misma promoción, sus unidades se agrupan
 * juntas; los productos no marcados —p. ej. otra marca— quedan al precio
 * normal). Cada unidad solo se usa en una promoción, en el orden en que
 * vienen en `promotions`.
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

  const activePromotions = promotions.filter((p) => {
    if (!p.active || p.productIds.length === 0) return false
    if ((p.kind ?? 'bundle') === 'secondUnitDiscount') {
      return (p.secondUnitDiscountPercent ?? 0) > 0
    }
    return (p.bundleQuantity ?? 0) > 1
  })

  for (const promo of activePromotions) {
    const eligible = new Set(promo.productIds)
    const available = units.filter((u) => !u.used && eligible.has(u.productId))
    // Las unidades más caras entran primero al grupo, para que el descuento
    // beneficie al cliente con los artículos de mayor precio.
    available.sort((a, b) => b.price - a.price)

    if ((promo.kind ?? 'bundle') === 'secondUnitDiscount') {
      const pairs = Math.floor(available.length / 2)
      if (pairs <= 0) continue
      const unitsToUse = available.slice(0, pairs * 2)
      let promoDiscount = 0
      for (let i = 0; i < pairs; i++) {
        // La más barata de cada par (la segunda, tras ordenar descendente) recibe el descuento.
        promoDiscount += unitsToUse[i * 2 + 1].price * (promo.secondUnitDiscountPercent! / 100)
      }
      if (promoDiscount <= 0) continue

      unitsToUse.forEach((u) => {
        u.used = true
      })
      discount += promoDiscount
      applied.push({
        promotionId: promo.id!,
        name: promo.name,
        groups: pairs,
        unitsUsed: unitsToUse.length,
        discount: promoDiscount,
      })
      continue
    }

    const groups = Math.floor(available.length / promo.bundleQuantity!)
    if (groups <= 0) continue

    const unitsToUse = available.slice(0, groups * promo.bundleQuantity!)
    const normalPrice = unitsToUse.reduce((sum, u) => sum + u.price, 0)
    const promoTotal = groups * promo.bundlePrice!
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
