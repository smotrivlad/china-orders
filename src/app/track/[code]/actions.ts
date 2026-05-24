'use server'

import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { makeTrackAccessToken, expectedPin } from '@/lib/utils/trackAccess'

export async function verifyTrackPin(
  code: string,
  pin: string,
): Promise<{ ok: boolean; error?: string }> {
  const upperCode = code.toUpperCase()

  const { data: order } = await adminClient
    .from('orders')
    .select('contact')
    .eq('code', upperCode)
    .single()

  if (!order) return { ok: false, error: 'Заявка не найдена' }

  const want = expectedPin(order.contact ?? '')

  if (!want || pin.trim().toLowerCase() !== want) {
    return { ok: false, error: 'Неверный код. Проверьте и попробуйте снова.' }
  }

  const token = makeTrackAccessToken(upperCode)
  const cookieStore = await cookies()
  cookieStore.set(`track_${upperCode}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return { ok: true }
}
