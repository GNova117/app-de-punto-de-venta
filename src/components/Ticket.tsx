import logo from '../assets/logo-glam-carpe.png'
import { PAYMENT_LABELS, saleChange, saleSubtotal } from '../ticket'
import type { Sale } from '../types'
import { formatDateTime, formatMoney } from '../utils/format'

function Row({
  label,
  value,
  strong,
  indent,
}: {
  label: string
  value: string
  strong?: boolean
  indent?: boolean
}) {
  return (
    <div className={`flex justify-between gap-1 ${strong ? 'text-[12px] font-bold' : ''}`}>
      <span className={`min-w-0 break-words ${indent ? 'pl-2' : ''}`}>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  )
}

const Divider = () => <div className="my-1.5 border-t border-dashed border-black" />

// Diseñado para impresora térmica de 58 mm: 40 mm de ancho útil (margen de sobra: muchas POS-58 recortan los bordes).
export default function Ticket({ sale }: { sale: Sale }) {
  const change = saleChange(sale)

  return (
    <div className="mx-auto w-[40mm] max-w-full bg-white text-[10px] leading-snug text-black tabular-nums">
      <img src={logo} alt="Glam Carpe" className="mx-auto mb-1 w-20" />
      <p className="text-center text-[8px] tracking-wide uppercase">Más que productos, tu estilo.</p>
      <Divider />
      <p className="font-bold">Venta #{sale.id}</p>
      <p>{formatDateTime(sale.date)}</p>
      <Divider />
      {sale.items.map((item) => (
        <div key={item.productId} className="mb-1">
          <p className="break-words">
            {item.quantity} × {item.name}
          </p>
          <Row
            label={`${formatMoney(item.price)} c/u`}
            value={formatMoney(item.price * item.quantity)}
            indent
          />
        </div>
      ))}
      <Divider />
      {sale.discount > 0 && (
        <>
          <Row label="Subtotal" value={formatMoney(saleSubtotal(sale))} />
          {sale.appliedPromotions.map((promo) => (
            <Row key={promo.promotionId} label={promo.name} value={`-${formatMoney(promo.discount)}`} />
          ))}
        </>
      )}
      <Row label="TOTAL" value={formatMoney(sale.total)} strong />
      <Row label="Pago" value={PAYMENT_LABELS[sale.paymentMethod]} />
      {sale.paymentMethod === 'mixto' && (
        <>
          <Row label="Efectivo" value={formatMoney(sale.cashAmount)} indent />
          <Row label="Transferencia" value={formatMoney(sale.transferAmount)} indent />
        </>
      )}
      {change != null && (
        <>
          <Row label="Recibido" value={formatMoney(sale.cashReceived!)} />
          <Row label="Cambio" value={formatMoney(change)} />
        </>
      )}
      <Divider />
      {sale.cancelledAt && (
        <p className="mb-2 border border-black p-1 text-center font-bold">
          VENTA CANCELADA
          <br />
          <span className="text-[8px] font-normal">{formatDateTime(sale.cancelledAt)}</span>
        </p>
      )}
      <p className="text-center">¡Gracias por tu compra!</p>
    </div>
  )
}
