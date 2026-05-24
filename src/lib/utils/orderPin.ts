import { createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  return process.env.ADMIN_SECRET ?? process.env.TELEGRAM_BOT_TOKEN ?? 'fallback'
}

/**
 * Generates a deterministic 6-digit PIN for an order code.
 * Derived from HMAC-SHA256 so it's always the same for a given code + secret.
 * No database column needed — the PIN is effectively "bound" to the order
 * through the application secret.
 *
 * Example: generateOrderPin('CH-1013') → '847293'
 */
export function generateOrderPin(orderCode: string): string {
  const hash = createHmac('sha256', secret())
    .update(`order-pin:${orderCode.toUpperCase()}`)
    .digest('hex')
  // First 8 hex chars → 32-bit uint → mod 1,000,000 → zero-pad to 6 digits
  const num = parseInt(hash.slice(0, 8), 16) % 1_000_000
  return num.toString().padStart(6, '0')
}

/**
 * Constant-time comparison to prevent timing-based enumeration attacks.
 */
export function verifyOrderPin(orderCode: string, enteredPin: string): boolean {
  const expected = generateOrderPin(orderCode)
  const a = Buffer.from(expected, 'utf8')
  // Pad/truncate entered pin to same length to keep timing safe
  const normalised = enteredPin.trim().padEnd(expected.length, '\0').slice(0, expected.length)
  const b = Buffer.from(normalised, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
