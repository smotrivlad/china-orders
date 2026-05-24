import { createHmac } from 'crypto'

function secret(): string {
  const s = process.env.ADMIN_SECRET ?? process.env.TELEGRAM_BOT_TOKEN
  if (!s) throw new Error('No secret available for subscribe token')
  return s
}

/**
 * Generates a 16-char hex HMAC token for a given order code.
 * Used to protect the bot subscription deep link against guessing.
 */
export function generateSubscribeToken(orderCode: string): string {
  return createHmac('sha256', secret())
    .update(`subscribe:${orderCode.toUpperCase()}`)
    .digest('hex')
    .slice(0, 16)
}

/**
 * Constant-time comparison of the provided token against the expected HMAC.
 */
export function verifySubscribeToken(orderCode: string, token: string): boolean {
  try {
    const expected = generateSubscribeToken(orderCode)
    if (expected.length !== token.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}

/**
 * Builds the Telegram start parameter: "CH-XXXX_<hex16>"
 * Used in deep links: https://t.me/bot?start=CH-1234_abc123...
 */
export function buildStartParam(orderCode: string): string {
  return `${orderCode.toUpperCase()}_${generateSubscribeToken(orderCode)}`
}

/**
 * Parses a Telegram start parameter back into code + token.
 * Returns null if format does not match CH-XXXX_<16hexchars>.
 */
export function parseStartParam(
  startParam: string,
): { orderCode: string; token: string } | null {
  const m = startParam.match(/^(CH-\d+)_([0-9a-f]{16})$/i)
  if (!m) return null
  return { orderCode: m[1].toUpperCase(), token: m[2].toLowerCase() }
}
