import { createHmac } from 'crypto'

/**
 * Generates an HMAC access token for a given order code.
 * Stored in an httpOnly cookie to gate the track page.
 */
export function makeTrackAccessToken(code: string): string {
  const secret = process.env.ADMIN_SECRET ?? process.env.TELEGRAM_BOT_TOKEN ?? 'fallback'
  return createHmac('sha256', secret)
    .update(`track-access:${code.toUpperCase()}`)
    .digest('hex')
    .slice(0, 32)
}

/**
 * Returns the expected PIN for a contact.
 *   - @username  → last 4 chars (without @), lowercase
 *   - phone/other → last 4 digits
 */
export function expectedPin(contact: string): string {
  const c = contact.trim()
  if (c.startsWith('@')) {
    return c.slice(1).toLowerCase().slice(-4)
  }
  // Extract digits only
  const digits = c.replace(/\D/g, '')
  if (digits.length >= 4) return digits.slice(-4)
  // Fallback: last 4 chars of the whole contact
  return c.toLowerCase().slice(-4)
}

export type ContactType = 'phone' | 'username'

export function contactType(contact: string): ContactType {
  return contact.trim().startsWith('@') ? 'username' : 'phone'
}
