import { useSyncExternalStore } from 'react'
import { db } from './db'
import type { Category, Product, Sale, StockMovement } from './types'

const APP_ID = 'punto-de-venta'
const LAST_BACKUP_KEY = 'pos:lastBackupAt'
const BACKUP_EVENT = 'pos:backup-done'

export interface BackupData {
  categories: Category[]
  products: Product[]
  stockMovements: StockMovement[]
  sales: Sale[]
}

export interface BackupFile {
  app: typeof APP_ID
  schemaVersion: number
  exportedAt: string
  data: BackupData
}

export async function createBackup(): Promise<BackupFile> {
  const [categories, products, stockMovements, sales] = await Promise.all([
    db.categories.toArray(),
    db.products.toArray(),
    db.stockMovements.toArray(),
    db.sales.toArray(),
  ])
  return {
    app: APP_ID,
    schemaVersion: db.verno,
    exportedAt: new Date().toISOString(),
    data: { categories, products, stockMovements, sales },
  }
}

function backupFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
  return `respaldo-punto-de-venta-${stamp}.json`
}

export async function downloadBackup(): Promise<void> {
  const backup = await createBackup()
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFileName(new Date(backup.exportedAt))
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  markBackupDone(backup.exportedAt)
}

type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string }

const INVALID_FILE = 'El archivo no es un respaldo válido de esta app.'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function everyHas(list: unknown, keys: string[]): boolean {
  return (
    Array.isArray(list) &&
    list.every((item) => isObject(item) && keys.every((key) => item[key] !== undefined))
  )
}

export function parseBackup(text: string): ParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: INVALID_FILE }
  }

  if (!isObject(parsed) || parsed.app !== APP_ID || !isObject(parsed.data)) {
    return { ok: false, error: INVALID_FILE }
  }
  if (typeof parsed.schemaVersion !== 'number' || parsed.schemaVersion > db.verno) {
    return {
      ok: false,
      error: 'Este respaldo es de una versión más nueva de la app. Actualiza la app e intenta de nuevo.',
    }
  }

  const { data } = parsed
  const valid =
    everyHas(data.categories, ['id', 'name', 'color']) &&
    everyHas(data.products, ['id', 'barcode', 'name', 'categoryId', 'price', 'stock']) &&
    everyHas(data.stockMovements, ['id', 'productId', 'type', 'quantity', 'date']) &&
    everyHas(data.sales, ['id', 'date', 'items', 'total', 'cashAmount', 'transferAmount'])
  if (!valid) {
    return { ok: false, error: 'El archivo de respaldo está incompleto o dañado.' }
  }

  return { ok: true, backup: parsed as unknown as BackupFile }
}

export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { categories, products, stockMovements, sales } = backup.data
  await db.transaction('rw', [db.categories, db.products, db.stockMovements, db.sales], async () => {
    await Promise.all([
      db.categories.clear(),
      db.products.clear(),
      db.stockMovements.clear(),
      db.sales.clear(),
    ])
    await db.categories.bulkPut(categories)
    await db.products.bulkPut(products)
    await db.stockMovements.bulkPut(stockMovements)
    await db.sales.bulkPut(sales)
  })
}

function getLastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

function markBackupDone(iso: string) {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, iso)
  } catch {
    // Sin localStorage el aviso seguirá apareciendo; el respaldo ya se descargó.
  }
  window.dispatchEvent(new Event(BACKUP_EVENT))
}

function subscribeLastBackup(onChange: () => void) {
  window.addEventListener(BACKUP_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(BACKUP_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useLastBackupAt(): string | null {
  return useSyncExternalStore(subscribeLastBackup, getLastBackupAt)
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function isStoragePersisted(): Promise<boolean> {
  if (!navigator.storage?.persisted) return false
  return navigator.storage.persisted()
}
