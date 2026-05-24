'use server'

import { cookies, headers } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { makeTrackAccessToken } from '@/lib/utils/trackAccess'
import { verifyOrderPin } from '@/lib/utils/orderPin'

const MAX_ATTEMPTS  = 5
const BLOCK_WINDOW  = 60 * 60 * 1000 // 1 hour in ms

/** Extract client IP from Vercel / standard reverse-proxy headers */
async function getIdentifier(): Promise<string> {
  const hdrs = await headers()
  return (
    hdrs.get('x-forwarded-for')?.split(',')[0].trim() ??
    hdrs.get('x-real-ip') ??
    'unknown'
  )
}

async function countRecentFailures(identifier: string): Promise<number> {
  const since = new Date(Date.now() - BLOCK_WINDOW).toISOString()
  const { count } = await adminClient
    .from('pin_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .gte('created_at', since)
  return count ?? 0
}

async function recordFailure(identifier: string): Promise<void> {
  await adminClient.from('pin_attempts').insert({ identifier })
}

async function clearFailures(identifier: string): Promise<void> {
  const since = new Date(Date.now() - BLOCK_WINDOW).toISOString()
  await adminClient.from('pin_attempts').delete()
    .eq('identifier', identifier)
    .gte('created_at', since)
}

export async function verifyTrackPin(
  code: string,
  pin: string,
): Promise<{ ok: boolean; error?: string; blocked?: boolean }> {
  const upperCode  = code.trim().toUpperCase()
  const identifier = await getIdentifier()

  // ── Rate limit check ──────────────────────────────────────────────────────
  try {
    const failures = await countRecentFailures(identifier)
    if (failures >= MAX_ATTEMPTS) {
      return {
        ok: false,
        blocked: true,
        error: `Слишком много неверных попыток. Попробуйте через 1 час.`,
      }
    }
  } catch {
    // pin_attempts table may not exist yet — skip rate limiting gracefully
  }

  // ── Verify order exists ──────────────────────────────────────────────────
  const { data: order } = await adminClient
    .from('orders')
    .select('code')
    .eq('code', upperCode)
    .single()

  if (!order) {
    // Don't reveal whether the code exists to avoid code enumeration
    try { await recordFailure(identifier) } catch { /* ignore */ }
    return { ok: false, error: 'Неверный код или PIN.' }
  }

  // ── Verify PIN ────────────────────────────────────────────────────────────
  const correct = verifyOrderPin(upperCode, pin)

  if (!correct) {
    try { await recordFailure(identifier) } catch { /* ignore */ }
    return { ok: false, error: 'Неверный PIN. Проверьте и попробуйте снова.' }
  }

  // ── Success: set access cookie ─────────────────────────────────────────
  const token = makeTrackAccessToken(upperCode)
  const cookieStore = await cookies()
  cookieStore.set(`track_${upperCode}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  // Clear failure count on successful login
  try { await clearFailures(identifier) } catch { /* ignore */ }

  return { ok: true }
}
