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
    <div className={`flex justify-between gap-2 ${strong ? 'text-[15px] font-bold' : ''}`}>
      <span className={indent ? 'pl-3' : ''}>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  )
}

const Divider = () => <div className="my-2 border-t border-dashed border-black" />

// Ancho máximo de 72 mm (área imprimible de papel de 80 mm); en papel de 58 mm se ajusta solo.
export default function Ticket({ sale }: { sale: Sale }) {
  const change = saleChange(sale)

  return (
    <div className="mx-auto w-full max-w-[72mm] bg-white p-3 text-[12px] leading-snug text-black tabular-nums">
      <img src={logo} alt="Glam Carpe" className="mx-auto mb-1 w-32" />
      <p className="text-center text-[10px] tracking-wide uppercase">Más que productos, tu estilo.</p>
      <Divider />
      <Row label={`Venta #${sale.id}`} value={formatDateTime(sale.date)} />
      <Divider />
      {sale.items.map((item) => (
        <div key={item.productId} className="mb-1">
          <p>
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
          <span className="text-[10px] font-normal">{formatDateTime(sale.cancelledAt)}</span>
        </p>
      )}
      <p className="text-center">¡Gracias por tu compra!</p>
    </div>
  )
}
