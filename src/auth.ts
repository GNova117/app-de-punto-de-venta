const PIN_KEY = 'pos:adminPin'
export const MIN_PIN_LENGTH = 4

interface StoredPin {
  salt: string
  hash: string
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

function readStoredPin(): StoredPin | null {
  try {
    const raw = localStorage.getItem(PIN_KEY)
    return raw ? (JSON.parse(raw) as StoredPin) : null
  } catch {
    return null
  }
}

export function hasAdminPin(): boolean {
  return readStoredPin() !== null
}

export async function setAdminPin(pin: string): Promise<void> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  const stored: StoredPin = { salt, hash: await hashPin(pin, salt) }
  localStorage.setItem(PIN_KEY, JSON.stringify(stored))
}

export async function verifyAdminPin(pin: string): Promise<boolean> {
  const stored = readStoredPin()
  if (!stored) return false
  return (await hashPin(pin, stored.salt)) === stored.hash
}
