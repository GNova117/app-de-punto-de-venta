export function formatMoney(amount: number): string {
  return amount.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/** "YYYY-MM-DD" como fecha local: `new Date()` lo toma como UTC y en México cae en el día anterior. */
export function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value)
}

export function formatDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('es-MX', {
    dateStyle: 'full',
  })
}

export function todayInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}
