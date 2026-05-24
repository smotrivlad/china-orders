import { createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  return process.env.ADMIN_SECRET ?? process.env.TELEGRAM_BOT_TOKEN ?? 'fallback'
}

/**
 * Generates a deterministic 6-digit PIN for an order code.
 * Derived from HMAC-SHA256 — same code + secret always yields the same PIN.
 * Used as fallback when no DB pin is stored.
 */
export function generateOrderPin(orderCode: string): string {
  const hash = createHmac('sha256', secret())
    .update(`order-pin:${orderCode.toUpperCase()}`)
    .digest('hex')
  const num = parseInt(hash.slice(0, 8), 16) % 1_000_000
  return num.toString().padStart(6, '0')
}

/**
 * Returns the effective PIN for an order:
 *   - DB pin (admin override) if present and 6 chars
 *   - Otherwise HMAC-derived PIN
 */
export function resolvePin(orderCode: string, dbPin?: string | null): string {
  return dbPin?.trim().length === 6 ? dbPin.trim() : generateOrderPin(orderCode)
}

/**
 * Constant-time comparison: entered pin vs effective pin (DB or HMAC).
 */
export function checkPin(orderCode: string, entered: string, dbPin?: string | null): boolean {
  const expected = resolvePin(orderCode, dbPin)
  const a = Buffer.from(expected, 'utf8')
  const normalised = entered.trim().padEnd(expected.length, '\0').slice(0, expected.length)
  const b = Buffer.from(normalised, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Legacy: verify against HMAC only (kept for backward compat).
 * Prefer checkPin() for new code.
 */
export function verifyOrderPin(orderCode: string, enteredPin: string): boolean {
  return checkPin(orderCode, enteredPin, null)
}
