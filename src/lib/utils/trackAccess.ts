import { createHmac } from 'crypto'

/**
 * Generates an HMAC access token for a given order code.
 * Stored as an httpOnly cookie to gate the track page after PIN verification.
 * Valid for 24 hours (set by cookie maxAge).
 */
export function makeTrackAccessToken(code: string): string {
  const secret = process.env.ADMIN_SECRET ?? process.env.TELEGRAM_BOT_TOKEN ?? 'fallback'
  return createHmac('sha256', secret)
    .update(`track-access:${code.toUpperCase()}`)
    .digest('hex')
    .slice(0, 32)
}
